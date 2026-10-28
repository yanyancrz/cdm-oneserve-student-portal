import { useCallback, useEffect, useState } from "react";
import {
    AtSign,
    CheckCircle2,
    KeyRound,
    Loader2,
    ShieldCheck,
    UploadCloud,
} from "lucide-react";
import toast from "react-hot-toast";

import { API_URL } from "../../config/api";
import { lfAdminApi } from "../services/lfApi";
import { getUserId } from "../session";
import {
    LfButton,
    LfImage,
    LfNotice,
    LfPanel,
    LfPhotoPicker,
    LfSkeleton,
    lfInputClass,
} from "../components/lfUi";

// =====================================================
// PROFILE SETTINGS - the signed-in administrator's own
// account, inside the FIND console.
//
// Every call is to the SHARED OneServe profile API
// (/api/profile/*): the same endpoints the student and
// counselor portals use, so nothing about accounts is
// forked or duplicated here.
//
// Authorization: the user id comes from the signed-in
// session (the shared login wrote it), never from an
// input, URL or stored row this page can edit - an
// administrator can only ever change their OWN details.
// =====================================================

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getSession() {
    return {
        userId: getUserId(),
        email: localStorage.getItem("userEmail") || "",
        name: localStorage.getItem("userName") || "",
        role: localStorage.getItem("role") || localStorage.getItem("userRole") || "",
    };
}

