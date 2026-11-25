Guidance appointments now use mutual agreement for rescheduling. The appointment's official date, time and status stay unchanged while a proposal is pending. The proposing participant has agreed to that proposal; only the other participant may accept it. Acceptance checks current counselor availability and the existing student/day and counselor/slot booking constraints before confirming the new schedule.

Both participants can request a reschedule from the existing appointment list. New requests appear as a notification, a dashboard banner and a review dialog. Agree confirms the displayed proposal without opening a date picker. Disagree opens the existing month-calendar component to choose an alternative. This can repeat without a round limit. Students express their own availability on school weekdays, 7 AM–8 PM, using the configured session duration; counselors must propose or accept times within their actual availability. Holidays, the booking window, same-day settings, past times and existing student appointments are checked by the API. Proposed slots are not reserved. The counselor review dialog checks the proposed time against current availability before enabling Agree, and offers Disagree for another proposal. Acceptance revalidates availability on the server.

Each proposal records its author, original/proposed schedule, reason, optional instructions, response and timestamps. Accepted changes are also written to the existing `guidance_appointment_reschedules` history. Original-slot reminders, expiration and automatic no-show processing skip appointments with pending reschedules. Cancellation remains available; proposals for terminal appointments close and cannot be accepted. No chat or messaging functionality is involved.

Deployment order:

1. Apply `CDM-OneServe-API/Database/Guidance/010_mutual_rescheduling.sql` (also supplied in [010_mutual_rescheduling.sql](sql/010_mutual_rescheduling.sql)). It creates only `guidance_reschedule_proposals`; existing appointments and history are untouched. Existing Guidance migrations, including the unique booking indexes, must already be installed.
2. Deploy the updated API. This includes the model, context mapping, DTOs, rescheduling controller/service, service registration, notification routes, and appointment lifecycle changes. The old counselor PATCH reschedule endpoint now proposes a schedule instead of confirming it directly.
3. Deploy the frontend. Both Guidance layouts host the rescheduling dialogs and refresh appointment data on notification events, local changes, focus and proposal polling. The existing Manage Availability screen uses the same proposal workflow.

Production deployment completed on November 16, 2026: the additive proposal-table migration was applied after verifying both existing appointment conflict indexes; existing appointment records were preserved. The Azure API and Vercel frontend were deployed successfully. Read-only live checks passed for Student and Counselor proposal/rules endpoints, and the production JavaScript bundle includes the counselor availability review. No real appointment or notification was created by these checks.

Validation:

```powershell
npm.cmd run build
dotnet build ..\CDM-OneServe-API --no-restore
dotnet run --project tests/GuidanceRouteSmoke/GuidanceRouteSmoke.csproj --no-restore -- --rescheduling
node --test tests/handwrittenDocument.test.mjs
node --test ../CDM-OneServe-API/push-service/tests/guidanceNotificationPolicy.test.mjs
```

The optional `--rescheduling` integration test requires local MySQL at `127.0.0.1`, user `root`, with `GUIDANCE_TEST_MYSQL_PASSWORD` if needed. It creates and removes only a randomly named `oneserve_reschedule_test_*` database. It uses fake holiday/push services and never accesses an application database or sends real notifications. It covers mutual consent, ownership, stale and duplicate responses, repeated counterproposals, schedule conflicts, notifications, history, cancellation, and negotiation-aware lifecycle processing.
