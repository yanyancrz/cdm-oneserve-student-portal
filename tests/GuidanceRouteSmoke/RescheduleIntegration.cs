using System.Net;
using CDM_OneServe_API.Data;
using CDM_OneServe_API.Hubs;
using CDM_OneServe_API.Models;
using CDM_OneServe_API.Models.Guidance;
using CDM_OneServe_API.DTOs.Guidance;
using CDM_OneServe_API.Services.Guidance;
using CDM_OneServe_API.Services.Notifications;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using MySqlConnector;

public static class RescheduleIntegration
{
    public static async Task Run()
    {
        // This test only creates/drops its own random database on LOCAL MySQL.
        // No deployed application database, notifications, email or push service is used.
        var database = "oneserve_reschedule_test_" + Guid.NewGuid().ToString("N");
        var adminString = new MySqlConnectionStringBuilder {
            Server = "127.0.0.1", UserID = "root",
            // This isolated test connects only to loopback, without Windows TLS credentials.
            SslMode = MySqlSslMode.Disabled,
            Password = Environment.GetEnvironmentVariable("GUIDANCE_TEST_MYSQL_PASSWORD") ?? ""
        };
        await using var admin = new MySqlConnection(adminString.ConnectionString);
        await admin.OpenAsync();
        await new MySqlCommand($"CREATE DATABASE `{database}`", admin).ExecuteNonQueryAsync();
        var connection = new MySqlConnectionStringBuilder(adminString.ConnectionString) { Database = database }.ConnectionString;
        var options = new DbContextOptionsBuilder<AppDbContext>().UseMySql(connection, new MySqlServerVersion(new Version(8, 0, 0))).Options;
        try {
            await using (var db = new AppDbContext(options)) {
                await db.Database.EnsureCreatedAsync();
                await db.Database.ExecuteSqlRawAsync("DROP TABLE guidance_reschedule_proposals");
                var migration = await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "010_mutual_rescheduling.sql"));
                await db.Database.ExecuteSqlRawAsync(migration);
                // Reproduce the deployed appointment conflict constraints, which are generated-column SQL indexes.
                // The manual Guidance base-table SQL does not create appointment->user foreign keys;
                // remove the extra cascading keys added by EnsureCreated before adding its generated keys.
                foreach (var key in db.Model.FindEntityType(typeof(GuidanceAppointment))!.GetForeignKeys())
                    await db.Database.ExecuteSqlRawAsync($"ALTER TABLE guidance_appointments DROP FOREIGN KEY `{key.GetConstraintName()}`");
                await db.Database.ExecuteSqlRawAsync("""
                    ALTER TABLE guidance_appointments MODIFY TimeSlot varchar(20) NOT NULL,
                    ADD COLUMN ActiveCounselorKey int GENERATED ALWAYS AS
                        (IF(Status IN ('Pending','Confirmed','Arrived','Completed'), CounselorId, NULL)) STORED,
                    ADD COLUMN ActiveStudentKey int GENERATED ALWAYS AS
                        (IF(Status IN ('Pending','Confirmed','Arrived','Completed'), StudentId, NULL)) STORED,
                    ADD UNIQUE KEY uq_ga_active_slot (ActiveCounselorKey, Date, TimeSlot),
                    ADD UNIQUE KEY uq_ga_active_student_day (ActiveStudentKey, Date)
                    """);
                db.Users.AddRange(new User { Id = 1, FullName = "Counselor", Role = "Counselor", IdNumber = "C1", Email = "c@test.invalid" },
                    new User { Id = 2, FullName = "Student", IdNumber = "S2", Email = "s@test.invalid" },
                    new User { Id = 3, FullName = "Other", IdNumber = "S3", Email = "o@test.invalid" });
                for (var d = 1; d <= 5; d++) db.GuidanceAvailabilities.Add(new() {
                    CounselorId = 1, DayOfWeek = d, StartTime = TimeSpan.FromHours(8), EndTime = TimeSpan.FromHours(17), IsActive = true });
                await db.SaveChangesAsync();
            }
            using var services = new ServiceCollection().AddLogging().AddSignalR().Services.BuildServiceProvider();
            var hub = services.GetRequiredService<IHubContext<GuidanceHub>>();
            GuidanceRescheduleService Service(AppDbContext db) {
                var settings = new GuidanceSettingsService(db);
                var holidays = new GuidanceHolidayService(new EmptyHolidayClient(), NullLogger<GuidanceHolidayService>.Instance);
                return new(db, new GuidanceScheduleService(db, settings, holidays), settings, holidays,
                    new GuidanceNotificationService(db, hub, new NoPush()), NullLogger<GuidanceRescheduleService>.Instance);
            }
            var days = Enumerable.Range(1, 25).Select(n => GuidanceClock.Today.AddDays(n))
                .Where(d => d.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday).ToList();
            async Task<int> Appointment(int student, int day) {
                await using var db = new AppDbContext(options);
                var a = new GuidanceAppointment { StudentId = student, CounselorId = 1, Date = days[day], TimeSlot = "9:00 AM", Status = "Confirmed" };
                db.Add(a); await db.SaveChangesAsync(); return a.Id;
            }
            async Task<GuidanceResult<object>> Propose(int actor, bool counselor, int id, int day, string slot, int? previous = null) {
                await using var db = new AppDbContext(options);
                return await Service(db).ProposeAsync(actor, counselor, id, new() {
                    Date = days[day].ToString("yyyy-MM-dd"), TimeSlot = slot, Reason = "Schedule conflict", PreviousProposalId = previous
                }, default);
            }
            async Task<int> Pending(int id) {
                await using var db = new AppDbContext(options);
                return await db.GuidanceRescheduleProposals.Where(p => p.AppointmentId == id && p.Status == "Pending").Select(p => p.Id).SingleAsync();
            }
            async Task<GuidanceResult<object>> Accept(int actor, bool counselor, int id, int proposal) {
                await using var db = new AppDbContext(options);
                return await Service(db).AcceptAsync(actor, counselor, id, proposal, default);
            }
            void Check(bool value, string message) { if (!value) throw new Exception(message); }

