"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { API_CONFIG } from "@/libs/api/endpoints/config";
import { STORAGE_KEYS } from "@/constants";
import { useAuth } from "@/libs/stores/auth.store";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IncomingMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

type MessageHandler = (msg: IncomingMessage) => void;

interface SignalRContextValue {
  /** Subscribe to incoming messages. Returns an unsubscribe fn. */
  onMessage: (handler: MessageHandler) => () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SignalRContext = createContext<SignalRContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SignalRProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const myUserId = user?.userId;

  // Stable set of subscriber callbacks
  const handlersRef = useRef<Set<MessageHandler>>(new Set());
  const connectionRef = useRef<HubConnection | null>(null);

  const hubBaseUrl = API_CONFIG.BASE_URL.replace(/\/api\/v1\/?$/, "");

  /** Normalises the raw SignalR payload (camelCase or PascalCase) */
  const normalise = (raw: any): IncomingMessage | null => {
    const id: string = raw.id ?? raw.Id ?? "";
    const senderId: string = raw.senderId ?? raw.SenderId ?? "";
    const receiverId: string = raw.receiverId ?? raw.ReceiverId ?? "";
    const content: string = raw.content ?? raw.Content ?? "";
    const read: boolean =
      raw.read !== undefined ? !!raw.read : !!raw.Read;
    const createdAt: string =
      raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString();

    if (!id || !senderId || !receiverId) return null;
    return { id, senderId, receiverId, content, read, createdAt };
  };

  /** Fan-out an incoming message to all current subscribers */
  const dispatch = useCallback((raw: any) => {
    const msg = normalise(raw);
    if (!msg) return;
    handlersRef.current.forEach((h) => h(msg));
  }, []);

  // ─── Connection lifecycle (runs once per authenticated user) ───────────────
  useEffect(() => {
    if (!myUserId) return;

    let cancelled = false;

    const startConnection = async () => {
      // Reuse an already-connected instance
      if (
        connectionRef.current &&
        connectionRef.current.state === HubConnectionState.Connected
      ) {
        connectionRef.current.off("NewMessage");
        connectionRef.current.off("ReceiveMessage");
        connectionRef.current.on("NewMessage", dispatch);
        connectionRef.current.on("ReceiveMessage", dispatch);
        return;
      }

      // Tear down any stale connection
      if (connectionRef.current) {
        try {
          await connectionRef.current.stop();
        } catch {
          /* ignore */
        }
        connectionRef.current = null;
      }

      if (cancelled) return;

      const conn = new HubConnectionBuilder()
        .withUrl(`${hubBaseUrl}/hubs/chat`, {
          accessTokenFactory: () =>
            localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? "",
        })
        .withAutomaticReconnect()
        .configureLogging({
          log: (level, message) => {
            // Suppress noisy Strict-Mode teardown errors
            if (
              message.includes("stopped during negotiation") ||
              message.includes("before stop() was called")
            )
              return;
            if (level >= LogLevel.Information) {
              if (level === LogLevel.Error || level === LogLevel.Critical)
                console.error("[SignalR]", message);
              else if (level === LogLevel.Warning)
                console.warn("[SignalR]", message);
              else console.log("[SignalR]", message);
            }
          },
        })
        .build();

      conn.on("NewMessage", dispatch);
      conn.on("ReceiveMessage", dispatch);

      conn.onreconnected(() => {
        console.log("[SignalR] Reconnected — re-attaching listeners");
        conn.off("NewMessage");
        conn.off("ReceiveMessage");
        conn.on("NewMessage", dispatch);
        conn.on("ReceiveMessage", dispatch);
      });

      conn.onclose((err) => {
        if (err) console.error("[SignalR] Closed with error:", err);
      });

      connectionRef.current = conn;

      try {
        await conn.start();
        if (cancelled) {
          conn.stop().catch(() => {});
          connectionRef.current = null;
          return;
        }
        console.log("[SignalR] Connected (shared provider)");
      } catch (e: any) {
        if (
          e?.name === "AbortError" ||
          e?.message?.includes("stopped during negotiation") ||
          e?.message?.includes("before stop() was called")
        )
          return;
        console.error("[SignalR] Connect failed:", e);
      }
    };

    startConnection();

    return () => {
      cancelled = true;
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {});
        connectionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myUserId]);

  // ─── Public API ───────────────────────────────────────────────────────────
  const onMessage = useCallback((handler: MessageHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  return (
    <SignalRContext.Provider value={{ onMessage }}>
      {children}
    </SignalRContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSignalR() {
  const ctx = useContext(SignalRContext);
  if (!ctx) {
    throw new Error("useSignalR must be used inside <SignalRProvider>");
  }
  return ctx;
}
