import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DigitalIDCard from "../../components/DigitalIDCard/DigitalIDCard";
import { API_URL } from "../../config/api";
import BackgroundLayout from "../../layouts/BackgroundLayout";

export default function ViewDigitalID() {

    const [digitalId, setDigitalId] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {

        const email =
            localStorage.getItem("userEmail");

        fetch(`${API_URL}/api/digitalid/view/${email}`)
            .then(res => res.json())
            .then(data => {
                console.log(data);
                setDigitalId(data);
            })
            .catch(() => {
                setDigitalId(null);
            })
            .finally(() => {
                setLoading(false);
            });

    }, []);

    if (loading) {
        return (
            <BackgroundLayout>
                <div className="min-h-screen flex items-center justify-center">
                    Loading...
                </div>
            </BackgroundLayout>
        );
    }

    // MAY PENDING REQUEST
    if (
        digitalId &&
        digitalId.requestSubmitted &&
        !digitalId.hasDigitalId
    ) {
        return (
            <BackgroundLayout>

                <div className="min-h-screen flex items-center justify-center p-4">

                    <div className="bg-white rounded-2xl p-6 shadow-lg w-full max-w-sm text-center">

                        <h2 className="text-xl font-semibold mb-3">
                            Request Submitted
                        </h2>

                        <p className="text-gray-500 mb-3">
                            Your Digital ID request has been received.
                        </p>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">

                            <p className="text-sm font-medium text-amber-700">
                                Status: {digitalId.status}
                            </p>

                            <p className="text-xs text-amber-600 mt-2">
                                You'll be notified once your Digital ID is ready.
                            </p>

                        </div>

                    </div>

                </div>

            </BackgroundLayout>
        );
    }

    // WALANG REQUEST
    if (!digitalId || !digitalId.hasDigitalId) {

        return (

            <BackgroundLayout>

                <div className="min-h-screen flex items-center justify-center p-4">

                    <div className="bg-white rounded-2xl p-6 shadow-lg w-full max-w-sm text-center">

                        <h2 className="text-xl font-semibold mb-3">
                            No Digital ID Found
                        </h2>

                        <p className="text-gray-500 mb-5">
                            Please submit a Digital ID request first.
                        </p>

                        <button
                            onClick={() =>
                                navigate("/request-digital-id")
                            }
                            className="
                                w-full
                                bg-[#106A2E]
                                text-white
                                p-3
                                rounded-xl
                                font-medium
                            "
                        >
                            Request Digital ID
                        </button>

                    </div>

                </div>

            </BackgroundLayout>

        );
    }

    // APPROVED DIGITAL ID
    return (

        <BackgroundLayout>

            <div className="min-h-screen bg-slate-100 p-4">

                <div className="max-w-md mx-auto">

                    <h1 className="text-2xl font-bold mb-4">
                        Digital ID
                    </h1>

                    <DigitalIDCard
                        {...digitalId}
                    />

                </div>

            </div>

        </BackgroundLayout>

    );
}