            var id = await Appointment(2, 0);
            Check((await Propose(1, true, id, 1, "10:00 AM")).Success, "Counselor proposal failed");
            var first = await Pending(id);
            await using (var db = new AppDbContext(options)) {
                Check((await db.GuidanceAppointments.FindAsync(id))!.Date == days[0], "Proposal changed the official appointment");
            }
            Check((await Accept(1, true, id, first)).Status == 409, "Proposer accepted their own request");
            Check((await Accept(3, false, id, first)).Status == 404, "Another student accessed the appointment");
            Check((await Accept(2, false, id, first)).Success, "Student direct agreement failed");
            Check((await Accept(2, false, id, first)).Status == 409, "Duplicate acceptance was not rejected");
            await using (var db = new AppDbContext(options)) {
                var a = (await db.GuidanceAppointments.FindAsync(id))!;
                Check(a.Date == days[1] && a.TimeSlot == "10:00 AM" && a.Status == "Confirmed", "Agreed schedule was not confirmed");
                Check(await db.GuidanceAppointmentReschedules.CountAsync() == 1, "Duplicate or missing history");
                Check(await db.Notifications.CountAsync(n => n.Type.Contains("RESCHEDULE")) == 3, "Proposal/final notifications missing");
            }
            Check((await Propose(1, true, id, 2, "10:00 AM")).Success, "Second proposal failed");
            var second = await Pending(id);
            await using (var db = new AppDbContext(options)) {
                db.GuidanceDayOffs.Add(new() { CounselorId = 1, Date = days[3], Reason = "Not available" }); await db.SaveChangesAsync();
            }
            Check((await Propose(2, false, id, 3, "11:00 AM", second)).Success, "Student cannot express their preferred availability");
            var third = await Pending(id);
            Check((await Accept(1, true, id, third)).Status == 409, "Unavailable counselor schedule was confirmed");
            Check((await Accept(2, false, id, second)).Status == 409, "Stale proposal was accepted");
            Check((await Propose(1, true, id, 4, "11:30 AM", third)).Success, "Counselor counterproposal failed");
            Check((await Accept(2, false, id, await Pending(id))).Success, "Agreement after repeated counterproposals failed");

