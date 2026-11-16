using System.Security.Claims;
using CDM_OneServe_API.Authorization;
using CDM_OneServe_API.Data;
using CDM_OneServe_API.Models;
using CDM_OneServe_API.Models.Platform;
using CDM_OneServe_API.Services.Admin.Platform;
using CDM_OneServe_API.Services.Guidance;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

public static class NarrativePermissionIntegration
{
    public static async Task Run(AppDbContext db)
    {
        db.Users.AddRange(
            new User { Id = 4, FullName = "Test super administrator", IdNumber = "SA4", Email = "sa@test.invalid", Role = "SuperAdmin", AccountStatus = "Active" },
            new User { Id = 5, FullName = "Test administrator", IdNumber = "A5", Email = "a@test.invalid", Role = "Admin", AccountStatus = "Active" },
            new User { Id = 6, FullName = "Inactive super administrator", IdNumber = "SA6", Email = "inactive@test.invalid", Role = "SuperAdmin", AccountStatus = "Inactive" });
        await db.SaveChangesAsync();
        var filter = new CentralGuidancePermissionFilter(new PermissionService(db));
        async Task Check(int actor, string role, string method, string path, bool expected)
        {
            var http = new DefaultHttpContext();
            http.Request.Method = method;
            http.Request.Path = path;
            http.User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, actor.ToString()), new Claim(ClaimTypes.Role, role) }, "Test"));
            var action = new ActionContext(http, new RouteData(), new ActionDescriptor());
            var metadata = new List<IFilterMetadata>();
            var context = new ActionExecutingContext(action, metadata, new Dictionary<string, object?>(), new object());
            var called = false;
            await filter.OnActionExecutionAsync(context, () => { called = true; return Task.FromResult(new ActionExecutedContext(action, metadata, new object())); });
            if (called != expected || !called && (context.Result as ObjectResult)?.StatusCode != 403)
                throw new Exception($"Narrative access check failed: {role}/{actor} {method} {path}");
            if (called && role == "SuperAdmin" && http.Response.Headers.CacheControl != "no-store, private")
                throw new Exception("Narrative access must prevent response caching");
        }
        const string prefix = "/api/admin/guidance/narrative-reports";
        foreach (var suffix in new[] { "", "/stats", "/11", "/11/events", "/11/export", "/11/attachments/1/download" })
            await Check(4, "SuperAdmin", "GET", prefix + suffix, true);
        await Check(4, "SuperAdmin", "HEAD", prefix, true);
        foreach (var method in new[] { "POST", "PUT", "PATCH", "DELETE" })
            await Check(4, "SuperAdmin", method, prefix + "/11", false);
        await Check(5, "Admin", "GET", prefix, false);
        await Check(5, "SuperAdmin", "GET", prefix, false); // stale token after role removal
        await Check(6, "SuperAdmin", "GET", prefix, false);
        await Check(0, "SuperAdmin", "GET", prefix, false);
        await Check(4, "SuperAdmin", "POST", "/api/admin/guidance/reports/narrative/files", false);
        await Check(4, "SuperAdmin", "GET", "/api/admin/guidance/students/2", false);
        await Check(1, "GuidanceAdmin", "GET", prefix, true); // existing Guidance role flow stays unchanged
        db.UserPermissionOverrides.Add(new UserPermissionOverride { UserId = 4, PermissionKey = PermissionCatalog.GuidanceView, Level = PermissionLevels.None });
        await db.SaveChangesAsync();
        await Check(4, "SuperAdmin", "GET", prefix, false);
        var narrative = new GuidanceNarrativeService(db, null!, NullLogger<GuidanceNarrativeService>.Instance);
        var reportId = await db.GuidanceCounselingRecords.Select(x => x.Id).FirstAsync();
        var detail = await narrative.GetAdminDetailAsync(4, "SuperAdmin", reportId, false, default);
        if (!detail.Success || detail.Data!.PrivateNotes != null || !detail.Data.PrivateNotesRedacted || detail.Data.SessionSummary == null)
            throw new Exception("Read-only report access must return narrative text and redact private notes");
        Console.WriteLine("PASS: SuperAdmin narrative reads; writes, regular Admin, stale/inactive/revoked access denied; private notes redacted.");
    }
}
