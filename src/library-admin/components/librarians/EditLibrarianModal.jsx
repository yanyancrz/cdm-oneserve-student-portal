import { useState } from "react";
import toast from "react-hot-toast";

import Modal from "../common/Modal";
import { librarianService } from "../../services/librarianService";

const input =
    "w-full rounded-lg border border-black/[0.1] px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#106A2E]";

export default function EditLibrarianModal({ librarian, onClose, onSaved }) {
    const [values, setValues] = useState(() => ({
        fullName: librarian?.fullName || "",
        idNumber: librarian?.idNumber || "",
        email: librarian?.email || "",
    }));
    const [saving, setSaving] = useState(false);

    if (!librarian) return null;

    const bind = (key) => ({
        value: values[key],
        disabled: saving,
        onChange: (e) => setValues((prev) => ({ ...prev, [key]: e.target.value })),
    });

    const submit = async (e) => {
        e.preventDefault();

        if (Object.values(values).some((v) => !v.trim())) {
            toast.error("Fill in every field.");
            return;
        }

        setSaving(true);

        try {
            await librarianService.update(librarian.userId, values);
            toast.success("Account updated.");
            onSaved?.();
            onClose();
        } catch (error) {
            toast.error(error?.message || "Unable to save the changes.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open
            onClose={saving ? undefined : onClose}
            title="Edit Library Staff"
            size="sm"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-librarian-form"
                        disabled={saving}
                        className="rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                </>
            }
        >
            <form id="edit-librarian-form" onSubmit={submit} className="space-y-4">
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">Full name</span>
                    <input className={input} maxLength={150} {...bind("fullName")} />
                </label>
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">Employee ID</span>
                    <input className={input} maxLength={50} {...bind("idNumber")} />
                </label>
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">Email</span>
                    <input type="email" className={input} maxLength={150} {...bind("email")} />
                </label>

                <p className="text-xs text-gray-400">
                    The role and the password are not changed here. Use Reset password for a new password.
                </p>
            </form>
        </Modal>
    );
}