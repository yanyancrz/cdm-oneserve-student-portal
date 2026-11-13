import ClinicMedicalRecords from "./ClinicMedicalRecords";

export default function ClinicIntegration() {
    return <main className="admin-service-report mx-auto max-w-6xl space-y-5 p-4 sm:p-7">
        <header>
            <h1 className="text-3xl font-semibold text-[#1F1F1F]">Clinic</h1>
            <p className="mt-1 text-sm text-gray-500">Student medical records and clinic visit history.</p>
        </header>
        <ClinicMedicalRecords />
    </main>;
}
