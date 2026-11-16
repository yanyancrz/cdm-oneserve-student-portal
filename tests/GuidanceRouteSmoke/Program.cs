using CDM_OneServe_API.Controllers.Guidance;
using CDM_OneServe_API.Hubs;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

// Discover actual MVC actions without starting the API or connecting to a database.
var services = new ServiceCollection();
services.AddLogging();
services.AddControllers().AddApplicationPart(typeof(GuidanceStudentController).Assembly);
using var provider = services.BuildServiceProvider();
var actions = provider.GetRequiredService<IActionDescriptorCollectionProvider>()
    .ActionDescriptors.Items.OfType<ControllerActionDescriptor>().ToList();
var guidance = actions.Where(a => a.ControllerTypeInfo == typeof(GuidanceStudentController) ||
    a.ControllerTypeInfo == typeof(GuidanceCounselorController) ||
    a.ControllerTypeInfo == typeof(GuidanceRescheduleController)).ToList();

if (guidance.Any(a => (a.AttributeRouteInfo?.Template ?? "").Contains("conversations")))
    throw new Exception("A Guidance messaging endpoint is still registered.");

foreach (var route in new[] {
    "api/guidance/student/counselors",
    "api/guidance/student/booking-rules",
    "api/guidance/student/availability",
    "api/guidance/student/appointments",
    "api/guidance/student/follow-ups",
    "api/guidance/counselor/appointments",
    "api/guidance/counselor/availability",
    "api/guidance/counselor/narrative-reports",
    "api/guidance/reschedules",
    "api/guidance/reschedules/rules",
    "api/guidance/reschedules/{appointmentId:int}/availability",
    "api/guidance/reschedules/{appointmentId:int}/proposals",
    "api/guidance/reschedules/{appointmentId:int}/accept",
}) {
    if (!guidance.Any(a => a.AttributeRouteInfo?.Template == route))
        throw new Exception($"Required Guidance route is missing: {route}");
}

if (typeof(GuidanceHub).GetMethod("JoinConversation") != null ||
    typeof(GuidanceHub).GetMethod("LeaveConversation") != null)
    throw new Exception("The Guidance hub still exposes conversation methods.");

Console.WriteLine($"PASS: Messaging endpoints and hub methods removed; {guidance.Count} Guidance actions remain registered.");

if (args.Contains("--rescheduling")) await RescheduleIntegration.Run();