            // Two separate appointments negotiate the same slot. Proposals do not reserve it;
            // concurrent acceptances must commit exactly one confirmed appointment.
            var other = await Appointment(3, 5);
            Check((await Propose(1, true, id, 6, "2:00 PM")).Success, "First competing proposal failed");
            Check((await Propose(1, true, other, 6, "2:00 PM")).Success, "Second competing proposal failed");
            var outcomes = await Task.WhenAll(Accept(2, false, id, await Pending(id)), Accept(3, false, other, await Pending(other)));
            Check(outcomes.Count(r => r.Success) == 1 && outcomes.Count(r => r.Status == 409) == 1, "Concurrent confirmations conflicted");
            await using (var db = new AppDbContext(options)) {
                Check(await db.GuidanceAppointments.CountAsync(a => a.Date == days[6] && a.TimeSlot == "2:00 PM" && a.Status == "Confirmed") == 1, "Duplicate confirmed slot");
            }
            int waitingConfirmed, waitingPending;
            await using (var db = new AppDbContext(options)) {
                var a = new GuidanceAppointment { StudentId = 2, CounselorId = 1, Date = GuidanceClock.Today.AddDays(-1), TimeSlot = "9:00 AM", Status = "Confirmed" };
                var b = new GuidanceAppointment { StudentId = 3, CounselorId = 1, Date = GuidanceClock.Today.AddDays(-1), TimeSlot = "11:00 AM", Status = "Pending" };
                db.AddRange(a, b); await db.SaveChangesAsync(); waitingConfirmed = a.Id; waitingPending = b.Id;
            }
            Check((await Propose(1, true, waitingConfirmed, 8, "9:00 AM")).Success, "Old confirmed appointment proposal failed");
            Check((await Propose(1, true, waitingPending, 8, "11:00 AM")).Success, "Old pending appointment proposal failed");
            var cancelProposal = await Pending(waitingPending);
            await using (var db = new AppDbContext(options)) {
                var settings = new GuidanceSettingsService(db);
                var holidays = new GuidanceHolidayService(new EmptyHolidayClient(), NullLogger<GuidanceHolidayService>.Instance);
                var schedule = new GuidanceScheduleService(db, settings, holidays);
                var notifications = new GuidanceNotificationService(db, hub, new NoPush());
                var counselor = new GuidanceCounselorService(db, schedule, notifications, null!, NullLogger<GuidanceCounselorService>.Instance);
                var student = new GuidanceStudentService(db, schedule, notifications, settings, null!, NullLogger<GuidanceStudentService>.Instance);
                Check(await counselor.AutoTerminateNoShowsAsync(default) == 0, "Negotiation was marked no-show");
                Check(await student.ExpireStaleAsync(default) == 0, "Negotiation expired");
                Check(!(await counselor.UpdateStatusAsync(1, waitingPending, "Confirmed", default)).Success, "Normal confirmation bypassed reschedule agreement");
                Check((await student.CancelAsync(3, waitingPending, default)).Success, "Pending negotiation cannot be cancelled");
                db.GuidanceAppointments.AddRange(
                    new() { StudentId = 2, CounselorId = 1, Date = GuidanceClock.Today.AddDays(-2), TimeSlot = "9:00 AM", Status = "Confirmed" },
                    new() { StudentId = 3, CounselorId = 1, Date = GuidanceClock.Today.AddDays(-2), TimeSlot = "11:00 AM", Status = "Pending" });
                await db.SaveChangesAsync();
                Check(await counselor.AutoTerminateNoShowsAsync(default) == 1, "Ordinary no-show processing broke");
                Check(await student.ExpireStaleAsync(default) == 1, "Ordinary expiration broke");
            }
            Check((await Accept(3, false, waitingPending, cancelProposal)).Status == 409, "Cancelled appointment accepted a proposal");
            Console.WriteLine("PASS: mutual consent, ownership, direct agreement, notifications/history, repeated counters, stale/duplicate responses, calendar revalidation, concurrent conflicts, cancellation, and negotiation-aware lifecycle processing.");
            await using (var db = new AppDbContext(options)) await ServiceOversightIntegration.Run(db);
            await using (var db = new AppDbContext(options)) await NarrativePermissionIntegration.Run(db);
            await using (var db = new AppDbContext(options)) await RegistrationIntegration.Run(db);
        } finally {
            MySqlConnection.ClearAllPools();
            if (!database.StartsWith("oneserve_reschedule_test_") || database.Length != 57) throw new Exception("Unsafe test database cleanup target");
            await new MySqlCommand($"DROP DATABASE `{database}`", admin).ExecuteNonQueryAsync();
        }
    }

    private sealed class EmptyHolidayClient : IHttpClientFactory {
        public HttpClient CreateClient(string name) => new(new EmptyHolidayHandler());
    }
    private sealed class EmptyHolidayHandler : HttpMessageHandler {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("[]") });
    }
    private sealed class NoPush : IPushDispatcher {
        public Task<bool> EnqueueAsync(PushNotification n, CancellationToken ct = default) => Task.FromResult(false);
        public Task<int> EnqueueBroadcastAsync(PushNotification n, CancellationToken ct = default) => Task.FromResult(0);
        public Task FlushAsync(CancellationToken ct = default) => Task.CompletedTask;
        public Task<bool> EnqueueTestAsync(int id, int? subscription = null, CancellationToken ct = default) => Task.FromResult(false);
    }
}
