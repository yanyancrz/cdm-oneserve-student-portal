-- =========================================================
-- CDM OneServe — School Records seed (MySQL)
--
-- The backend owns this table (see CDM-OneServe-API /
-- Database/Auth/003_school_records.sql + EF migration
-- AddSchoolRecords). Run the backend script or
-- `dotnet ef database update` — this file is only a mirror
-- so the mobile repo documents the same 20 official IDs.
--
-- These Student ID Numbers are the ONLY ones allowed to
-- register. Safe to re-run (INSERT IGNORE = no duplicates).
-- =========================================================

INSERT IGNORE INTO `school_records` (`IdNumber`, `Role`, `IsUsed`) VALUES
    ('23-00387', 'Student', 0),
    ('23-00534', 'Student', 0),
    ('23-00014', 'Student', 0),
    ('23-00665', 'Student', 0),
    ('23-00626', 'Student', 0),
    ('23-01551', 'Student', 0),
    ('23-01053', 'Student', 0),
    ('23-00970', 'Student', 0),
    ('23-01241', 'Student', 0),
    ('23-01062', 'Student', 0),
    ('23-01218', 'Student', 0),
    ('22-00955', 'Student', 0),
    ('23-00636', 'Student', 0),
    ('23-00050', 'Student', 0),
    ('23-00148', 'Student', 0),
    ('23-00951', 'Student', 0),
    ('23-00839', 'Student', 0),
    ('21-01426', 'Student', 0),
    ('23-00535', 'Student', 0),
    ('23-00041', 'Student', 0);

-- Verify:
-- SELECT `IdNumber`, `Role`, `IsUsed` FROM `school_records` ORDER BY `IdNumber`;
