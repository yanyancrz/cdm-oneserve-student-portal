import QRCode from "react-qr-code";
import logo from "../../assets/images/cdm-logo.png";

export default function DigitalIDCard({
    studentNumber,
    fullName,
    course,
    yearLevel,
    profilePicture,
    academicYear = "2025 – 2026",
}) {

    return (

        <div className="max-w-sm mx-auto font-sans rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-lg">

            {/* HEADER */}

            <div className="bg-[#0B6B53] px-5 py-4 flex items-center gap-3">

                <div className="w-11 h-11 rounded-full bg-white/15 border border-white/30 flex items-center justify-center flex-shrink-0">
                    <img
                        src={logo}
                        alt="CDM Logo"
                        className="w-7 h-7 object-contain"
                    />
                </div>

                <div>
                    <h2 className="text-white font-medium text-sm leading-tight">
                        Colegio de Montalban
                    </h2>
                    <p className="text-white/70 text-xs mt-0.5">
                        Kasiglahan Village, Rodriguez Rizal
                    </p>
                </div>

            </div>

            {/* ACCENT BAR */}

            <div className="h-1 bg-yellow-400" />

            {/* ID TYPE BANNER */}

            <div className="bg-[#0B6B53] text-white/80 text-center text-[10px] tracking-widest uppercase py-1">
                Student Identification Card
            </div>

            {/* PHOTO */}

            <div className="flex justify-center pt-6 pb-4">

                <div className="relative">

                    <div className="w-28 h-28 rounded-full border-[3px] border-[#0B6B53] p-0.5">
                        <img
                            src={profilePicture}
                            alt={fullName}
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>

                    {/* Active dot */}
                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />

                </div>

            </div>

            {/* DETAILS */}

            <div className="px-5 pb-5">

                <div className="text-center mb-4">

                    <h3 className="text-lg font-medium uppercase tracking-wide text-gray-900">
                        {fullName}
                    </h3>

                    <p className="text-xs text-gray-500 mt-1 tracking-widest uppercase">
                        {studentNumber}
                    </p>

                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2.5">

                    <div className="flex justify-between items-center">
                        <span className="text-[11px] uppercase tracking-widest text-gray-400">
                            Program
                        </span>
                        <span className="bg-yellow-400 text-yellow-900 text-[11px] font-medium px-2.5 py-0.5 rounded">
                            {course}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-[11px] uppercase tracking-widest text-gray-400">
                            Year level
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                            {yearLevel}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-[11px] uppercase tracking-widest text-gray-400">
                            Status
                        </span>
                        <span className="flex items-center gap-1.5 bg-green-50 text-green-800 text-[11px] font-medium px-2.5 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            Active
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-[11px] uppercase tracking-widest text-gray-400">
                            Academic year
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                            {academicYear}
                        </span>
                    </div>

                </div>

            </div>

            {/* QR SECTION */}

            <div className="bg-gray-50 border-t border-gray-100 p-4 flex items-center gap-4">

                <div className="bg-white border border-gray-200 rounded-lg p-1.5 flex-shrink-0">
                    <QRCode
                        value={studentNumber}
                        size={72}
                    />
                </div>

                <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">
                        Student ID Verification
                    </p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                        Scan QR code to verify student identity and enrollment status.
                    </p>
                </div>

            </div>

            {/* FOOTER STRIP */}

            <div className="h-1.5 bg-[#0B6B53]" />

        </div>

    );

}
