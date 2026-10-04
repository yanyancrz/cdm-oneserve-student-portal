import { useState } from "react";
import toast from "react-hot-toast";

import Modal from "../common/Modal";
import Scanner from "../../../pages/Library/Scanner"; // the EXISTING scanner
import { borrowingService } from "../../services/borrowingService";

// Thin wrapper only. The camera and QR decoding are the existing Scanner.
export default function ScanPatronModal({ open, onClose, onPatron }) {
    const [checking, setChecking] = useState(false);

    if (!open) return null;

    const handleDetected = async (qrText) => {
        setChecking(true);

        try {
            const patron = await borrowingService.scanPatron(qrText);
            onPatron(patron);
            onClose();
        } catch (error) {
            // The camera stays stopped; press "Start Camera" to scan again.
            toast.error(error?.message || "Unable to read this QR code.");
        } finally {
            setChecking(false);
        }
    };

    return (
        <Modal open onClose={checking ? undefined : onClose} title="Scan patron QR" size="md">
            <Scanner embedded onDetected={handleDetected} />

            {checking && <p className="mt-3 text-center text-sm text-gray-500">Checking account...</p>}
        </Modal>
    );
}