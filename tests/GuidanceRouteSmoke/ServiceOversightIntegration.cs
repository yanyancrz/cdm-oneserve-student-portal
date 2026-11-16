using CDM_OneServe_API.Data;
using CDM_OneServe_API.Models.Library;
using CDM_OneServe_API.Models.LostFound;
using CDM_OneServe_API.Models.Guidance;
using CDM_OneServe_API.Services.Admin.Platform;
using System.Text.Json;

public static class ServiceOversightIntegration
{
    public static async Task Run(AppDbContext db)
    {
        var now = DateTime.UtcNow;
        var book = new Book { Title = "Oversight test book", ISBN = "1234567890", Author = "Test", Category = "Reference", TotalCopies = 2, AvailableCopies = 1, CreatedAt = now, UpdatedAt = now };
        var report = new LostFoundReport { UserId = 2, ItemName = "Oversight test wallet", Category = "Personal", ReportType = "Found", CreatedAt = now, DateLostFound = now };
        db.AddRange(book, report);
        await db.SaveChangesAsync();
        var claim = new ClaimRecord { ReportId = report.ReportId, ClaimedByUserId = 2, ClaimDate = now, Status = "Approved", ProofAttachmentPath = "PRIVATE_PROOF_SENTINEL", OwnershipExplanation = "PRIVATE_OWNERSHIP_SENTINEL" };
        db.Add(claim);
        db.Add(new BorrowTransaction { BookId = book.BookId, UserId = 2, BorrowDate = now, DueDate = now.AddDays(7), CreatedAt = now });
        db.Add(new Reservation { BookId = book.BookId, UserId = 3, ReservationAt = now, ExpirationDate = now.AddDays(1), Status = "Pending", CreatedAt = now });
        db.Add(new GuidanceCounselingRecord { StudentId = 2, CounselorId = 1, SessionDate = DateOnly.FromDateTime(now), Status = "Draft", ReportTitle = "PRIVATE_TITLE_SENTINEL", SessionSummary = "PRIVATE_NARRATIVE_SENTINEL", PrivateNotes = "PRIVATE_NOTES_SENTINEL", UpdatedAt = now });
        await db.SaveChangesAsync();
        db.Add(new ClaimSchedule { ClaimId = claim.ClaimId, ClaimantUserId = 2, ScheduledDateTime = now.AddDays(1), PickupLocation = "Admin office", CreatedAt = now });
        await db.SaveChangesAsync();
        var service = new AdminServiceSummaryService(db);
        var library = await service.GetLibraryAsync();
        var lostFound = await service.GetLostFoundAsync();
        var guidance = await service.GetGuidanceAsync();
        void Check(bool ok, string message) { if (!ok) throw new Exception(message); }
        Check(library.RecentRecords["inventory"].Single().Title == book.Title, "Inventory records missing");
        Check(library.RecentRecords["circulation"].Single().ScheduledFor.HasValue, "Loan due date missing");
        Check(library.RecentRecords["reservations"].Single().Status == "Pending", "Reservations missing");
        Check(lostFound.RecentRecords["claims"].Single().Id == claim.ClaimId, "Claims missing");
        Check(lostFound.RecentRecords["pickups"].Single().Detail == "Admin office", "Pickup location missing");
        Check(guidance.RecentRecords["appointments"].Count > 0, "Recent appointments missing");
        Check(guidance.RecentRecords["systems"].Single().Status == "Draft", "Report metadata missing");
        Check(!JsonSerializer.Serialize(new { library, lostFound, guidance }).Contains("PRIVATE_"), "Confidential content leaked into oversight");
        Console.WriteLine("PASS: recent books, loans, reservations, claims, pickups, appointments and report metadata; confidential fields excluded.");
    }
}
