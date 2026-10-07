import { useState } from "react";
import toast from "react-hot-toast";

import { Modal } from "../common";
import guidanceHeadService from "../../services/guidanceHeadService";

const input =
    "w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-[#106A2E]";
const label = "mb-1.5 block text-xs font-medium text-gray-500";

function Field({ children, className = "" }) {
    return <div className={className}>{children}</div>;
}

// Rendered only while open (the page unmounts it on close), so the form always
// starts from the values below - no reset effect needed.
//
// Props
//  - counselor : null for "add", or the row being edited
export default function CounselorFormModal({ counselor, onClose, onSaved }) {
    const isEdit = Boolean(counselor);

    const [fullName, setFullName] = useState(counselor?.fullName || "");
    const [email, setEmail] = useState(counselor?.email || "");
    const [idNumber, setIdNumber] = useState(counselor?.idNumber || "");
    const [password, setPassword] = useState("");
    const [title, setTitle] = useState(counselor?.title || "");
    const [room, setRoom] = useState(counselor?.room || "");
    const [department, setDepartment] = useState(counselor?.department || "");
    const [phone, setPhone] = useState(counselor?.phone || "");
    const [specializations, setSpecializations] = useState(counselor?.specializations || "");
    const [bio, setBio] = useState(counselor?.bio || "");
    const [busy, setBusy] = useState(false);
    const [formError, setFormError] = useState(null);

    const validate = () => {
        if (!fullName.trim()) return "Full name is required.";
        if (!email.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address.";
        if (!isEdit && !idNumber.trim()) return "ID number is required.";
        if (!isEdit && password.length < 8) return "Password must be at least 8 characters.";
        return null;
    };

    const submit = async (event) => {
        event.preventDefault();

        const problem = validate();
        if (problem) {
            setFormError(problem);
            return;
        }

        setBusy(true);
        setFormError(null);

        const payload = {
            fullName: fullName.trim(),
            email: email.trim(),
            title: title.trim() || null,
            room: room.trim() || null,
            department: department.trim() || null,
            phone: phone.trim() || null,
            bio: bio.trim() || null,
            specializations: specializations
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
        };

        try {
            if (isEdit) {
                await guidanceHeadService.updateCounselor(counselor.userId, payload);
                toast.success("Counselor updated.");
            } else {
                await guidanceHeadService.createCounselor({
                    ...payload,
                    idNumber: idNumber.trim(),
                    password,
                });
                toast.success("Counselor account created.");
            }

            onSaved?.();
            onClose();
        } catch (err) {
            setFormError(err?.message || "Unable to save the counselor.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            open
            onClose={busy ? undefined : onClose}
            title={isEdit ? "Edit counselor" : "Add counselor"}
            size="lg"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="counselor-form"
                        disabled={busy}
                        className="rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                        {busy ? "Saving..." : isEdit ? "Save changes" : "Create account"}
                    </button>
                </>
            }
        >
            <form id="counselor-form" onSubmit={submit} className="space-y-4">
                {formError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                        {formError}
                    </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                        <label className={label} htmlFor="c-fullname">
                            Full name *
                        </label>
                        <input
                            id="c-fullname"
                            className={input}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Juan Dela Cruz"
                            required
                        />
                    </Field>

                    <Field>
                        <label className={label} htmlFor="c-email">
                            Email *
                        </label>
                        <input
                            id="c-email"
                            type="email"
                            className={input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="counselor@cdm.edu.ph"
                            required
                        />
                    </Field>

                    {!isEdit && (
                        <>
                            <Field>
                                <label className={label} htmlFor="c-idnumber">
                                    ID number *
                                </label>
                                <input
                                    id="c-idnumber"
                                    className={input}
                                    value={idNumber}
                                    onChange={(e) => setIdNumber(e.target.value)}
                                    placeholder="22-00000"
                                    required
                                />
                            </Field>

                            <Field>
                                <label className={label} htmlFor="c-password">
                                    Temporary password *
                                </label>
                                <input
                                    id="c-password"
                                    type="password"
                                    autoComplete="new-password"
                                    className={input}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 8 characters"
                                    required
                                />
                                <p className="mt-1 text-[11px] text-gray-400">
                                    Share this with the counselor - they can change it after signing in.
                                </p>
                            </Field>
                        </>
                    )}

                    <Field>
                        <label className={label} htmlFor="c-title">
                            Title
                        </label>
                        <input
                            id="c-title"
                            className={input}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Licensed Guidance Counselor"
                        />
                    </Field>

                    <Field>
                        <label className={label} htmlFor="c-department">
                            Department
                        </label>
                        <input
                            id="c-department"
                            className={input}
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="Guidance Office"
                        />
                    </Field>

                    <Field>
                        <label className={label} htmlFor="c-room">
                            Room
                        </label>
                        <input
                            id="c-room"
                            className={input}
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            placeholder="rm 101"
                        />
                    </Field>

                    <Field>
                        <label className={label} htmlFor="c-phone">
                            Contact number
                        </label>
                        <input
                            id="c-phone"
                            className={input}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="09xx xxx xxxx"
                        />
                    </Field>

                    <Field className="sm:col-span-2">
                        <label className={label} htmlFor="c-spec">
                            Specializations
                        </label>
                        <input
                            id="c-spec"
                            className={input}
                            value={specializations}
                            onChange={(e) => setSpecializations(e.target.value)}
                            placeholder="Academic, Personal, Career"
                        />
                        <p className="mt-1 text-[11px] text-gray-400">Separate each with a comma.</p>
                    </Field>

                    <Field className="sm:col-span-2">
                        <label className={label} htmlFor="c-bio">
                            Short bio
                        </label>
                        <textarea
                            id="c-bio"
                            rows={3}
                            className={`${input} resize-y`}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Shown to students on the counselor card."
                        />
                    </Field>
                </div>
            </form>
        </Modal>
    );
}
