import { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, Wand2 } from "lucide-react";

import Modal from "../common/Modal";
import { librarianService } from "../../services/librarianService";

const EMPTY = { firstName: "", lastName: "", idNumber: "", email: "", password: "" };

const input =
    "w-full rounded-lg border border-black/[0.1] px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#106A2E]";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

// Browser crypto, not Math.random. The Head still needs to hand this over to the staff.
function generatePassword() {
    const values = new Uint32Array(12);
    crypto.getRandomValues(values);

    const text = Array.from(values, (v) => ALPHABET[v % ALPHABET.length]).join("");

    return /[A-Za-z]/.test(text) && /\d/.test(text) ? text : generatePassword();
}

function Field({ label, className = "", children }) {
    return (
        <label className={`block ${className}`}>
            <span className="mb-1 block text-xs font-medium text-gray-600">
                {label} <span className="text-red-500">*</span>
            </span>
            {children}
        </label>
    );
}

export default function AddLibrarianModal({ open, onClose, onSaved }) {
    const [values, setValues] = useState(EMPTY);
    const [show, setShow] = useState(false);
    const [saving, setSaving] = useState(false);

    if (!open) return null;

    const bind = (key) => ({
        value: values[key],
        disabled: saving,
        onChange: (e) => setValues((prev) => ({ ...prev, [key]: e.target.value })),
    });

    const close = () => {
        setValues(EMPTY);
        setShow(false);
        onClose();
    };

    const submit = async (e) => {
        e.preventDefault();

        if (Object.values(values).some((v) => !String(v).trim())) {
            toast.error("Fill in every field.");
            return;
        }

        setSaving(true);

        try {
            await librarianService.create(values);
            toast.success("Library Staff account created.");
            setValues(EMPTY);
            setShow(false);
            onSaved?.();
            onClose();
        } catch (error) {
            toast.error(error?.message || "Unable to create the account.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open
            onClose={saving ? undefined : close}
            title="Add Library Staff"
            size="md"
            footer={
                <>
                    <button
                        type="button"
                        onClick={close}
                        disabled={saving}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="add-librarian-form"
                        disabled={saving}
                        className="rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                        {saving ? "Creating..." : "Create account"}
                    </button>
                </>
            }
        >
            <form id="add-librarian-form" onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="First name">
                    <input className={input} maxLength={75} autoComplete="off" {...bind("firstName")} />
                </Field>
                <Field label="Last name">
                    <input className={input} maxLength={75} autoComplete="off" {...bind("lastName")} />
                </Field>
                <Field label="Employee ID">
                    <input className={input} maxLength={50} autoComplete="off" {...bind("idNumber")} />
                </Field>
                <Field label="Email (used to sign in)">
                    <input type="email" className={input} maxLength={150} autoComplete="off" {...bind("email")} />
                </Field>

                <Field label="Temporary password" className="md:col-span-2">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type={show ? "text" : "password"}
                                className={`${input} pr-10`}
                                maxLength={72}
                                autoComplete="new-password"
                                {...bind("password")}
                            />
                            <button
                                type="button"
                                onClick={() => setShow((s) => !s)}
                                aria-label={show ? "Hide password" : "Show password"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#106A2E]"
                            >
                                {show ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                                setValues((prev) => ({ ...prev, password: generatePassword() }));
                                setShow(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.1] px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <Wand2 size={14} /> Generate
                        </button>
                    </div>
                    <span className="mt-1 block text-[11px] text-gray-400">
                        At least 8 characters with a letter and a number. Give it to the staff member in person.
                    </span>
                </Field>

                <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 md:col-span-2">
                    The role is always <span className="font-medium">Library Staff</span>. Staff can use the QR scanner
                    only and cannot open this module.
                </p>
            </form>
        </Modal>
    );
}