Registration supporting documents are stored in MySQL, including the actual
PDF/JPEG/PNG bytes, original filename, MIME type, upload time (UTC), and user ID.
The upload limit is 5 MB. No public filesystem URL is created.

Before deploying the updated API, run
`CDM-OneServe-API/Database/Auth/006_registration_documents.sql` against the
configured OneServe database. This creates `registration_documents` without
changing existing users. The migration is safe to rerun.

`POST /api/auth/register-with-document` accepts multipart fields `idNumber`,
`email`, `role`, and `supportingDocument`. File extensions, MIME types, and file
signatures are checked before registration. EF saves the user and document in
one transaction; failed registrations do not persist a document. The original
JSON registration endpoint remains available for older clients.

Existing documents from the earlier filesystem implementation are not migrated
by this schema script. Database credentials and uploaded documents must never
be committed to source control.
