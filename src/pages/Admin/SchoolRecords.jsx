import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../../config/api";
import toast from "react-hot-toast";

export default function SchoolRecords() {
    const [activeTab, setActiveTab] = useState("students");

    const [students, setStudents] = useState([]);
    const [faculty, setFaculty] = useState([]);

    const [search, setSearch] = useState("");
    const [selectedInstitute, setSelectedInstitute] = useState("");
    const [selectedProgram, setSelectedProgram] = useState("");
    const [accountFilter, setAccountFilter] = useState("All accounts");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [selectedRecord, setSelectedRecord] = useState(null);
    const [selectedType, setSelectedType] = useState(null);

    // IMPORT
    const [showImportModal, setShowImportModal] = useState(false);
    const [importType, setImportType] = useState("student");
    const [selectedFile, setSelectedFile] = useState(null);
    const [importing, setImporting] = useState(false);

    const [academicYear, setAcademicYear] = useState("");
    const [semester, setSemester] = useState("");

    const fileInputRef = useRef(null);

    const adminId = localStorage.getItem("userId");

    // =========================================================
    // INSTITUTE / PROGRAM MAPPING
    // =========================================================

    const INSTITUTE_PROGRAMS = {
        "Institute of Computing Studies": [
            "Bachelor of Science in Computer Engineering",
            "Bachelor of Science in Information Technology",
            "BS Information Technology",
            "BS IT",
        ],

        "Institute of Teacher Education": [
            "Bachelor of Early Childhood Education",
            "Bachelor of Technology and Livelihood Education Major in Information and Communication Technology",
            "Bachelor of Science in Secondary Education Major in Science",
            "Bachelor of Elementary Education Major in General Education",
            "Teacher Certificate Program",
        ],

        "Institute of Business and Entrepreneurship": [
            "Bachelor of Science in Business Administration Major in Human Resource Management",
            "Bachelor of Science in Entrepreneurship",
        ],
    };

    const institutes = Object.keys(INSTITUTE_PROGRAMS);

    const availablePrograms = selectedInstitute
        ? INSTITUTE_PROGRAMS[selectedInstitute] || []
        : [];

    useEffect(() => {
        setSelectedProgram("");
    }, [selectedInstitute]);

    // =========================================================
    // LOAD STUDENTS
    // =========================================================

    const loadStudents = async () => {
        const response = await fetch(
            `${API_URL}/api/admin/school-records/students`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data?.message ||
                    "Failed to load student records."
            );
        }

        setStudents(
            Array.isArray(data)
                ? data
                : []
        );
    };

    // =========================================================
    // LOAD FACULTY
    // =========================================================

    const loadFaculty = async () => {
        const response = await fetch(
            `${API_URL}/api/admin/school-records/faculty`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data?.message ||
                    "Failed to load faculty records."
            );
        }

        setFaculty(
            Array.isArray(data)
                ? data
                : []
        );
    };

    // =========================================================
    // LOAD ALL
    // =========================================================

    const loadRecords = async () => {
        try {
            setLoading(true);

            await Promise.all([
                loadStudents(),
                loadFaculty(),
            ]);
        } catch (error) {
            console.error(error);

            toast.error(
                error.message ||
                    "Unable to load school records."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRecords();
    }, []);

    // =========================================================
    // REFRESH
    // =========================================================

    const handleRefresh = async () => {
        try {
            setRefreshing(true);

            await Promise.all([
                loadStudents(),
                loadFaculty(),
            ]);

            toast.success("Records refreshed.");
        } catch (error) {
            console.error(error);

            toast.error(
                error.message ||
                    "Unable to refresh records."
            );
        } finally {
            setRefreshing(false);
        }
    };

    // =========================================================
    // SYSTEM ACCOUNT STATUS
    // =========================================================

    const getAccountStatus = (record) => {
        if (!record?.hasSystemAccount) {
            return "No Account";
        }

        const status =
            record?.systemAccountStatus?.toLowerCase();

        if (
            status === "approved" ||
            status === "active"
        ) {
            return "Active";
        }

        if (status === "pending") {
            return "Pending";
        }

        if (status === "suspended") {
            return "Suspended";
        }

        return record?.systemAccountStatus || "Active";
    };

    const getAccountStatusStyle = (record) => {
        switch (getAccountStatus(record)) {
            case "Active":
                return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";

            case "Pending":
                return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";

            case "Suspended":
                return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";

            case "No Account":
            default:
                return "bg-gray-100 text-gray-500 ring-1 ring-gray-200";
        }
    };

    // =========================================================
    // FILTER STUDENTS
    // =========================================================

    const filteredStudents = useMemo(() => {
        const query = search.trim().toLowerCase();

        const filtered = students.filter((student) => {
            const matchesSearch =
                !query ||
                [
                    student.studentIdNumber,
                    student.fullName,
                    student.email,
                    student.institute,
                    student.course,
                    student.yearLevel,
                    student.enrollmentStatus,
                    student.academicYear,
                    student.semester,
                    getAccountStatus(student),
                ]
                    .filter(Boolean)
                    .some((value) =>
                        String(value)
                            .toLowerCase()
                            .includes(query)
                    );

            const matchesInstitute =
                !selectedInstitute ||
                student.institute === selectedInstitute;

            const matchesProgram =
                !selectedProgram ||
                student.course === selectedProgram;

            const matchesAccount =
                accountFilter === "All accounts" ||
                getAccountStatus(student) === accountFilter;

            return (
                matchesSearch &&
                matchesInstitute &&
                matchesProgram &&
                matchesAccount
            );
        });

        return filtered.sort(
            (a, b) =>
                new Date(b.createdAt || 0) -
                new Date(a.createdAt || 0)
        );
    }, [
        students,
        search,
        selectedInstitute,
        selectedProgram,
        accountFilter,
    ]);

    // =========================================================
    // FILTER FACULTY
    // =========================================================

    const filteredFaculty = useMemo(() => {
        const query = search.trim().toLowerCase();

        const filtered = faculty.filter((member) => {
            const matchesSearch =
                !query ||
                [
                    member.facultyIdNumber,
                    member.fullName,
                    member.email,
                    member.institute,
                    member.position,
                    member.employmentStatus,
                    member.academicYear,
                    getAccountStatus(member),
                ]
                    .filter(Boolean)
                    .some((value) =>
                        String(value)
                            .toLowerCase()
                            .includes(query)
                    );

            const matchesInstitute =
                !selectedInstitute ||
                member.institute === selectedInstitute;

            const matchesAccount =
                accountFilter === "All accounts" ||
                getAccountStatus(member) === accountFilter;

            return (
                matchesSearch &&
                matchesInstitute &&
                matchesAccount
            );
        });

        return filtered.sort(
            (a, b) =>
                new Date(b.createdAt || 0) -
                new Date(a.createdAt || 0)
        );
    }, [
        faculty,
        search,
        selectedInstitute,
        accountFilter,
    ]);

    // =========================================================
    // SUMMARY ACCOUNT TOTALS
    // =========================================================

    const totalWithAccount =
        students.filter(
            (record) => record?.hasSystemAccount
        ).length +
        faculty.filter(
            (record) => record?.hasSystemAccount
        ).length;

    const totalWithoutAccount =
        students.filter(
            (record) => !record?.hasSystemAccount
        ).length +
        faculty.filter(
            (record) => !record?.hasSystemAccount
        ).length;

    // =========================================================
    // STATUS
    // =========================================================

    const getStudentStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case "enrolled":
                return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";

            case "inactive":
            case "dropped":
            case "not enrolled":
                return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";

            default:
                return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
        }
    };

    const getFacultyStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case "active":
                return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";

            case "inactive":
            case "resigned":
            case "terminated":
                return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";

            default:
                return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
        }
    };

    // =========================================================
    // DETAILS
    // =========================================================

    const openDetails = (record, type) => {
        setSelectedRecord(record);
        setSelectedType(type);
    };

    const closeDetails = () => {
        setSelectedRecord(null);
        setSelectedType(null);
    };

    // =========================================================
    // OPEN IMPORT MODAL
    // =========================================================

    const openImportModal = () => {
        setImportType(
            activeTab === "students"
                ? "student"
                : "faculty"
        );

        setSelectedFile(null);
        setAcademicYear("");
        setSemester("");
        setShowImportModal(true);
    };

    // =========================================================
    // CLOSE IMPORT MODAL
    // =========================================================

    const closeImportModal = () => {
        if (importing) {
            return;
        }

        setShowImportModal(false);
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // =========================================================
    // SELECT FILE
    // =========================================================

    const handleFileChange = (event) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        const extension =
            file.name
                .split(".")
                .pop()
                ?.toLowerCase();

        if (extension !== "xlsx") {
            toast.error(
                "Please select an Excel .xlsx file."
            );

            event.target.value = "";
            setSelectedFile(null);
            return;
        }

        const maxSize =
            10 * 1024 * 1024;

        if (file.size > maxSize) {
            toast.error(
                "Excel file must be 10 MB or smaller."
            );

            event.target.value = "";
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
    };

    // =========================================================
    // IMPORT EXCEL
    // =========================================================

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error(
                "Please select an Excel file."
            );
            return;
        }

        if (!adminId) {
            toast.error(
                "Admin ID not found. Please login again."
            );
            return;
        }

        if (!academicYear.trim()) {
            toast.error(
                "Please enter the academic year."
            );
            return;
        }

        if (
            importType === "student" &&
            !semester.trim()
        ) {
            toast.error(
                "Please enter the semester."
            );
            return;
        }

        try {
            setImporting(true);

            const formData =
                new FormData();

            formData.append(
                "file",
                selectedFile
            );

            let url = "";

            if (importType === "student") {
                url =
                    `${API_URL}/api/admin/school-records/students/import` +
                    `?adminId=${encodeURIComponent(adminId)}` +
                    `&academicYear=${encodeURIComponent(academicYear)}` +
                    `&semester=${encodeURIComponent(semester)}`;
            } else {
                url =
                    `${API_URL}/api/admin/school-records/faculty/import` +
                    `?adminId=${encodeURIComponent(adminId)}` +
                    `&academicYear=${encodeURIComponent(academicYear)}`;
            }

            const response =
                await fetch(
                    url,
                    {
                        method: "POST",
                        body: formData,
                    }
                );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (!response.ok) {
                if (data?.missingColumns) {
                    toast.error(
                        `Missing columns: ${data.missingColumns.join(", ")}`
                    );
                } else {
                    toast.error(
                        data?.message ||
                            "Failed to import records."
                    );
                }

                return;
            }

            toast.success(
                `${data.imported || 0} ${
                    importType === "student"
                        ? "student"
                        : "faculty"
                } record(s) imported.`
            );

            if (data.duplicates > 0) {
                toast(
                    `${data.duplicates} duplicate row(s) skipped.`
                );
            }

            if (data.invalid > 0) {
                toast(
                    `${data.invalid} invalid row(s) skipped.`
                );
            }

            setShowImportModal(false);
            setSelectedFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            await Promise.all([
                loadStudents(),
                loadFaculty(),
            ]);
        } catch (error) {
            console.error(error);

            toast.error(
                error.message ||
                    "Unable to import Excel file."
            );
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="min-h-screen p-8">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="
                flex
                flex-wrap
                items-end
                justify-between
                gap-4
                mb-7
            ">
                <div>
                    <h1 className="
                        text-[26px]
                        font-bold
                        text-gray-800
                        tracking-tight
                    ">
                        School Records
                    </h1>

                    <p className="
                        text-sm
                        text-gray-400
                        mt-1
                    ">
                        Manage official student and faculty records.
                    </p>
                </div>

                <div className="
                    flex
                    items-center
                    gap-2
                ">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="
                            inline-flex
                            items-center
                            gap-2
                            px-4
                            py-2.5
                            rounded-xl
                            border
                            border-gray-200
                            bg-white
                            text-sm
                            font-medium
                            text-gray-600
                            hover:bg-gray-50
                            hover:border-gray-300
                            transition
                            disabled:opacity-50
                        "
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        >
                            <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
                            <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
                        </svg>

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>

                    <button
                        type="button"
                        onClick={openImportModal}
                        className="
                            inline-flex
                            items-center
                            gap-2
                            px-4
                            py-2.5
                            rounded-xl
                            bg-[#0E3B22]
                            text-white
                            text-sm
                            font-semibold
                            hover:bg-[#0B2F1B]
                            transition
                        "
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 3v12" />
                            <path d="m7 10 5 5 5-5" />
                            <path d="M5 21h14" />
                        </svg>

                        Import List
                    </button>
                </div>
            </div>

            {/* =====================================================
                SUMMARY
            ===================================================== */}

            <div className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-5
                gap-4
                mb-6
            ">

                {/* STUDENT RECORDS */}
                <div className="
                    bg-white
                    border
                    border-gray-100
                    rounded-2xl
                    shadow-sm
                    p-5
                ">
                    <p className="text-xs text-gray-400">
                        Student Records
                    </p>

                    <p className="
                        text-2xl
                        font-bold
                        text-gray-800
                        mt-1
                    ">
                        {students.length}
                    </p>
                </div>

                {/* FACULTY RECORDS */}
                <div className="
                    bg-white
                    border
                    border-gray-100
                    rounded-2xl
                    shadow-sm
                    p-5
                ">
                    <p className="text-xs text-gray-400">
                        Faculty Records
                    </p>

                    <p className="
                        text-2xl
                        font-bold
                        text-gray-800
                        mt-1
                    ">
                        {faculty.length}
                    </p>
                </div>

                {/* TOTAL OFFICIAL RECORDS */}
                <div className="
                    bg-white
                    border
                    border-gray-100
                    rounded-2xl
                    shadow-sm
                    p-5
                ">
                    <p className="text-xs text-gray-400">
                        Total Official Records
                    </p>

                    <p className="
                        text-2xl
                        font-bold
                        text-gray-800
                        mt-1
                    ">
                        {students.length + faculty.length}
                    </p>
                </div>

                {/* WITH SYSTEM ACCOUNT */}
                <div className="
                    bg-white
                    border
                    border-gray-100
                    rounded-2xl
                    shadow-sm
                    p-5
                ">
                    <p className="text-xs text-gray-400">
                        With System Account
                    </p>

                    <p className="
                        text-2xl
                        font-bold
                        text-emerald-600
                        mt-1
                    ">
                        {totalWithAccount}
                    </p>
                </div>

                {/* WITHOUT SYSTEM ACCOUNT */}
                <div className="
                    bg-white
                    border
                    border-gray-100
                    rounded-2xl
                    shadow-sm
                    p-5
                ">
                    <p className="text-xs text-gray-400">
                        Without System Account
                    </p>

                    <p className="
                        text-2xl
                        font-bold
                        text-gray-500
                        mt-1
                    ">
                        {totalWithoutAccount}
                    </p>
                </div>

            </div>

            {/* =====================================================
                RECORD CARD
            ===================================================== */}

            <div className="
                bg-white
                rounded-2xl
                shadow-sm
                border
                border-gray-100
                overflow-hidden
            ">

                <div className="
                    p-5
                    border-b
                    border-gray-100
                    flex
                    flex-wrap
                    items-center
                    justify-between
                    gap-4
                ">

                    {/* TABS */}
                    <div className="
                        flex
                        items-center
                        bg-gray-100
                        rounded-xl
                        p-1
                        gap-1
                    ">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("students");
                                setSearch("");
                                setSelectedInstitute("");
                                setSelectedProgram("");
                                setAccountFilter("All accounts");
                            }}
                            className={`
                                px-4
                                py-2
                                rounded-lg
                                text-sm
                                font-medium
                                transition
                                ${
                                    activeTab === "students"
                                        ? "bg-white text-[#0E3B22] shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                }
                            `}
                        >
                            Students
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("faculty");
                                setSearch("");
                                setSelectedInstitute("");
                                setSelectedProgram("");
                                setAccountFilter("All accounts");
                            }}
                            className={`
                                px-4
                                py-2
                                rounded-lg
                                text-sm
                                font-medium
                                transition
                                ${
                                    activeTab === "faculty"
                                        ? "bg-white text-[#0E3B22] shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                }
                            `}
                        >
                            Faculty
                        </button>
                    </div>

                    {/* FILTERS */}
                    <div className="
                        flex
                        flex-wrap
                        items-center
                        justify-end
                        gap-2
                        w-full
                        lg:w-auto
                    ">

                        {/* STUDENT INSTITUTE + PROGRAM */}
                        {activeTab === "students" && (
                            <>
                                <select
                                    value={selectedInstitute}
                                    onChange={(e) =>
                                        setSelectedInstitute(
                                            e.target.value
                                        )
                                    }
                                    className="
                                        w-full
                                        sm:w-56
                                        border
                                        border-gray-200
                                        rounded-xl
                                        px-3
                                        py-2.5
                                        text-sm
                                        text-gray-600
                                        bg-white
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-[#0E3B22]/20
                                        focus:border-[#0E3B22]
                                    "
                                >
                                    <option value="">
                                        All Institutes
                                    </option>

                                    {institutes.map(
                                        (institute) => (
                                            <option
                                                key={institute}
                                                value={institute}
                                            >
                                                {institute}
                                            </option>
                                        )
                                    )}
                                </select>

                                <select
                                    value={selectedProgram}
                                    onChange={(e) =>
                                        setSelectedProgram(
                                            e.target.value
                                        )
                                    }
                                    disabled={!selectedInstitute}
                                    className="
                                        w-full
                                        sm:w-64
                                        border
                                        border-gray-200
                                        rounded-xl
                                        px-3
                                        py-2.5
                                        text-sm
                                        text-gray-600
                                        bg-white
                                        disabled:bg-gray-50
                                        disabled:text-gray-400
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-[#0E3B22]/20
                                        focus:border-[#0E3B22]
                                    "
                                >
                                    <option value="">
                                        {selectedInstitute
                                            ? "All Programs"
                                            : "Select Institute First"}
                                    </option>

                                    {availablePrograms.map(
                                        (program) => (
                                            <option
                                                key={program}
                                                value={program}
                                            >
                                                {program}
                                            </option>
                                        )
                                    )}
                                </select>
                            </>
                        )}

                        {/* FACULTY INSTITUTE */}
                        {activeTab === "faculty" && (
                            <select
                                value={selectedInstitute}
                                onChange={(e) =>
                                    setSelectedInstitute(
                                        e.target.value
                                    )
                                }
                                className="
                                    w-full
                                    sm:w-56
                                    border
                                    border-gray-200
                                    rounded-xl
                                    px-3
                                    py-2.5
                                    text-sm
                                    text-gray-600
                                    bg-white
                                    focus:outline-none
                                    focus:ring-2
                                    focus:ring-[#0E3B22]/20
                                    focus:border-[#0E3B22]
                                "
                            >
                                <option value="">
                                    All Institutes
                                </option>

                                {institutes.map(
                                    (institute) => (
                                        <option
                                            key={institute}
                                            value={institute}
                                        >
                                            {institute}
                                        </option>
                                    )
                                )}
                            </select>
                        )}

                        {/* ACCOUNT FILTER */}
                        <select
                            value={accountFilter}
                            onChange={(e) =>
                                setAccountFilter(
                                    e.target.value
                                )
                            }
                            className="
                                w-full
                                sm:w-40
                                border
                                border-gray-200
                                rounded-xl
                                px-3
                                py-2.5
                                text-sm
                                text-gray-600
                                bg-white
                                focus:outline-none
                                focus:ring-2
                                focus:ring-[#0E3B22]/20
                                focus:border-[#0E3B22]
                            "
                        >
                            <option value="All accounts">
                                All Accounts
                            </option>

                            <option value="Active">
                                Active
                            </option>

                            <option value="Pending">
                                Pending
                            </option>

                            <option value="Suspended">
                                Suspended
                            </option>

                            <option value="No Account">
                                No Account
                            </option>
                        </select>

                        {/* SEARCH */}
                        <div className="
                            relative
                            w-full
                            sm:w-72
                        ">
                            <svg
                                className="
                                    absolute
                                    left-3
                                    top-1/2
                                    -translate-y-1/2
                                    text-gray-400
                                "
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle
                                    cx="11"
                                    cy="11"
                                    r="7"
                                />

                                <path d="M21 21l-4.3-4.3" />
                            </svg>

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder={
                                    activeTab === "students"
                                        ? "Search students..."
                                        : "Search faculty..."
                                }
                                className="
                                    w-full
                                    border
                                    border-gray-200
                                    rounded-xl
                                    pl-9
                                    pr-4
                                    py-2.5
                                    text-sm
                                    bg-white
                                    focus:outline-none
                                    focus:ring-2
                                    focus:ring-[#0E3B22]/20
                                    focus:border-[#0E3B22]
                                "
                            />
                        </div>
                    </div>
                </div>

                {/* =================================================
                    STUDENTS TABLE
                ================================================= */}

                {activeTab === "students" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="
                                    bg-[#F7F5EF]
                                    border-b
                                    border-gray-100
                                ">
                                    <th className="
                                        p-4
                                        text-left
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Student
                                    </th>

                                    <th className="
                                        p-4
                                        text-left
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Student ID
                                    </th>

                                    <th className="
                                        p-4
                                        text-left
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Institute
                                    </th>

                                    <th className="
                                        p-4
                                        text-left
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Program
                                    </th>

                                    <th className="
                                        p-4
                                        text-left
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Year
                                    </th>

                                    <th className="
                                        p-4
                                        text-center
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Account
                                    </th>

                                    <th className="
                                        p-4
                                        text-center
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Status
                                    </th>

                                    <th className="
                                        p-4
                                        text-center
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="
                                                p-14
                                                text-center
                                                text-gray-400
                                            "
                                        >
                                            Loading student records...
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    filteredStudents.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="
                                                    p-14
                                                    text-center
                                                    text-gray-400
                                                "
                                            >
                                                No student records found.
                                            </td>
                                        </tr>
                                    )}

                                {!loading &&
                                    filteredStudents.map(
                                        (student) => (
                                            <tr
                                                key={student.id}
                                                className="
                                                    border-t
                                                    border-gray-100
                                                    hover:bg-[#F7F5EF]/60
                                                "
                                            >
                                                <td className="p-4">
                                                    <div className="
                                                        flex
                                                        items-center
                                                        gap-3
                                                    ">
                                                        <div className="
                                                            w-9
                                                            h-9
                                                            rounded-full
                                                            bg-[#0E3B22]
                                                            text-white
                                                            flex
                                                            items-center
                                                            justify-center
                                                            text-xs
                                                            font-semibold
                                                        ">
                                                            {student.fullName
                                                                ?.charAt(0)
                                                                ?.toUpperCase() ||
                                                                "?"}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="
                                                                font-medium
                                                                text-gray-800
                                                                truncate
                                                            ">
                                                                {student.fullName}
                                                            </p>

                                                            <p className="
                                                                text-xs
                                                                text-gray-400
                                                                truncate
                                                            ">
                                                                {student.email ||
                                                                    "No email"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="
                                                    p-4
                                                    text-gray-600
                                                ">
                                                    {student.studentIdNumber}
                                                </td>

                                                <td className="
                                                    p-4
                                                    text-gray-600
                                                ">
                                                    {student.institute || "—"}
                                                </td>

                                                <td className="
                                                    p-4
                                                    text-gray-600
                                                ">
                                                    {student.course || "—"}
                                                </td>

                                                <td className="
                                                    p-4
                                                    text-gray-600
                                                ">
                                                    {student.yearLevel || "—"}
                                                </td>

                                                <td className="
                                                    p-4
                                                    text-center
                                                ">
                                                    <span
                                                        className={`
                                                            inline-flex
                                                            px-3
                                                            py-1
                                                            rounded-full
                                                            text-xs
                                                            font-medium
                                                            ${getAccountStatusStyle(
                                                                student
                                                            )}
                                                        `}
                                                    >
                                                        {getAccountStatus(
                                                            student
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="
                                                    p-4
                                                    text-center
                                                ">
                                                    <span
                                                        className={`
                                                            inline-flex
                                                            px-3
                                                            py-1
                                                            rounded-full
                                                            text-xs
                                                            font-medium
                                                            ${getStudentStatusStyle(
                                                                student.enrollmentStatus
                                                            )}
                                                        `}
                                                    >
                                                        {student.enrollmentStatus ||
                                                            "Unknown"}
                                                    </span>
                                                </td>

                                                <td className="
                                                    p-4
                                                    text-center
                                                ">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDetails(
                                                                student,
                                                                "student"
                                                            )
                                                        }
                                                        className="
                                                            px-4
                                                            py-1.5
                                                            rounded-lg
                                                            text-xs
                                                            font-medium
                                                            border
                                                            border-[#0E3B22]
                                                            text-[#0E3B22]
                                                            hover:bg-[#0E3B22]
                                                            hover:text-white
                                                            transition
                                                        "
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* =================================================
                    FACULTY TABLE
                ================================================= */}

                {activeTab === "faculty" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="
                                    bg-[#F7F5EF]
                                    border-b
                                    border-gray-100
                                ">
                                    <th className="
                                        p-4
                                        text-left
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Faculty
                                    </th>

                                    <th className="
                                        p-4
                                        text-left
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Faculty ID
                                    </th>

                                    <th className="
                                        p-4
                                        text-left
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Institute
                                    </th>

                                    <th className="
                                        p-4
                                        text-left
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Position
                                    </th>

                                    <th className="
                                        p-4
                                        text-center
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Account
                                    </th>

                                    <th className="
                                        p-4
                                        text-center
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Status
                                    </th>

                                    <th className="
                                        p-4
                                        text-center
                                        font-semibold
                                        text-gray-500
                                        uppercase
                                        text-xs
                                    ">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="
                                                p-14
                                                text-center
                                                text-gray-400
                                            "
                                        >
                                            Loading faculty records...
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    filteredFaculty.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="
                                                    p-14
                                                    text-center
                                                    text-gray-400
                                                "
                                            >
                                                No faculty records found.
                                            </td>
                                        </tr>
                                    )}

                                {!loading &&
                                    filteredFaculty.map(
                                        (member) => (
                                            <tr
                                                key={member.id}
                                                className="
                                                    border-t
                                                    border-gray-100
                                                    hover:bg-[#F7F5EF]/60
                                                "
                                            >
                                                <td className="p-4">
                                                    <div className="
                                                        flex
                                                        items-center
                                                        gap-3
                                                    ">
                                                        <div className="
                                                            w-9
                                                            h-9
                                                            rounded-full
                                                            bg-blue-700
                                                            text-white
                                                            flex
                                                            items-center
                                                            justify-center
                                                            text-xs
                                                            font-semibold
                                                        ">
                                                            {member.fullName
                                                                ?.charAt(0)
                                                                ?.toUpperCase() ||
                                                                "?"}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="
                                                                font-medium
                                                                text-gray-800
                                                                truncate
                                                            ">
                                                                {member.fullName}
                                                            </p>

                                                            <p className="
                                                                text-xs
                                                                text-gray-400
                                                                truncate
                                                            ">
                                                                {member.email ||
                                                                    "No email"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="
                                                    p-4
                                                    text-gray-600
                                                ">
                                                    {member.facultyIdNumber}
                                                </td>

                                                <td className="
                                                    p-4
                                                    text-gray-600
                                                ">
                                                    {member.institute || "—"}
                                                </td>

                                                <td className="
                                                    p-4
                                                    text-gray-600
                                                ">
                                                    {member.position || "—"}
                                                </td>

                                                <td className="
                                                    p-4
                                                    text-center
                                                ">
                                                    <span
                                                        className={`
                                                            inline-flex
                                                            px-3
                                                            py-1
                                                            rounded-full
                                                            text-xs
                                                            font-medium
                                                            ${getAccountStatusStyle(
                                                                member
                                                            )}
                                                        `}
                                                    >
                                                        {getAccountStatus(
                                                            member
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="
                                                    p-4
                                                    text-center
                                                ">
                                                    <span
                                                        className={`
                                                            inline-flex
                                                            px-3
                                                            py-1
                                                            rounded-full
                                                            text-xs
                                                            font-medium
                                                            ${getFacultyStatusStyle(
                                                                member.employmentStatus
                                                            )}
                                                        `}
                                                    >
                                                        {member.employmentStatus ||
                                                            "Unknown"}
                                                    </span>
                                                </td>

                                                <td className="
                                                    p-4
                                                    text-center
                                                ">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDetails(
                                                                member,
                                                                "faculty"
                                                            )
                                                        }
                                                        className="
                                                            px-4
                                                            py-1.5
                                                            rounded-lg
                                                            text-xs
                                                            font-medium
                                                            border
                                                            border-[#0E3B22]
                                                            text-[#0E3B22]
                                                            hover:bg-[#0E3B22]
                                                            hover:text-white
                                                            transition
                                                        "
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* =====================================================
                DETAILS MODAL
            ===================================================== */}

            {selectedRecord && (
                <div
                    className="
                        fixed
                        inset-0
                        z-50
                        bg-black/50
                        flex
                        items-center
                        justify-center
                        p-4
                    "
                    onClick={closeDetails}
                >
                    <div
                        className="
                            bg-white
                            w-full
                            max-w-2xl
                            max-h-[90vh]
                            overflow-y-auto
                            rounded-3xl
                            shadow-2xl
                        "
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >
                        <div className="
                            flex
                            items-center
                            justify-between
                            px-6
                            py-5
                            border-b
                            border-gray-100
                        ">
                            <div>
                                <h2 className="
                                    text-lg
                                    font-bold
                                    text-gray-800
                                ">
                                    {selectedType === "student"
                                        ? "Student Record"
                                        : "Faculty Record"}
                                </h2>

                                <p className="
                                    text-xs
                                    text-gray-400
                                    mt-1
                                ">
                                    Official school record details
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeDetails}
                                className="
                                    w-9
                                    h-9
                                    rounded-full
                                    bg-gray-100
                                    text-gray-500
                                    flex
                                    items-center
                                    justify-center
                                    hover:bg-gray-200
                                "
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6">
                            {selectedType === "student" ? (
                                <div className="
                                    grid
                                    grid-cols-1
                                    sm:grid-cols-2
                                    gap-5
                                ">
                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            Student ID
                                        </p>

                                        <p className="
                                            font-medium
                                            text-gray-800
                                        ">
                                            {selectedRecord.studentIdNumber}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            Full Name
                                        </p>

                                        <p className="
                                            font-medium
                                            text-gray-800
                                        ">
                                            {selectedRecord.fullName}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            Email
                                        </p>

                                        <p className="
                                            font-medium
                                            text-gray-800
                                            break-all
                                        ">
                                            {selectedRecord.email || "—"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            Institute
                                        </p>

                                        <p className="
                                            font-medium
                                            text-gray-800
                                        ">
                                            {selectedRecord.institute || "—"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            Course
                                        </p>

                                        <p className="
                                            font-medium
                                            text-gray-800
                                        ">
                                            {selectedRecord.course || "—"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            Year Level
                                        </p>

                                        <p className="
                                            font-medium
                                            text-gray-800
                                        ">
                                            {selectedRecord.yearLevel || "—"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            System Account
                                        </p>

                                        <span
                                            className={`
                                                inline-flex
                                                px-3
                                                py-1
                                                rounded-full
                                                text-xs
                                                font-medium
                                                ${getAccountStatusStyle(
                                                    selectedRecord
                                                )}
                                            `}
                                        >
                                            {getAccountStatus(
                                                selectedRecord
                                            )}
                                        </span>
                                    </div>

                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            Enrollment Status
                                        </p>

                                        <span
                                            className={`
                                                inline-flex
                                                px-3
                                                py-1
                                                rounded-full
                                                text-xs
                                                font-medium
                                                ${getStudentStatusStyle(
                                                    selectedRecord.enrollmentStatus
                                                )}
                                            `}
                                        >
                                            {selectedRecord.enrollmentStatus ||
                                                "Unknown"}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="
                                    grid
                                    grid-cols-1
                                    sm:grid-cols-2
                                    gap-5
                                ">
                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            Faculty ID
                                        </p>

                                        <p className="
                                            font-medium
                                            text-gray-800
                                        ">
                                            {selectedRecord.facultyIdNumber}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            Full Name
                                        </p>

                                        <p className="
                                            font-medium
                                            text-gray-800
                                        ">
                                            {selectedRecord.fullName}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            Email
                                        </p>

                                        <p className="
                                            font-medium
                                            text-gray-800
                                            break-all
                                        ">
                                            {selectedRecord.email || "—"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            Institute
                                        </p>

                                        <p className="
                                            font-medium
                                            text-gray-800
                                        ">
                                            {selectedRecord.institute || "—"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            Position
                                        </p>

                                        <p className="
                                            font-medium
                                            text-gray-800
                                        ">
                                            {selectedRecord.position || "—"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            System Account
                                        </p>

                                        <span
                                            className={`
                                                inline-flex
                                                px-3
                                                py-1
                                                rounded-full
                                                text-xs
                                                font-medium
                                                ${getAccountStatusStyle(
                                                    selectedRecord
                                                )}
                                            `}
                                        >
                                            {getAccountStatus(
                                                selectedRecord
                                            )}
                                        </span>
                                    </div>

                                    <div>
                                        <p className="
                                            text-xs
                                            text-gray-400
                                            mb-1
                                        ">
                                            Employment Status
                                        </p>

                                        <span
                                            className={`
                                                inline-flex
                                                px-3
                                                py-1
                                                rounded-full
                                                text-xs
                                                font-medium
                                                ${getFacultyStatusStyle(
                                                    selectedRecord.employmentStatus
                                                )}
                                            `}
                                        >
                                            {selectedRecord.employmentStatus ||
                                                "Unknown"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================
                IMPORT MODAL
            ===================================================== */}

            {showImportModal && (
                <div
                    className="
                        fixed
                        inset-0
                        z-[60]
                        bg-black/50
                        flex
                        items-center
                        justify-center
                        p-4
                    "
                    onClick={closeImportModal}
                >
                    <div
                        className="
                            w-full
                            max-w-lg
                            bg-white
                            rounded-3xl
                            shadow-2xl
                            overflow-hidden
                        "
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >
                        {/* HEADER */}
                        <div className="
                            flex
                            items-center
                            justify-between
                            px-6
                            py-5
                            border-b
                            border-gray-100
                        ">
                            <div>
                                <h2 className="
                                    text-lg
                                    font-bold
                                    text-gray-800
                                ">
                                    Import School Records
                                </h2>

                                <p className="
                                    text-xs
                                    text-gray-400
                                    mt-1
                                ">
                                    Upload an Excel .xlsx file.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeImportModal}
                                disabled={importing}
                                className="
                                    w-9
                                    h-9
                                    rounded-full
                                    bg-gray-100
                                    text-gray-500
                                    flex
                                    items-center
                                    justify-center
                                    hover:bg-gray-200
                                    disabled:opacity-50
                                "
                            >
                                ×
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="p-6 space-y-5">

                            {/* RECORD TYPE */}
                            <div>
                                <label className="
                                    block
                                    text-xs
                                    font-medium
                                    text-gray-600
                                    mb-2
                                ">
                                    Record Type
                                </label>

                                <div className="
                                    grid
                                    grid-cols-2
                                    gap-2
                                ">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setImportType(
                                                "student"
                                            )
                                        }
                                        disabled={importing}
                                        className={`
                                            py-3
                                            rounded-xl
                                            border
                                            text-sm
                                            font-medium
                                            transition
                                            ${
                                                importType === "student"
                                                    ? "border-[#0E3B22] bg-[#0E3B22]/5 text-[#0E3B22]"
                                                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                            }
                                        `}
                                    >
                                        Students
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setImportType(
                                                "faculty"
                                            )
                                        }
                                        disabled={importing}
                                        className={`
                                            py-3
                                            rounded-xl
                                            border
                                            text-sm
                                            font-medium
                                            transition
                                            ${
                                                importType === "faculty"
                                                    ? "border-[#0E3B22] bg-[#0E3B22]/5 text-[#0E3B22]"
                                                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                            }
                                        `}
                                    >
                                        Faculty
                                    </button>
                                </div>
                            </div>

                            {/* ACADEMIC YEAR */}
                            <div>
                                <label className="
                                    block
                                    text-xs
                                    font-medium
                                    text-gray-600
                                    mb-2
                                ">
                                    Academic Year
                                </label>

                                <input
                                    type="text"
                                    value={academicYear}
                                    onChange={(e) =>
                                        setAcademicYear(
                                            e.target.value
                                        )
                                    }
                                    disabled={importing}
                                    placeholder="2026-2027"
                                    className="
                                        w-full
                                        px-4
                                        py-3
                                        border
                                        border-gray-200
                                        rounded-xl
                                        text-sm
                                        outline-none
                                        focus:border-[#0E3B22]
                                        focus:ring-2
                                        focus:ring-[#0E3B22]/10
                                    "
                                />
                            </div>

                            {/* SEMESTER */}
                            {importType === "student" && (
                                <div>
                                    <label className="
                                        block
                                        text-xs
                                        font-medium
                                        text-gray-600
                                        mb-2
                                    ">
                                        Semester
                                    </label>

                                    <input
                                        type="text"
                                        value={semester}
                                        onChange={(e) =>
                                            setSemester(
                                                e.target.value
                                            )
                                        }
                                        disabled={importing}
                                        placeholder="1st Semester"
                                        className="
                                            w-full
                                            px-4
                                            py-3
                                            border
                                            border-gray-200
                                            rounded-xl
                                            text-sm
                                            outline-none
                                            focus:border-[#0E3B22]
                                            focus:ring-2
                                            focus:ring-[#0E3B22]/10
                                        "
                                    />
                                </div>
                            )}

                            {/* FILE */}
                            <div>
                                <label className="
                                    block
                                    text-xs
                                    font-medium
                                    text-gray-600
                                    mb-2
                                ">
                                    Excel File
                                </label>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    disabled={importing}
                                    className="hidden"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={importing}
                                    className="
                                        w-full
                                        border-2
                                        border-dashed
                                        border-gray-300
                                        rounded-2xl
                                        bg-gray-50
                                        px-5
                                        py-8
                                        text-center
                                        hover:border-[#0E3B22]
                                        hover:bg-[#0E3B22]/5
                                        transition
                                        disabled:opacity-50
                                    "
                                >
                                    <div className="
                                        w-12
                                        h-12
                                        rounded-xl
                                        bg-[#0E3B22]/10
                                        text-[#0E3B22]
                                        flex
                                        items-center
                                        justify-center
                                        mx-auto
                                        mb-3
                                    ">
                                        <svg
                                            width="22"
                                            height="22"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line
                                                x1="12"
                                                y1="3"
                                                x2="12"
                                                y2="15"
                                            />
                                        </svg>
                                    </div>

                                    {selectedFile ? (
                                        <>
                                            <p className="
                                                text-sm
                                                font-semibold
                                                text-gray-700
                                            ">
                                                {selectedFile.name}
                                            </p>

                                            <p className="
                                                text-xs
                                                text-gray-400
                                                mt-1
                                            ">
                                                {(
                                                    selectedFile.size /
                                                    (1024 * 1024)
                                                ).toFixed(2)}{" "}
                                                MB
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="
                                                text-sm
                                                font-medium
                                                text-gray-700
                                            ">
                                                Click to choose an Excel file
                                            </p>

                                            <p className="
                                                text-xs
                                                text-gray-400
                                                mt-1
                                            ">
                                                .xlsx only • Maximum 10 MB
                                            </p>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* REQUIRED COLUMNS */}
                            <div className="
                                rounded-xl
                                bg-gray-50
                                border
                                border-gray-100
                                p-4
                            ">
                                <p className="
                                    text-xs
                                    font-semibold
                                    text-gray-600
                                    mb-2
                                ">
                                    Required columns
                                </p>

                                {importType === "student" ? (
                                    <p className="
                                        text-xs
                                        text-gray-500
                                        leading-relaxed
                                    ">
                                        StudentIdNumber, FullName
                                    </p>
                                ) : (
                                    <p className="
                                        text-xs
                                        text-gray-500
                                        leading-relaxed
                                    ">
                                        FacultyIdNumber, FullName
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="
                            px-6
                            py-5
                            border-t
                            border-gray-100
                            flex
                            justify-end
                            gap-3
                        ">
                            <button
                                type="button"
                                onClick={closeImportModal}
                                disabled={importing}
                                className="
                                    px-5
                                    py-2.5
                                    rounded-xl
                                    border
                                    border-gray-200
                                    text-sm
                                    font-medium
                                    text-gray-600
                                    hover:bg-gray-50
                                    disabled:opacity-50
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleImport}
                                disabled={
                                    importing ||
                                    !selectedFile
                                }
                                className="
                                    px-5
                                    py-2.5
                                    rounded-xl
                                    bg-[#0E3B22]
                                    text-white
                                    text-sm
                                    font-semibold
                                    hover:bg-[#0B2F1B]
                                    disabled:opacity-50
                                    disabled:cursor-not-allowed
                                    transition
                                "
                            >
                                {importing
                                    ? "Importing..."
                                    : "Import Records"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}