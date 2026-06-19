import QRCode from "react-qr-code";
import DigitalIDCard from "../../components/DigitalIDCard/DigitalIDCard";



export default function ViewDigitalID() {

    return (

        <div className="min-h-screen bg-slate-100 p-4">

            <div className="max-w-md mx-auto">

                <h1 className="text-2xl font-bold mb-4">
                    Digital Student ID
                </h1>

                <DigitalIDCard

                    studentNumber="23-0001"

                    fullName="ALHIANNE JHANE CRUZ"

                    course="BS INFORMATION TECHNOLOGY"

                    yearLevel="3RD YEAR"

                    profilePicture="https://i.pravatar.cc/300"

                    birthday="December 13, 2005"

                    contactNumber="09123456789"

                    email="student@cdm.edu.ph"

                    address="Rodriguez, Rizal"

                    emergencyContact="APRIL F. DEL ROSARIO"

                    emergencyNumber="09514464991"

                />

            </div>

        </div>

    );
}