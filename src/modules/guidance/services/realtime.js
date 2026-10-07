import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

import { API_URL } from "../../../config/api";
import { getToken } from "../utils/session";

// =========================================================
// GUIDANCE REAL-TIME (SignalR)
//
// The API pushes two events to every signed-in user:
//   - "ChatMessage"   -> a new chat message (to user:{id} and
//                        convo:{id} groups)
//   - "Notification"  -> a new Guidance alert (to user:{id})
//
// This module keeps ONE connection for the whole Guidance module,
// reconnects automatically when it drops, and never throws —
// every page keeps its REST polling as a safety net.
// =========================================================

const HUB_URL = `${API_URL}/hubs/guidance`;

const handlers = new Map(); // event name -> Set<handler>

let connection = null;
let startPromise = null;
let retryTimer = null;

function emit(event, payload) {
    const set = handlers.get(event);
    if (!set) return;

    set.forEach((fn) => {
        try {
            fn(payload);
        } catch {
            // A broken listener must never break the connection.
        }
    });
}

function build() {
    connection = new HubConnectionBuilder()
        .withUrl(HUB_URL, { accessTokenFactory: () => getToken() || "" })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 20000, 30000])
        .configureLogging(LogLevel.Warning)
        .build();

    connection.on("ChatMessage", (payload) => emit("ChatMessage", payload));
    connection.on("Notification", (payload) => emit("Notification", payload));

    connection.onclose(() => {
        startPromise = null;
        scheduleReconnect();
    });
}

// One extra retry after a full drop (the hub's own automatic
// reconnect has already run its backoff at this point).
function scheduleReconnect() {
    if (retryTimer) return;

    retryTimer = setTimeout(() => {
        retryTimer = null;
        if (getToken()) connectGuidanceHub().catch(() => {});
    }, 3000);
}

export async function connectGuidanceHub() {
    if (!getToken()) return;

    if (!connection) build();
    if (connection.state === "Connected") return;
    if (startPromise) return startPromise;

    startPromise = connection
        .start()
        .then(() => {
            startPromise = null;
        })
        .catch((error) => {
            startPromise = null;
            throw error;
        });

    return startPromise;
}

// Subscribe to a hub event ("ChatMessage" | "Notification").
// Returns an unsubscribe function.
export function onGuidanceEvent(event, handler) {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event).add(handler);

    return () => handlers.get(event)?.delete(handler);
}

// Invoke a hub method (e.g. JoinConversation). Safe to call
// before the connection is up — it just no-ops.
export async function invokeGuidanceHub(method, ...args) {
    try {
        await connectGuidanceHub();

        if (connection && connection.state === "Connected") {
            await connection.invoke(method, ...args);
        }
    } catch {
        // Real-time is best-effort; polling still works.
    }
}

export function guidanceHubState() {
    return connection?.state ?? "Disconnected";
}
