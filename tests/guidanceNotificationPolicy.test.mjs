import test from "node:test";
import assert from "node:assert/strict";
import { isRetiredGuidanceChat } from "../push-service/src/notificationPolicy.js";

test("retired Guidance messaging notifications are suppressed, including old deep links", () => {
    for (const message of [
        { Type: "GUIDANCE_CHAT_MESSAGE" },
        { Type: "guidance_chat_message" },
        { TargetUrl: "/guidance/chat" },
        { TargetUrl: "/guidance/chat/42?from=push" },
        { TargetUrl: "/guidance/counselor/chat/42" },
        { TargetUrl: "/guidance/counselor/chat#thread" },
    ]) assert.equal(isRetiredGuidanceChat(message), true);
});

test("appointments, follow-ups and other modules retain their notifications", () => {
    for (const message of [
        { Type: "GUIDANCE_APPOINTMENT_REQUEST", TargetUrl: "/guidance/counselor/appointments" },
        { Type: "GUIDANCE_APPOINTMENT_CONFIRMED", TargetUrl: "/guidance/appointments" },
        { Type: "GUIDANCE_FOLLOWUP_REQUEST", TargetUrl: "/guidance/appointments" },
        { Type: "LIBRARY_RESERVATION", TargetUrl: "/library/reserve" },
        { Type: "CLINIC_APPOINTMENT", TargetUrl: "/clinic" },
        { Type: "OTHER_MESSAGE", TargetUrl: "/another-module/chat" },
    ]) assert.equal(isRetiredGuidanceChat(message), false);
});