/** A stored "/uploads/profile/xxx.jpg" path -> fetchable URL. */
function pictureUrl(path) {
    if (!path) return null;
    const raw = String(path).trim();
    if (!raw) return null;
    if (/^(https?:|blob:|data:|\/\/)/i.test(raw)) return raw;
    return `${API_URL.replace(/\/+$/, "")}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

export default function LfAdminProfilePage() {
    const session = getSession();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setError("");
        try {
            // The API reads the profile by the session's own email; a
            // stale email just falls back to the session data.
            const response = await lfAdminApi.profileMe(session.email);
            setProfile(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session.email]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!cancelled) await load();
        })();
        return () => {
            cancelled = true;
        };
    }, [load]);

    if (loading) return <LfSkeleton rows={4} />;
    if (error && !profile) return <LfNotice tone="bad">{error}</LfNotice>;

    const name = profile?.fullName || session.name || "Administrator";
    const email = profile?.email || session.email;
    const idNumber = profile?.idNumber || localStorage.getItem("idNumber") || "";
    const role = profile?.role || session.role;
    const picture = profile?.profilePicture || localStorage.getItem("profilePicture");

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-800">
                    Profile Settings
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                    Your own administrator account - email, password and
                    profile picture.
                </p>
            </div>

            {/* ---------- current account ---------- */}
            <LfPanel title="Your account" subtitle="As the FIND console sees you">
                <div className="flex flex-wrap items-center gap-4">
                    <LfImage
                        src={pictureUrl(picture)}
                        alt={name}
                        className="h-20 w-20 rounded-2xl"
                    />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                            {name}
                        </p>
                        <p className="text-xs text-slate-500">
                            {role || "Administrator"}
                            {idNumber ? ` · ${idNumber}` : ""}
                        </p>
                        <p className="text-xs text-slate-500">{email}</p>
                    </div>
                    <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#106A2E]/10 px-3 py-1 text-[10px] font-semibold text-[#106A2E]">
                        <ShieldCheck size={12} aria-hidden="true" />
                        Signed in
                    </span>
                </div>
            </LfPanel>

            {/* ---------- profile picture ---------- */}
            <AvatarSection
                userId={session.userId}
                currentPicture={picture}
                onSaved={(imageUrl) => {
                    // Keep the whole interface in sync: the console
                    // header reads the stored picture.
                    localStorage.setItem("profilePicture", imageUrl);
                    setProfile((prev) => ({
                        ...(prev || {}),
                        profilePicture: imageUrl,
                    }));
                }}
            />

            {/* ---------- email ---------- */}
            <EmailSection
                userId={session.userId}
                currentEmail={email}
                onSaved={(newEmail) => {
                    localStorage.setItem("userEmail", newEmail);
                    setProfile((prev) => ({ ...(prev || {}), email: newEmail }));
                    toast.success("Email updated.");
                }}
            />

            {/* ---------- password ---------- */}
            <PasswordSection userId={session.userId} />
        </div>
    );
}

// =====================================================
// PROFILE PICTURE
// =====================================================

function AvatarSection({ userId, currentPicture, onSaved }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const onPick = (picked) => {
        setError("");

        if (!ACCEPTED_TYPES.includes(picked.type || "")) {
            setError("Use a JPG, PNG or WebP image.");
            return;
        }
        if (picked.size > MAX_UPLOAD_BYTES) {
            setError("The image must be 5 MB or smaller.");
            return;
        }

        // Preview before saving - nothing is uploaded until the user
        // confirms.
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(picked);
        setFile(picked);
    };

    const onSave = async () => {
        if (!file) return;
        setSaving(true);
        setError("");
        try {
            const response = await lfAdminApi.uploadProfilePhoto(file, userId);
            const imageUrl = response?.data?.imageUrl || response?.imageUrl;
            if (!imageUrl) throw new Error("The server did not return the image URL.");
            onSaved(imageUrl);
            toast.success("Profile picture updated.");
            setFile(null);
            setPreview(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <LfPanel
            title="Profile picture"
            subtitle="Shown on your account across OneServe"
        >
            <div className="flex flex-wrap items-center gap-4">
                <LfPhotoPicker
                    onFile={onPick}
                    preview={preview}
                    className="min-w-[240px] flex-1"
                />

                <div className="text-center">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Current picture
                    </p>
                    <LfImage
                        src={pictureUrl(currentPicture)}
                        alt="Current profile picture"
                        className="h-24 w-24 rounded-2xl"
                    />
                </div>
            </div>

            {error && (
                <p className="mt-2">
                    <LfNotice tone="bad">{error}</LfNotice>
                </p>
            )}

            {preview && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <LfButton
                        onClick={onSave}
                        loading={saving}
                        type="button"
                    >
                        <UploadCloud size={14} aria-hidden="true" />
                        Upload picture
                    </LfButton>
                    <LfButton
                        variant="ghost"
                        onClick={() => {
                            setFile(null);
                            setPreview(null);
                        }}
                        disabled={saving}
                    >
                        Cancel
                    </LfButton>
                </div>
            )}
        </LfPanel>
    );
}

// =====================================================
// EMAIL - verified with an OTP the API emails to the
// NEW address, so a typo can never lock the account out.
// =====================================================

function EmailSection({ userId, currentEmail, onSaved }) {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const requestCode = async () => {
        const next = email.trim();

        if (!EMAIL_RE.test(next)) return setError("Enter a valid email address.");
        if (next.toLowerCase() === (currentEmail || "").toLowerCase())
            return setError("That is already your current email.");
        if (!currentPassword.trim())
            return setError("Enter your current password to change your email.");

        setBusy(true);
        setError("");
        try {
            const response = await lfAdminApi.requestEmailChange({
                userId,
                currentPassword,
                newEmail: next,
            });
            toast.success(response?.message || "Verification code sent.");
            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const verifyCode = async () => {
        if (!code.trim()) return setError("Enter the 6-digit code.");

        setBusy(true);
        setError("");
        try {
            await lfAdminApi.verifyEmailChange({
                userId,
                otpCode: code.trim(),
            });
            onSaved(email.trim());
            setStep(1);
            setEmail("");
            setCurrentPassword("");
            setCode("");
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <LfPanel title="Email address" subtitle="Used to sign in to OneServe">
            {step === 1 ? (
                <div className="space-y-3">
                    <div>
                        <label
                            htmlFor="lf-admin-email"
                            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                        >
                            New email address
                        </label>
                        <input
                            id="lf-admin-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder={currentEmail || "you@example.com"}
                            className={lfInputClass}
                            autoComplete="email"
                        />
                    </div>
                    <PasswordField
                        id="lf-admin-email-password"
                        label="Current password"
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        autoComplete="current-password"
                    />
                    {error && <LfNotice tone="bad">{error}</LfNotice>}
                    <LfButton onClick={requestCode} loading={busy} type="button">
                        <AtSign size={14} aria-hidden="true" />
                        Send verification code
                    </LfButton>
                    <p className="text-[11px] text-slate-400">
                        We send a 6-digit code to the new address to confirm you
                        own it before the change is saved.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-600">
                        A 6-digit code was sent to <strong>{email}</strong>.
                        Enter it below to finish the change.
                    </p>
                    <div>
                        <label
                            htmlFor="lf-admin-email-code"
                            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Verification code
                        </label>
                        <input
                            id="lf-admin-email-code"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            placeholder="000000"
                            maxLength={6}
                            className={`${lfInputClass} max-w-[180px] font-mono tracking-[0.3em]`}
                        />
                    </div>
                    {error && <LfNotice tone="bad">{error}</LfNotice>}
                    <div className="flex flex-wrap gap-2">
                        <LfButton onClick={verifyCode} loading={busy} type="button">
                            <CheckCircle2 size={14} aria-hidden="true" />
                            Verify and save
                        </LfButton>
                        <LfButton
                            variant="ghost"
                            onClick={() => {
                                setStep(1);
                                setCode("");
                                setError("");
                            }}
                            disabled={busy}
                        >
                            Use a different email
                        </LfButton>
                    </div>
                </div>
            )}
        </LfPanel>
    );
}

// =====================================================
// PASSWORD - verified against the current one on the
// server; the new one is only sent once it passes the
// strength rules.
// =====================================================

const PASSWORD_RULES = [
    { label: "At least 8 characters", test: (v) => v.length >= 8 },
    { label: "Upper and lowercase letters", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
    { label: "At least one number", test: (v) => /\d/.test(v) },
    { label: "At least one symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function PasswordSection({ userId }) {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const failedRule = PASSWORD_RULES.find((rule) => !rule.test(next));
    const mismatched = next !== confirm;

    const submit = async () => {
        if (!current.trim()) return setError("Current password is required.");
        if (failedRule) return setError(failedRule.label);
        if (mismatched) return setError("The new passwords do not match.");
        if (next === current) return setError("Choose a new password - not the current one.");

        setBusy(true);
        setError("");
        try {
            await lfAdminApi.changePassword({
                userId,
                currentPassword: current,
                newPassword: next,
            });
            toast.success("Password updated.");
            setCurrent("");
            setNext("");
            setConfirm("");
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <LfPanel title="Password" subtitle="Minimum 8 characters, mixed case, a number and a symbol">
            <div className="grid gap-3 sm:grid-cols-3">
                <PasswordField
                    id="lf-admin-current-password"
                    label="Current password"
                    value={current}
                    onChange={setCurrent}
                    autoComplete="current-password"
                />
                <PasswordField
                    id="lf-admin-new-password"
                    label="New password"
                    value={next}
                    onChange={setNext}
                    autoComplete="new-password"
                />
                <PasswordField
                    id="lf-admin-confirm-password"
                    label="Confirm new password"
                    value={confirm}
                    onChange={setConfirm}
                    autoComplete="new-password"
                />
            </div>

            {next && (
                <ul className="mt-3 space-y-1">
                    {PASSWORD_RULES.map((rule) => {
                        const ok = rule.test(next);
                        return (
                            <li
                                key={rule.label}
                                className={`flex items-center gap-1.5 text-[11px] ${
                                    ok ? "text-emerald-600" : "text-slate-400"
                                }`}
                            >
                                {ok ? (
                                    <CheckCircle2 size={12} aria-hidden="true" />
                                ) : (
                                    <Loader2 size={12} className="opacity-0" aria-hidden="true" />
                                )}
                                {rule.label}
                            </li>
                        );
                    })}
                </ul>
            )}

            {error && (
                <p className="mt-2">
                    <LfNotice tone="bad">{error}</LfNotice>
                </p>
            )}

            <div className="mt-3">
                <LfButton onClick={submit} loading={busy} type="button">
                    <KeyRound size={14} aria-hidden="true" />
                    Update password
                </LfButton>
            </div>
        </LfPanel>
    );
}

function PasswordField({ id, label, value, onChange, autoComplete }) {
    const [visible, setVisible] = useState(false);

    return (
        <div>
            <label
                htmlFor={id}
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    autoComplete={autoComplete}
                    className={lfInputClass}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[10px] font-semibold text-slate-400 transition hover:text-slate-600"
                >
                    {visible ? "Hide" : "Show"}
                </button>
            </div>
        </div>
    );
}
