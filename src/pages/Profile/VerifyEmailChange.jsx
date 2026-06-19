import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function VerifyEmailChange() {


const navigate = useNavigate();

const [digits, setDigits] =
    useState(["", "", "", "", "", ""]);

const inputRefs = useRef([]);

const otp = digits.join("");

const handleChange = (
    index,
    value
) => {

    const cleaned =
        value
            .replace(/[^0-9]/g, "")
            .slice(-1);

    const next = [...digits];

    next[index] = cleaned;

    setDigits(next);

    if (
        cleaned &&
        index < 5
    ) {
        inputRefs.current[
            index + 1
        ]?.focus();
    }

};

const handleKeyDown = (
    index,
    e
) => {

    if (
        e.key === "Backspace" &&
        !digits[index] &&
        index > 0
    ) {
        inputRefs.current[
            index - 1
        ]?.focus();
    }

};

const handleVerify =
    async () => {

        if (
            otp.length !== 6
        ) {

            alert(
                "Please enter a valid OTP."
            );

            return;
        }

        try {

            const userId = parseInt(
                localStorage.getItem(
                    "emailChangeUserId"
                )
            );

            const response =
                await fetch(
                    "http://localhost:5212/api/profile/verify-email-change",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            userId,
                            otpCode: otp
                        })
                    }
                );

           const data =
            await response.text();

                console.log(
                    "Status:",
                    response.status
                );

                console.log(
                    "Response:",
                    data
                );

                alert(
                    data || "No response"
                );

            if (
                response.ok
            ) {

                const newEmail =
                    localStorage.getItem(
                        "newEmail"
                    );

                localStorage.setItem(
                    "userEmail",
                    newEmail
                );

                localStorage.removeItem(
                    "emailChangeUserId"
                );

                localStorage.removeItem(
                    "newEmail"
                );

                navigate(
                    "/profile"
                );

            }

        }
        catch (error) {

            console.error(
                error
            );

            alert(
                "Unable to verify OTP."
            );

        }

    };

return (

    <div
        className="
            min-h-screen
            flex
            items-center
            justify-center
            px-4
        "
        style={{
            background:
                "#F1F1F1"
        }}
    >

        <div
            className="
                bg-white
                rounded-3xl
                p-8
                w-full
                max-w-md
                shadow-xl
                shadow-[#106A2E]/10
            "
        >

            <h1
                className="
                    text-xl
                    font-semibold
                    text-center
                    text-[#1F1F1F]
                "
            >
                Verify New Email
            </h1>

            <p
                className="
                    text-center
                    text-sm
                    text-gray-500
                    mt-2
                    mb-6
                "
            >
                Enter the OTP sent to your new email address.
            </p>

            <div
                className="
                    flex
                    justify-center
                    gap-2
                    mb-6
                "
            >

                {digits.map(
                    (
                        digit,
                        index
                    ) => (

                        <input
                            key={index}
                            ref={(el) =>
                                (
                                    inputRefs.current[index] =
                                        el
                                )
                            }
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) =>
                                handleChange(
                                    index,
                                    e.target.value
                                )
                            }
                            onKeyDown={(e) =>
                                handleKeyDown(
                                    index,
                                    e
                                )
                            }
                            className="
                                w-12
                                h-14
                                text-center
                                text-xl
                                font-semibold
                                rounded-xl
                                border
                                border-gray-200
                                bg-gray-50
                                focus:border-[#106A2E]
                                outline-none
                            "
                        />

                    )
                )}

            </div>

            <button
                onClick={
                    handleVerify
                }
                className="
                    w-full
                    bg-[#106A2E]
                    hover:bg-[#0D7856]
                    text-white
                    p-3
                    rounded-xl
                    font-semibold
                    transition-all
                "
            >
                Verify Email
            </button>

        </div>

    </div>

);

}
