import QRCode from "react-qr-code";
import logo from "../../assets/images/cdm-logo.png";
import { API_URL } from "../../config/api";

export default function DigitalIDFront({
    isFullscreen = false,
    role,
    idNumber,
    fullName,
    course,       // student only (Program)
    yearLevel,    // student only
    institute,    // faculty only
    position,     // faculty only
    profilePicture,
    qrCode,
    status,
    academicYear = "2025 – 2026",
}) {

    const isFaculty = role?.toLowerCase() === "faculty";

    const photoWidth  = isFullscreen ? "120px" : "72px";
    const photoHeight = isFullscreen ? "140px" : "84px";
    const qrSize      = isFullscreen ? 90 : 48;

    // Text scale classes — now actually applied below
    const schoolName  = isFullscreen ? "text-[20px]"  : "text-[12px]";
    const schoolAddr  = isFullscreen ? "text-[14px]"  : "text-[9px]";
    const idBadge     = isFullscreen ? "text-[13px]"  : "text-[8.5px]";
    const ayText      = isFullscreen ? "text-[14px]"  : "text-[9px]";
    const labelSize   = isFullscreen ? "text-[12px]"  : "text-[8px]";
    const nameSize    = isFullscreen ? "text-[22px]"  : "text-[13px]";
    const valueSize   = isFullscreen ? "text-[16px]"  : "text-[11px]";
    const courseSize  = isFullscreen ? "text-[14px]"  : "text-[9px]";
    const statusSize  = isFullscreen ? "text-[12px]"  : "text-[8px]";
    const footerSize  = isFullscreen ? "text-[11px]"  : "text-[7px]";
    const qrLabel     = isFullscreen ? "text-[10px]"  : "text-[6.5px]";

    // Layout scale
    const photoColW   = isFullscreen ? "w-[130px]" : "w-[72px]";
    const qrColW      = isFullscreen ? "w-[110px]" : "w-[60px]";
    const bodyGap     = isFullscreen ? "gap-6"     : "gap-3";
    const bodyPad     = isFullscreen ? "px-6 py-5" : "px-4 py-3";
    const headerPad   = isFullscreen ? "px-6 pt-5 pb-4" : "px-4 pt-3 pb-3";
    const logoBox     = isFullscreen ? "w-14 h-14"  : "w-8 h-8";
    const logoImg     = isFullscreen ? "w-9 h-9"    : "w-5 h-5";
    const infoGap     = isFullscreen ? "gap-3"      : "gap-1.5";

    return (
        <div
            className="
                relative mx-auto font-sans rounded-[18px]
                border border-black/10 bg-white
                shadow-[0_20px_45px_-12px_rgba(0,0,0,0.25)]
                flex flex-col overflow-hidden
            "
            style={{
                width:  isFullscreen ? "650px" : "380px",
                height: isFullscreen ? "410px" : "240px",
            }}
        >
            {/* TOP IDENTITY BAR */}
            <div className={`relative bg-[#0B6B53] rounded-t-[18px] ${headerPad}`}>
                <div className="flex items-center gap-2.5">
                    <div className={`${logoBox} rounded-md bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <img src={logo} alt="CDM Logo" className={`${logoImg} object-contain`} />
                    </div>
                    <div className="leading-tight min-w-0">
                        <h2 className={`text-white font-semibold ${schoolName} tracking-wide whitespace-nowrap`}>
                            COLEGIO DE MONTALBAN
                        </h2>
                        <p className={`text-white/65 ${schoolAddr} mt-0.5 whitespace-nowrap`}>
                            Kasiglahan Village, Rodriguez, Rizal
                        </p>
                    </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                    <span className={`text-white/80 ${idBadge} uppercase tracking-[1.5px] whitespace-nowrap`}>
                        {isFaculty ? "Official Faculty Identification" : "Official Student Identification"}
                    </span>
                    <span className={`text-[#F4D35E] ${ayText} font-semibold tracking-wide whitespace-nowrap`}>
                        AY {academicYear}
                    </span>
                </div>
            </div>

            {/* YELLOW DIVIDER */}
            <div className="h-[3px] bg-[#F4D35E] flex-shrink-0" />

            {/* BODY */}
            <div className={`relative ${bodyPad} flex ${bodyGap}`}>

                {/* PHOTO COLUMN */}
                <div className={`flex flex-col items-center flex-shrink-0 ${photoColW}`}>
                    <div
                        className="rounded-md border border-gray-200 bg-gray-50 overflow-hidden shadow-sm flex-shrink-0"
                        style={{ width: photoWidth, height: photoHeight }}
                    >
                        <img
                            src={profilePicture ? `${API_URL}${profilePicture}` : "/default-avatar.png"}
                            alt={fullName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className={`mt-1.5 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 ${statusSize} font-semibold px-1.5 py-0.5 rounded-full ring-1 ring-emerald-200 whitespace-nowrap`}>
                        <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                        {status}
                    </span>
                </div>

                {/* INFO COLUMN */}
                <div className={`flex-1 min-w-0 flex flex-col ${infoGap}`}>
                    <div>
                        <p className={`${labelSize} uppercase tracking-[1.5px] text-gray-400 font-medium leading-none`}>
                            Name
                        </p>
                        <h3 className={`${nameSize} font-bold uppercase text-gray-900 leading-tight truncate mt-0.5`}>
                            {fullName}
                        </h3>
                    </div>

                    {isFaculty ? (
                        <>
                            <div>
                                <p className={`${labelSize} uppercase tracking-[1.5px] text-gray-400 font-medium leading-none`}>
                                    ID No.
                                </p>
                                <p className={`${valueSize} font-semibold text-gray-800 tracking-wide mt-0.5 truncate`}>
                                    {idNumber}
                                </p>
                            </div>

                            <div>
                                <p className={`${labelSize} uppercase tracking-[1.5px] text-gray-400 font-medium leading-none`}>
                                    Institute
                                </p>
                                <p className={`${courseSize} font-semibold text-gray-800 mt-0.5 truncate`}>
                                    {institute}
                                </p>
                            </div>

                            <div>
                                <p className={`${labelSize} uppercase tracking-[1.5px] text-gray-400 font-medium leading-none`}>
                                    Position
                                </p>
                                <p className={`${courseSize} font-semibold text-gray-800 mt-0.5 truncate`}>
                                    {position}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex gap-3">
                                <div className="min-w-0">
                                    <p className={`${labelSize} uppercase tracking-[1.5px] text-gray-400 font-medium leading-none`}>
                                        ID No.
                                    </p>
                                    <p className={`${valueSize} font-semibold text-gray-800 tracking-wide mt-0.5 truncate`}>
                                        {idNumber}
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <p className={`${labelSize} uppercase tracking-[1.5px] text-gray-400 font-medium leading-none`}>
                                        Year Level
                                    </p>
                                    <p className={`${valueSize} font-semibold text-gray-800 mt-0.5 truncate`}>
                                        {yearLevel}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className={`${labelSize} uppercase tracking-[1.5px] text-gray-400 font-medium leading-none`}>
                                    Program
                                </p>
                                <p className={`${courseSize} font-semibold text-gray-800 mt-0.5 truncate`}>
                                    {course}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* QR CODE */}
                <div className={`flex-shrink-0 flex flex-col items-center justify-start ${qrColW}`}>
                    <div className="bg-white border border-gray-200 rounded p-1">
                        <QRCode value={qrCode || ""} size={qrSize} />
                    </div>
                    <p className={`${qrLabel} text-gray-400 mt-1 text-center leading-tight`}>
                        Scan to verify
                    </p>
                </div>

            </div>

            {/* FOOTER STRIP */}
            <div className={`bg-[#0B6B53] rounded-b-[25px] text-white/80 ${footerSize} tracking-[5px] uppercase text-center py-6 px-2 whitespace-nowrap flex-shrink-0`}>
                Property of Colegio de Montalban &middot; Non-transferable
            </div>
        </div>
    );
}