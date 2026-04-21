"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MoreVertical, Paperclip, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/libs/utils/utils";
import { commonService } from "@/libs/api/services";
import { useAuth } from "@/libs/stores/auth.store";
import { useSignalR, type IncomingMessage } from "@/contexts/signalr-context";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface ChatInterfaceProps {
  receiver: {
    id: string;
    name: string;
    avatarUrl: string;
  };
}

export function ChatInterface({ receiver }: ChatInterfaceProps) {
  const [messageInput, setMessageInput] = useState("");
  const { user } = useAuth();
  const myUserId = user?.userId;
  const { onMessage, connectionStatus } = useSignalR();

  const [messages, setMessages] = useState<Message[]>([]);
  const shouldScrollRef = useRef(false);

  // Keep refs in sync so the SignalR callback always reads the latest values
  const otherUserIdRef = useRef<string>(receiver.id);
  const myUserIdRef = useRef<string | null>(myUserId ?? null);

  useEffect(() => {
    myUserIdRef.current = myUserId ?? null;
  }, [myUserId]);

  useEffect(() => {
    otherUserIdRef.current = receiver.id;
    setMessages([]); // reset view when switching conversations
  }, [receiver.id]);

  /* ─── helpers ─────────────────────────────────────────────── */
  const formatCreatedAt = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateLabel = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    if (isSameDay(d, today)) return "Hôm nay";
    if (isSameDay(d, yesterday)) return "Hôm qua";
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" }).format(d);
  };

  const getDayKey = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  /* ─── Subscribe to the shared SignalR connection ───────────── */
  const handleIncomingMessage = useCallback(
    (msg: IncomingMessage) => {
      const myIdNow = myUserIdRef.current;
      const otherIdNow = otherUserIdRef.current;
      if (!myIdNow || !otherIdNow) return;

      const sId = msg.senderId.toLowerCase();
      const rId = msg.receiverId.toLowerCase();
      const myId = myIdNow.toLowerCase();
      const otherId = otherIdNow.toLowerCase();

      // Only update messages that belong to the currently-open conversation
      const isBetweenCurrentUsers =
        (sId === myId && rId === otherId) ||
        (sId === otherId && rId === myId);

      if (!isBetweenCurrentUsers) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev; // deduplicate
        shouldScrollRef.current = true;
        return [...prev, msg].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    },
    [] // stable — reads values via refs
  );

  useEffect(() => {
    const unsubscribe = onMessage(handleIncomingMessage);
    return unsubscribe;
  }, [onMessage, handleIncomingMessage]);

  /* ─── Load history when receiver changes ──────────────────── */
  const loadMessages = useCallback(async (receiverId: string, replace = true) => {
    try {
      await commonService.markConversationAsRead(receiverId);

      const res = await commonService.getMessages({
        userId: receiverId,
        page: 1,
        limit: 100,
      });

      const apiMessages: any[] = res.data?.data ?? [];

      const sorted = apiMessages
        .map((m) => ({
          id: String(m.id || m.Id),
          senderId: String(m.senderId || m.SenderId),
          receiverId: String(m.receiverId || m.ReceiverId),
          content: String(m.content || m.Content),
          read: !!m.read,
          createdAt: m.createdAt || m.CreatedAt,
        }))
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

      if (replace) {
        shouldScrollRef.current = true;
        setMessages(sorted);
      } else {
        // Merge: add only messages we don't already have
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = sorted.filter((m) => !existingIds.has(m.id));
          if (newMsgs.length === 0) return prev;
          shouldScrollRef.current = true;
          return [...prev, ...newMsgs].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      }
    } catch (e) {
      console.error("Failed to load messages:", e);
      if (replace) setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (!receiver.id) return;
    loadMessages(receiver.id, true);
  }, [receiver.id, loadMessages]);

  /* ─── Catch up on reconnect (messages missed while offline) ── */
  const prevStatusRef = useRef(connectionStatus);
  useEffect(() => {
    const wasDisconnected =
      prevStatusRef.current !== "connected" && connectionStatus === "connected";
    prevStatusRef.current = connectionStatus;

    if (wasDisconnected && receiver.id) {
      // Merge any messages we missed while SignalR was down
      loadMessages(receiver.id, false);
    }
  }, [connectionStatus, receiver.id, loadMessages]);

  /* ─── Auto-scroll ─────────────────────────────────────────── */
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldScrollRef.current = false;
    }
  }, [messages]);

  /* ─── Send message ────────────────────────────────────────── */
  const handleSendMessage = async () => {
    const content = messageInput.trim();
    if (!content || !receiver.id) return;

    setMessageInput("");

    try {
      const res = await commonService.sendMessage(receiver.id, content);

      if (res.data) {
        setMessages((prev) => {
          const id = res.data.id;
          if (prev.some((m) => m.id === id)) return prev;
          shouldScrollRef.current = true;
          const msg: Message = {
            id,
            senderId: res.data.senderId,
            receiverId: res.data.receiverId,
            content: res.data.content,
            read: !!res.data.read,
            createdAt: res.data.createdAt,
          };
          return [...prev, msg].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      }
    } catch (e) {
      console.error("Failed to send message:", e);
      setMessageInput(content);
    }
  };

  if (!receiver.id) return null;

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white">
      {/* Chat Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="sm:hidden" asChild>
            <Link href="/farmer/messages">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={receiver.avatarUrl} />
            <AvatarFallback className="bg-agro-green text-white">
              {receiver.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{receiver.name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" }}
      >
        {messages.map((message, index) => {
          const isMine =
            !!myUserId &&
            message.senderId.toLowerCase() === myUserId.toLowerCase();
          const prevMessage = messages[index - 1];
          const showDateBar =
            !prevMessage ||
            getDayKey(prevMessage.createdAt) !== getDayKey(message.createdAt);
          return (
            <div key={message.id}>
              {/* Date separator */}
              {showDateBar && (
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted shrink-0">
                    {formatDateLabel(message.createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              {/* Message bubble */}
              <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-4 py-2",
                    isMine ? "bg-agro-green text-white" : "bg-gray-100 text-foreground"
                  )}
                >
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <span
                    className={cn(
                      "text-xs mt-1 block",
                      isMine ? "text-white/70" : "text-muted-foreground"
                    )}
                  >
                    {formatCreatedAt(message.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Nhập tin nhắn..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            className="bg-agro-green hover:bg-agro-green-dark"
            disabled={!messageInput.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
