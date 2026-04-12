"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MoreVertical, Paperclip, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/libs/utils/utils";
import { HubConnection, HubConnectionBuilder, HttpTransportType, LogLevel } from "@microsoft/signalr";
import { commonService } from "@/libs/api/services";
import { API_CONFIG } from "@/libs/api/endpoints/config";
import { STORAGE_KEYS } from "@/constants";
import { useAuth } from "@/libs/stores/auth.store";

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

  const [messages, setMessages] = useState<Message[]>([]);
  // Track whether to auto-scroll: only true when a *new* message arrives, not on initial load
  const shouldScrollRef = useRef(false);

  const connectionRef = useRef<HubConnection | null>(null);
  const otherUserIdRef = useRef<string | null>(null);
  const myUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    myUserIdRef.current = myUserId ?? null;
  }, [myUserId]);

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

  const hubBaseUrl = useMemo(() => {
    return API_CONFIG.BASE_URL.replace(/\/api\/v1\/?$/, "");
  }, []);

  useEffect(() => {
    otherUserIdRef.current = receiver.id;
    setMessages([]); // reset view when switching conversations
  }, [receiver.id]);

  const ensureConnectionStarted = async () => {
    if (connectionRef.current) return connectionRef.current;

    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? "";
    const hubUrl = `${hubBaseUrl}/hubs/chat`;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => accessToken,
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .configureLogging({
        log: (logLevel, message) => {
          if (logLevel === LogLevel.Error && message.includes("stopped during negotiation")) return;

          if (logLevel >= LogLevel.Information) {
            if (logLevel === LogLevel.Error || logLevel === LogLevel.Critical) {
              console.error(message);
            } else if (logLevel === LogLevel.Warning) {
              console.warn(message);
            } else {
              console.log(message);
            }
          }
        }
      })
      .build();

    connection.on("NewMessage", (incoming: any) => {
      const myIdNow = myUserIdRef.current;
      const otherIdNow = otherUserIdRef.current;
      if (!myIdNow || !otherIdNow) return;

      const isBetweenCurrentUsers =
        (incoming.senderId === myIdNow && incoming.receiverId === otherIdNow) ||
        (incoming.senderId === otherIdNow && incoming.receiverId === myIdNow);

      if (!isBetweenCurrentUsers) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;

        const next: Message = {
          id: incoming.id,
          senderId: incoming.senderId,
          receiverId: incoming.receiverId,
          content: incoming.content,
          read: incoming.read,
          createdAt: incoming.createdAt,
        };

        shouldScrollRef.current = true;
        return [...prev, next].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    });

    connectionRef.current = connection;
    await connection.start();
    return connection;
  };

  useEffect(() => {
    const loadMessages = async () => {
      if (!receiver.id) return;

      try {
        await commonService.markConversationAsRead(receiver.id);

        const res = await commonService.getMessages({
          userId: receiver.id,
          page: 1,
          limit: 100,
        });

        const payload = res.data;
        const apiMessages = payload?.data ?? [];

        // Sort ascending so oldest messages sit at top, newest at bottom
        const sorted = apiMessages
          .map((m: any) => ({
            id: m.id,
            senderId: m.senderId,
            receiverId: m.receiverId,
            content: m.content,
            read: m.read,
            createdAt: m.createdAt,
          }))
          .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        // On initial load, scroll to bottom once without setting shouldScroll so user can scroll up freely after
        shouldScrollRef.current = true;
        setMessages(sorted);
      } catch (e) {
        console.error("Failed to load messages:", e);
        setMessages([]);
      }
    };

    loadMessages();
  }, [receiver.id]);

  useEffect(() => {
    ensureConnectionStarted().catch((e) => {
      if (e.name === "AbortError" || e.message?.includes("stopped during negotiation")) {
        return;
      }
      console.error("SignalR connect failed:", e);
    });

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => { });
        connectionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubBaseUrl]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldScrollRef.current = false;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    const content = messageInput.trim();
    if (!content || !receiver.id) return;

    const tempTempContent = content;
    setMessageInput("");

    try {
      const res = await commonService.sendMessage(receiver.id, tempTempContent);

      if (res.data) {
        setMessages((prev) => {
          if (prev.some(m => m.id === res.data.id)) return prev;
          shouldScrollRef.current = true;
          return [...prev, res.data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
      }
    } catch (e) {
      console.error("Failed to send message:", e);
      setMessageInput(tempTempContent);
    }
  };

  if (!receiver.id) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white">
      {/* Chat Header - sticky so it stays visible while scrolling messages */}
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

      {/* Messages — native scroll with visible scrollbar */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" }}
      >
        {messages.map((message, index) => {
          const isMine = !!myUserId && message.senderId.toLowerCase() === myUserId.toLowerCase();
          const prevMessage = messages[index - 1];
          const showDateBar = !prevMessage || getDayKey(prevMessage.createdAt) !== getDayKey(message.createdAt);
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
              <div
                className={cn(
                  "flex",
                  isMine ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-4 py-2",
                    isMine
                      ? "bg-agro-green text-white"
                      : "bg-gray-100 text-foreground"
                  )}
                >
                  <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                  <span
                    className={cn(
                      "text-xs mt-1 block",
                      isMine
                        ? "text-white/70"
                        : "text-muted-foreground"
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
            onKeyPress={(e) => {
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
