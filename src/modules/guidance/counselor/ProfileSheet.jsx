import { useState } from "react";
import { Loader2, X } from "lucide-react";

import { Note } from "../components/GuidanceStates";
import { StepLabel, fieldClass } from "../components/GuidanceUi";
import { guidanceApi } from "../services/guidanceApi";

// Bottom sheet: counselor edits their own profile (title, room, specializations...).
export default function ProfileSheet({ profile, email, onClose, onDone }) {
    const [title, setTitle] = useState(profile?.title || "");
    const [room, setRoom] = useState(profile?.room || "");
    const [phone, setPhone] = useState(profile?.phone || "");
    const [department, setDepartment] = useState(profile?.department || "");
    const [specializations, setSpecializations] = useState((profile?.specializations || []).join(", "));
    const [bio, setBio] = useState(profile?.bio || "");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const submit = async () => {
        setError("");
        setSubmitting(true);
        try {
            await guidanceApi.updateCounselorProfile({
                title: title.trim() || null,
                room: room.trim() || null,
                phone: phone.trim() || null,
                department: department.trim() || null,
                specializations: specializations
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                bio: bio.trim() || null,
            });
            onDone();
        } catch (e) {
            setError(e.message || "Could not save your profile.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Edit profile"
                className="mx-auto max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl"
                style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-slate-200" />

                <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-slate-800">Edit profile</h2>
                        <p className="truncate text-xs text-slate-500">{email}</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div>
                    <StepLabel n={1} hint="e.g. Guidance Counselor III">Title</StepLabel>
                    <input aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass("green")} />
                </div>

                <div>
                    <StepLabel n={2}>Room</StepLabel>
                    <input aria-label="Room" value={room} onChange={(e) => setRoom(e.target.value)} className={fieldClass("green")} />
                </div>

                <div>
                    <StepLabel n={3}>Phone</StepLabel>
                    <input aria-label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass("green")} />
                </div>

                <div>
                    <StepLabel n={4}>Department / Institute</StepLabel>
                    <input aria-label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} className={fieldClass("green")} />
                </div>

                <div>
                    <StepLabel n={5} hint="separate with commas">Specializations</StepLabel>
                    <input
                        aria-label="Specializations (comma separated)"
                        placeholder="Academic, Personal, Career"
                        value={specializations}
                        onChange={(e) => setSpecializations(e.target.value)}
                        className={fieldClass("green")}
                    />
                </div>

                <div>
                    <StepLabel n={6} hint="optional">Bio</StepLabel>
                    <textarea
                        rows={3}
                        maxLength={1000}
                        aria-label="Bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className={`${fieldClass("green")} resize-none`}
                    />
                </div>

                {error && <Note tone="error">{error}</Note>}

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition active:scale-[0.99]"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={submit}
                        disabled={submitting}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#106A2E] py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
                    >
                        {submitting && <Loader2 className="animate-spin" size={16} aria-hidden="true" />}
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
