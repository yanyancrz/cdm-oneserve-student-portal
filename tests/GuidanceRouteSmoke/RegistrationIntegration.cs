using CDM_OneServe_API.Controllers;
using CDM_OneServe_API.Data;
using CDM_OneServe_API.DTOs;
using CDM_OneServe_API.Models;
using CDM_OneServe_API.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using System.Text.Json;

public static class RegistrationIntegration
{
    public static async Task Run(AppDbContext db)
    {
        void Check(bool condition, string message) { if (!condition) throw new Exception(message); }
        AuthController Controller(RecordingEmail email) => new(db, email, null!, new ConfigurationBuilder().Build(), null!, null!, null!, null!, NullLogger<AuthController>.Instance);
        var facultyEmail = new RecordingEmail();
        var facultyController = Controller(facultyEmail);
        db.SchoolRecords.Add(new SchoolRecord { IdNumber = "CUSTOM-FACULTY", Role = "Student" });
        await db.SaveChangesAsync();
        var facultyResult = await facultyController.Register(new RegisterRequest { IdNumber = "CUSTOM-FACULTY", Email = "faculty-registration@test.invalid", Role = "Faculty" });
        Check(facultyResult is OkObjectResult, "Faculty registration still requires a matching roster role");
        var facultyCredentials = await facultyEmail.Sent.Task.WaitAsync(TimeSpan.FromSeconds(10));
        var faculty = await db.Users.SingleAsync(x => x.IdNumber == "CUSTOM-FACULTY");
        Check(faculty.Role == "Faculty" && faculty.AccountStatus == "Active" && faculty.MustChangePassword, "Faculty account flow changed");
        Check(BCrypt.Net.BCrypt.Verify(facultyCredentials.Password, faculty.PasswordHash), "Emailed faculty password does not match the account");
        Check(facultyCredentials.Email == faculty.Email && facultyCredentials.Id == faculty.IdNumber, "Faculty credentials went to the wrong address or ID");
        Check(!await db.SchoolRecords.AnyAsync(x => x.IsUsed), "Registration unexpectedly changed school records");

        // Prove that neither registration endpoint depends on a roster table.
        await db.Database.ExecuteSqlRawAsync("DROP TABLE school_records");
        var studentEmail = new RecordingEmail();
        var studentController = Controller(studentEmail);
        var bytes = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j+XcAAAAASUVORK5CYII=");
        using var stream = new MemoryStream(bytes);
        var document = new FormFile(stream, 0, bytes.Length, "supportingDocument", "student.png") { Headers = new HeaderDictionary(), ContentType = "image/png" };
        var studentResult = await studentController.RegisterWithDocument(new RegisterRequest { IdNumber = "  CUSTOM-STUDENT  ", Email = "student-registration@test.invalid", Role = "Student" }, document);
        Check(studentResult is OkObjectResult, "Mobile registration still depends on School Records");
        var credentials = await studentEmail.Sent.Task.WaitAsync(TimeSpan.FromSeconds(10));
        var student = await db.Users.SingleAsync(x => x.IdNumber == "CUSTOM-STUDENT");
        Check(student.Role == "Student" && student.IsVerified && !student.IsProfileComplete && student.MustChangePassword, "Student onboarding flow changed");
        Check(credentials.Email == student.Email && credentials.Id == student.IdNumber && BCrypt.Net.BCrypt.Verify(credentials.Password, student.PasswordHash), "Student emailed credentials do not match the account");
        Check((await db.RegistrationDocuments.SingleAsync(x => x.UserId == student.Id)).Content.SequenceEqual(bytes), "Supporting document was not saved");
        Check(!JsonSerializer.Serialize(((OkObjectResult)studentResult).Value).Contains(credentials.Password), "Registration response exposed the generated password");
        Check(await studentController.Register(new RegisterRequest { IdNumber = "custom - student", Email = "other@test.invalid", Role = "Student" }) is BadRequestObjectResult, "Duplicate ID validation was removed");
        Check(await studentController.Register(new RegisterRequest { IdNumber = "NEW-ID", Email = "STUDENT-REGISTRATION@test.invalid", Role = "Student" }) is BadRequestObjectResult, "Duplicate email validation was removed");
        Check(await studentController.Register(new RegisterRequest { IdNumber = "NEW-ID", Email = "other@test.invalid", Role = "Admin" }) is BadRequestObjectResult, "Registration granted a privileged role");
        Check(await studentController.Register(new RegisterRequest { IdNumber = " ", Email = "other@test.invalid", Role = "Student" }) is BadRequestObjectResult, "Blank ID validation was removed");
        Check(await studentController.RegisterWithDocument(new RegisterRequest { IdNumber = "NEW-ID", Email = "other@test.invalid", Role = "Student" }, null) is BadRequestObjectResult, "Supporting document requirement was removed");
        Console.WriteLine("PASS: registration without a school roster, Student/Faculty roles, document persistence, emailed generated credentials, duplicate checks and onboarding flags.");
    }

    private sealed class RecordingEmail() : EmailService(new EmailSettings())
    {
        public TaskCompletionSource<(string Email, string Id, string Password)> Sent { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public override Task SendCredentialsAsync(string recipientEmail, string idNumber, string password)
        {
            Sent.TrySetResult((recipientEmail, idNumber, password));
            return Task.CompletedTask;
        }
    }
}
