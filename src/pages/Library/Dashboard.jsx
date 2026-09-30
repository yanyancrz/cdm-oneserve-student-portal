import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BookOpen,
    CalendarDays,
    ChevronRight,
    LibraryBig,
    QrCode,
    Search,
    UserRound,
    Clock3,
} from "lucide-react";
import toast from "react-hot-toast";

import { API_URL } from "../../config/api";
import LibraryBottomNav from "../../components/BottomNavigation/LibraryBottomNav";

// IMPORTANT:
// Kung nasa ibang folder ang curated_books.json,
// palitan lang ang import path na ito.
import curatedBooksList from "./curated_books.json";

export default function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [accessPass, setAccessPass] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedInstitute, setSelectedInstitute] = useState("ALL");
    const [isLoading, setIsLoading] = useState(true);

    // =========================================================
    // LOAD USER
    // =========================================================

    useEffect(() => {
        const email = localStorage.getItem("userEmail");

        if (!email) {
            navigate("/");
            return;
        }

        const loadUser = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/api/profile/${encodeURIComponent(email)}`
                );

                if (!response.ok) {
                    throw new Error("Unable to load profile.");
                }

                const data = await response.json();
                setUser(data);

                // Load access pass using the actual user ID
                if (data?.id) {
                    try {
                        const passResponse = await fetch(
                            `${API_URL}/api/library/access-pass/${data.id}`
                        );

                        if (passResponse.ok) {
                            const passData = await passResponse.json();

                            if (passData?.success) {
                                setAccessPass(passData.data);
                            }
                        }
                    } catch (error) {
                        console.error(
                            "Access pass loading error:",
                            error
                        );
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error("Unable to load your library profile.");
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, [navigate]);

    // =========================================================
    // USER DATA
    // =========================================================

    const userName =
        user?.fullName ||
        localStorage.getItem("userName") ||
        "Student";

    const firstName =
        userName.split(" ")[0] || "Student";

    const userId =
        user?.id ||
        Number(localStorage.getItem("userId")) ||
        null;

    const institute =
        user?.institute ||
        accessPass?.institute ||
        "";

    const program =
        user?.course ||
        accessPass?.program ||
        "";

    // =========================================================
    // CURATED BOOKS
    // =========================================================

    const books = Array.isArray(curatedBooksList)
        ? curatedBooksList
        : [];

    const institutes = [
        {
            id: "ALL",
            label: "All",
        },
        {
            id: "ICS",
            label: "ICS",
        },
        {
            id: "ITE",
            label: "ITE",
        },
        {
            id: "IBE",
            label: "IBE",
        },
        {
            id: "CAS",
            label: "CAS",
        },
    ];

    const filteredBooks = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return books.filter((book) => {
            const matchesInstitute =
                selectedInstitute === "ALL" ||
                String(book.institute || "")
                    .toUpperCase()
                    .includes(selectedInstitute);

            const searchableText = [
                book.title,
                book.author,
                book.category,
                book.institute,
                book.program,
                book.isbn,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !keyword ||
                searchableText.includes(keyword);

            return matchesInstitute && matchesSearch;
        });
    }, [
        books,
        search,
        selectedInstitute,
    ]);

    // Show a small selection on dashboard.
    const featuredBooks = filteredBooks.slice(0, 6);

    // =========================================================
    // DATE
    // =========================================================

    const today = new Date().toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        }
    );

    // =========================================================
    // BOOK AVAILABILITY
    // =========================================================

    const getAvailability = (book) => {
        const available =
            Number(book.availableCopies ?? 0);

        const total =
            Number(book.totalCopies ?? 0);

        if (available <= 0) {
            return {
                label: "Unavailable",
                className:
                    "bg-red-50 text-red-600",
            };
        }

        if (
            total > 0 &&
            available <= Math.ceil(total * 0.25)
        ) {
            return {
                label: `${available} left`,
                className:
                    "bg-amber-50 text-amber-700",
            };
        }

        return {
            label: `${available} available`,
            className:
                "bg-emerald-50 text-emerald-700",
        };
    };

    // =========================================================
    // NAVIGATION
    // =========================================================

    const goToBooks = () => {
        navigate("/library/books");
    };

    const goToAccessPass = () => {
        navigate("/library/access-pass");
    };

    const goToLoans = () => {
        navigate("/library/loans");
    };

    const goToReservations = () => {
        navigate("/library/reserve");
    };

    // =========================================================
    // SKELETON
    // =========================================================

    const Skeleton = ({ className = "" }) => (
        <div
            className={`animate-pulse rounded-xl bg-slate-200 ${className}`}
        />
    );

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="min-h-screen bg-[#F7F8F5] text-slate-800">

            {/* =====================================================
                BACKGROUND
            ===================================================== */}

            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />

                <div className="absolute right-[-180px] top-[25%] h-[32rem] w-[32rem] rounded-full bg-teal-100/30 blur-3xl" />

                <div className="absolute bottom-[-160px] left-[30%] h-[30rem] w-[30rem] rounded-full bg-amber-100/30 blur-3xl" />
            </div>

            {/* =====================================================
                LIBRARY TOP NAVBAR
            ===================================================== */}

            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">

                <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* BRAND */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/library")
                        }
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-[#106A2E]">
                            <LibraryBig size={21} />
                        </div>

                        <div className="text-left">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-emerald-700/70">
                                CDM OneServe
                            </p>

                            <p className="text-sm font-medium text-slate-500">
                                Library
                            </p>
                        </div>
                    </button>

                    {/* DESKTOP NAV */}

                    <nav className="hidden items-center gap-1 md:flex">

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/library")
                            }
                            className="rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-[#106A2E]"
                        >
                            Home
                        </button>

                        <button
                            type="button"
                            onClick={goToBooks}
                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-[#106A2E]"
                        >
                            <BookOpen size={15} />
                            Books
                        </button>

                        <button
                            type="button"
                            onClick={goToAccessPass}
                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-[#106A2E]"
                        >
                            <QrCode size={15} />
                            Pass
                        </button>

                        <button
                            type="button"
                            onClick={goToLoans}
                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-[#106A2E]"
                        >
                            <LibraryBig size={15} />
                            Loans
                        </button>

                        <div className="mx-2 h-6 w-px bg-slate-200" />

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                            className="rounded-xl px-4 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                        >
                            ← Portal
                        </button>

                    </nav>

                    {/* USER */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/profile")
                        }
                        className="flex items-center gap-2"
                    >
                        <div className="hidden text-right sm:block">
                            <p className="text-xs font-semibold text-slate-700">
                                {userName}
                            </p>

                            <p className="text-[10px] text-slate-400">
                                {institute || "CDM Student"}
                            </p>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-[#106A2E]">
                            <UserRound size={17} />
                        </div>
                    </button>

                </div>
            </header>

            {/* =====================================================
                MAIN
            ===================================================== */}

            <main className="relative z-10 mx-auto max-w-7xl px-4 pb-28 pt-7 sm:px-6 lg:px-8">

                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="mb-6">

                    <p className="text-xs font-medium text-slate-400">
                        {today}
                    </p>

                    <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
                                Welcome, {firstName}
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Your CDM Library at your fingertips.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={goToAccessPass}
                            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#106A2E] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[#0D5B28] sm:self-auto"
                        >
                            <QrCode size={16} />
                            Access Pass
                        </button>

                    </div>

                </section>

                {/* =================================================
                    DIGITAL ACCESS PASS
                ================================================= */}

                <section className="relative mb-7 overflow-hidden rounded-[26px] bg-[#106A2E] p-5 shadow-xl shadow-emerald-900/10 sm:p-7">

                    <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10" />

                    <div className="pointer-events-none absolute -bottom-24 left-20 h-60 w-60 rounded-full bg-emerald-300/10 blur-3xl" />

                    <div className="relative">

                        <div className="flex items-start justify-between gap-4">

                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100/70">
                                    Digital Student Access
                                </p>

                                <h2 className="mt-2 text-xl font-semibold text-white">
                                    Library Access Pass
                                </h2>

                                <p className="mt-1 max-w-lg text-xs leading-5 text-emerald-50/70">
                                    Use your dynamic QR code when checking in at the library kiosk.
                                </p>
                            </div>

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                                <QrCode size={20} />
                            </div>

                        </div>

                        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between">

                            <div>
                                <p className="text-[9px] uppercase tracking-wider text-emerald-100/50">
                                    Student
                                </p>

                                {isLoading ? (
                                    <Skeleton className="mt-2 h-5 w-40 bg-white/20" />
                                ) : (
                                    <p className="mt-1 text-sm font-semibold text-white">
                                        {accessPass?.studentName ||
                                            userName}
                                    </p>
                                )}

                                <p className="mt-1 text-xs text-emerald-100/60">
                                    {accessPass?.studentNumber ||
                                        user?.idNumber ||
                                        "—"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={goToAccessPass}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#106A2E] transition hover:bg-emerald-50"
                            >
                                View QR Pass
                                <ChevronRight size={15} />
                            </button>

                        </div>

                    </div>
                </section>

                {/* =================================================
                    QUICK LIBRARY ACTIONS
                ================================================= */}

                <section className="mb-7">

                    <div className="mb-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700/60">
                            Library Services
                        </p>

                        <h2 className="mt-1 text-lg font-semibold text-slate-800">
                            Quick Access
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                        <button
                            type="button"
                            onClick={goToBooks}
                            className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#106A2E]">
                                <BookOpen size={19} />
                            </div>

                            <p className="mt-4 text-sm font-semibold text-slate-800">
                                Browse Books
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-slate-400">
                                Search the catalog
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={goToAccessPass}
                            className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#106A2E]">
                                <QrCode size={19} />
                            </div>

                            <p className="mt-4 text-sm font-semibold text-slate-800">
                                Access Pass
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-slate-400">
                                Show your QR code
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={goToLoans}
                            className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <LibraryBig size={19} />
                            </div>

                            <p className="mt-4 text-sm font-semibold text-slate-800">
                                My Loans
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-slate-400">
                                View borrowed books
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={goToReservations}
                            className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <CalendarDays size={19} />
                            </div>

                            <p className="mt-4 text-sm font-semibold text-slate-800">
                                Reservations
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-slate-400">
                                Manage book holds
                            </p>
                        </button>

                    </div>
                </section>

                {/* =================================================
                    CATALOG
                ================================================= */}

                <section>

                    <div className="mb-4 flex items-end justify-between gap-3">

                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700/60">
                                Academic Collection
                            </p>

                            <h2 className="mt-1 text-xl font-semibold text-slate-800">
                                Curated Books
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={goToBooks}
                            className="flex items-center gap-1 text-xs font-semibold text-[#106A2E]"
                        >
                            View all
                            <ChevronRight size={15} />
                        </button>

                    </div>

                    {/* SEARCH */}

                    <div className="mb-4 flex items-center rounded-2xl border border-slate-200 bg-white shadow-sm">

                        <Search
                            size={18}
                            className="ml-4 shrink-0 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search title, author, ISBN..."
                            className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-slate-400"
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
                                }
                                className="mr-3 text-slate-400 hover:text-slate-700"
                            >
                                ×
                            </button>
                        )}

                    </div>

                    {/* INSTITUTE FILTER */}

                    <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                        {institutes.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() =>
                                    setSelectedInstitute(
                                        item.id
                                    )
                                }
                                className={`
                                    shrink-0 rounded-full
                                    px-4 py-2
                                    text-xs font-semibold
                                    transition
                                    ${
                                        selectedInstitute ===
                                        item.id
                                            ? "bg-[#106A2E] text-white shadow-sm"
                                            : "border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-[#106A2E]"
                                    }
                                `}
                            >
                                {item.label}
                            </button>
                        ))}

                    </div>

                    {/* BOOK GRID */}

                    {isLoading ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">

                            {Array.from({
                                length: 6,
                            }).map((_, index) => (
                                <div
                                    key={index}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                                >
                                    <Skeleton className="h-52 rounded-none bg-slate-200" />

                                    <div className="p-3">
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="mt-2 h-3 w-2/3" />
                                    </div>
                                </div>
                            ))}

                        </div>
                    ) : featuredBooks.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">

                            {featuredBooks.map((book) => {
                                const availability =
                                    getAvailability(book);

                                return (
                                    <button
                                        key={book.id}
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/library/book/${book.id}`
                                            )
                                        }
                                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                                    >

                                        {/* COVER */}

                                        <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">

                                            {book.coverUrl ? (
                                                <img
                                                    src={book.coverUrl}
                                                    alt={book.title}
                                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-slate-300">
                                                    <BookOpen
                                                        size={42}
                                                    />
                                                </div>
                                            )}

                                            <span
                                                className={`
                                                    absolute
                                                    left-2
                                                    top-2
                                                    rounded-full
                                                    px-2
                                                    py-1
                                                    text-[9px]
                                                    font-semibold
                                                    shadow-sm
                                                    ${availability.className}
                                                `}
                                            >
                                                {
                                                    availability.label
                                                }
                                            </span>

                                        </div>

                                        {/* BOOK INFO */}

                                        <div className="p-3">

                                            <p className="line-clamp-2 text-xs font-semibold leading-4 text-slate-800">
                                                {book.title}
                                            </p>

                                            <p className="mt-1 line-clamp-1 text-[10px] text-slate-400">
                                                {book.author}
                                            </p>

                                            <div className="mt-2 flex items-center justify-between">

                                                <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
                                                    {book.institute ||
                                                        book.category ||
                                                        "Library"}
                                                </span>

                                                <ChevronRight
                                                    size={13}
                                                    className="text-slate-300 transition group-hover:text-[#106A2E]"
                                                />

                                            </div>

                                        </div>
                                    </button>
                                );
                            })}

                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">

                            <BookOpen
                                size={32}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-3 text-sm font-semibold text-slate-600">
                                No books found
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Try another search or institute.
                            </p>

                        </div>
                    )}

                </section>

                {/* =================================================
                    LIBRARY INFO
                ================================================= */}

                <section className="mt-7 grid gap-4 sm:grid-cols-2">

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#106A2E]">
                                <Clock3 size={18} />
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-slate-700">
                                    Library Access
                                </p>

                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    Scan your Digital Access Pass at the kiosk.
                                </p>
                            </div>

                        </div>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <BookOpen size={18} />
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-slate-700">
                                    Academic Collection
                                </p>

                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    {books.length} curated books in the catalog.
                                </p>
                            </div>

                        </div>

                    </div>

                </section>

            </main>

            {/* =====================================================
                LIBRARY BOTTOM NAV
            ===================================================== */}

            <LibraryBottomNav />

        </div>
    );
}