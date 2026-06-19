import QRCode from "react-qr-code";


export default function DigitalIDBack({

    studentNumber,
    birthday,
    contactNumber,
    email,
    address,
    emergencyContact,
    emergencyNumber

}) {

    return (

        <div
            className="
                bg-white
                rounded-3xl
                overflow-hidden
                shadow-2xl
                max-w-sm
                mx-auto
            "
        >

            <div
                className="
                    bg-[#0B6B53]
                    text-white
                    p-4
                "
            >

                <h2 className="font-bold text-lg">
                    CDM OneServe
                </h2>

                <p className="text-sm">
                    Digital Student ID
                </p>

            </div>

            <div className="p-5">

                <div className="flex justify-center mb-5">

                    <QRCode
                        value={studentNumber}
                        size={140}
                    />

                </div>

                <div className="space-y-3 text-sm">

                    <p>
                        <strong>Birthday:</strong>
                        {" "}
                        {birthday}
                    </p>

                    <p>
                        <strong>Contact:</strong>
                        {" "}
                        {contactNumber}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        {" "}
                        {email}
                    </p>

                    <p>
                        <strong>Address:</strong>
                        {" "}
                        {address}
                    </p>

                    <hr />

                    <p>
                        <strong>Emergency Contact:</strong>
                        {" "}
                        {emergencyContact}
                    </p>

                    <p>
                        <strong>Emergency Number:</strong>
                        {" "}
                        {emergencyNumber}
                    </p>

                </div>

                <div
                    className="
                        mt-5
                        text-center
                        text-xs
                        text-gray-500
                    "
                >
                    Scan QR Code for Verification
                </div>

            </div>

        </div>

    );

}