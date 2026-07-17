import QRCode from "react-qr-code";
import logo from "../../assets/images/cdm-logo.png";

export default function DigitalIDBack({
    isFullscreen = false,
    idNumber,
    issuedDate,
    expirationDate,
    email,
    contactNumber,
    address,
    qrCode,
}) {

    const schoolName     = isFullscreen ? "text-[20px]"  : "text-[12px]";
    const schoolSub      = isFullscreen ? "text-[13px]"  : "text-[9px]";
    const labelSize      = isFullscreen ? "text-[11px]"  : "text-[8px]";
    const valueSize      = isFullscreen ? "text-[17px]"  : "text-[12px]";
    const emailSize      = isFullscreen ? "text-[15px]"  : "text-[11px]";
    const qrLabel        = isFullscreen ? "text-[12px]"  : "text-[8px]";
    const qrSub          = isFullscreen ? "text-[10px]"  : "text-[6.5px]";
    const footerSize     = isFullscreen ? "text-[11px]"  : "text-[7px]";
    const disclaimerSize = isFullscreen ? "text-[10px]"  : "text-[6px]";

    const qrSize   = isFullscreen ? 120  : 72;
    const qrColW   = isFullscreen ? "w-[200px]" : "w-[120px]";
    const logoBox  = isFullscreen ? "w-14 h-14" : "w-8 h-8";
    const logoImg  = isFullscreen ? "w-9 h-9"   : "w-5 h-5";

    // Tight padding to prevent overflow
    const headerPad = isFullscreen ? "px-6 py-3"   : "px-4 py-2";
    const bodyPadL  = isFullscreen ? "px-6 py-4"   : "px-3 py-2.5";
    const bodyPadR  = isFullscreen ? "px-4 py-3"   : "px-2 py-2";
    const rowGapY   = isFullscreen ? "gap-y-[10px]" : "gap-y-[6px]";

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
            {/* HEADER */}
            <div className={`bg-[#0B6B53] rounded-t-[18px] ${headerPad} flex-shrink-0`}>
                <div className="flex items-center gap-2">
                    <div className={`${logoBox} rounded-md bg-white flex items-center justify-center flex-shrink-0`}>
                        <img src={logo} alt="CDM Logo" className={`${logoImg} object-contain`} />
                    </div>
                    <div>
                        <h2 className={`text-white font-semibold ${schoolName} leading-tight`}>
                            COLEGIO DE MONTALBAN
                        </h2>
                        <p className={`text-white/70 ${schoolSub} leading-tight`}>
                            Digital Student Identification
                        </p>
                    </div>
                </div>
            </div>

            {/* GOLD STRIP */}
            <div className="h-[3px] bg-[#F4D35E] flex-shrink-0" />

            {/* CONTENT */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* LEFT SIDE */}
                <div className={`flex-1 ${bodyPadL} overflow-hidden flex flex-col`}>
                    <div className="flex-1 flex flex-col justify-between">

                        {/* Short fields in a 2-column grid to save vertical space */}
                        <div className={`grid grid-cols-2 gap-x-3 ${rowGapY}`}>
                            <div>
                                <p className={`${labelSize} uppercase tracking-[1.5px] text-gray-400 leading-none`}>
                                    ID Number
                                </p>
                                <p className={`${valueSize} font-semibold leading-tight truncate`}>
                                    {idNumber}
                                </p>
                            </div>

                            <div>
                                <p className={`${labelSize} uppercase tracking-[1.5px] text-gray-400 leading-none`}>
                                    Contact No.
                                </p>
                                <p className={`${valueSize} font-semibold leading-tight truncate`}>
                                    {contactNumber || "-"}
                                </p>
                            </div>

                            <div>
                                <p className={`${labelSize} uppercase tracking-[1.5px] text-gray-400 leading-none`}>
                                    Issued Date
                                </p>
                                <p className={`${valueSize} font-semibold leading-tight`}>
                                    {issuedDate ? new Date(issuedDate).toLocaleDateString() : "-"}
                                </p>
                            </div>

                            <div>
                                <p className={`${labelSize} uppercase tracking-[1.5px] text-gray-400 leading-none`}>
                                    Expiration Date
                                </p>
                                <p className={`${valueSize} font-semibold leading-tight`}>
                                    {expirationDate ? new Date(expirationDate).toLocaleDateString() : "-"}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className={`${labelSize} uppercase tracking-[1.5px] text-gray-400 leading-none`}>
                                Email
                            </p>
                            <p className={`${emailSize} font-medium truncate leading-tight`}>
                                {email}
                            </p>
                        </div>

                        <div>
                            <p className={`${labelSize} uppercase tracking-[1.5px] text-gray-400 leading-none`}>
                                Address
                            </p>
                            <p
                                className={`${emailSize} font-medium leading-tight overflow-hidden text-ellipsis`}
                                style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: isFullscreen ? 2 : 1,
                                    WebkitBoxOrient: "vertical",
                                }}
                            >
                                {address || "-"}
                            </p>
                        </div>

                    </div>
                </div>

                {/* DIVIDER */}
                <div className="w-px bg-gray-200 flex-shrink-0" />

                {/* RIGHT SIDE — QR */}
                <div className={`${qrColW} flex flex-col items-center justify-center ${bodyPadR} flex-shrink-0`}>
                    <div className="border border-gray-200 rounded-lg p-1 bg-white">
                        <QRCode value={qrCode || ""} size={qrSize} />
                    </div>
                    <p className={`mt-1 ${qrLabel} font-semibold text-[#106A2E] leading-tight`}>
                        SCAN TO VERIFY
                    </p>
                    <p className={`${qrSub} text-center text-gray-500 mt-0.5 leading-tight`}>
                        Verify this Digital ID<br />through CDM OneServe
                    </p>
                </div>

            </div>

            {/* DISCLAIMER — only show if space allows */}
            {isFullscreen && (
                <div className="px-6 pb-1 flex-shrink-0">
                    <div className="border-t pt-1">
                        <p className={`${disclaimerSize} text-gray-400 text-center leading-tight`}>
                            This Digital ID remains the property of Colegio de Montalban.
                            Any misuse, duplication, or unauthorized transfer is strictly prohibited.
                        </p>
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <div className={`bg-[#0B6B53] rounded-b-[18px] text-white/75 ${footerSize} tracking-[1px] uppercase text-center py-1.5 px-2 flex-shrink-0`}>
                CDM OneServe • Verify • Connect • Secure
            </div>

        </div>
    );
}