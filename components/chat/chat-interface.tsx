"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Send, MoreVertical, Phone, Video, Paperclip } from "lucide-react";
import { cn } from "@/libs/utils";
import { HubConnection, HubConnectionBuilder, HttpTransportType, LogLevel } from "@microsoft/signalr";
import { commonService } from "@/libs/api/services";
import { API_CONFIG } from "@/libs/api/config";
import { STORAGE_KEYS } from "@/constants";
import { useAuth } from "@/stores/auth.store";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online?: boolean;
}

interface ChatInterfaceProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
}

export function ChatInterface({
  conversations,
  currentConversationId,
  onConversationSelect,
}: ChatInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");

  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  const { user } = useAuth();
  const myUserId = user?.id;

  const [messages, setMessages] = useState<Message[]>([]);

  const connectionRef = useRef<HubConnection | null>(null);
  const otherUserIdRef = useRef<string | null>(null);
  const myUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    myUserIdRef.current = myUserId ?? null;
  }, [myUserId]);

  const hubBaseUrl = useMemo(() => {
    // API_CONFIG.BASE_URL is like: http://localhost:5057/api/v1
    // Hub endpoint is: http://localhost:5057/hubs/chat
    return API_CONFIG.BASE_URL.replace(/\/api\/v1\/?$/, "");
  }, []);

  useEffect(() => {
    otherUserIdRef.current = currentConversation?.userId ?? null;
    setMessages([]); // reset view when switching conversations
  }, [currentConversationId, currentConversation?.userId]);

  const filteredConversations = conversations.filter((conv) =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCreatedAt = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
      .configureLogging(LogLevel.Information)
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

        return [...prev, next];
      });
    });

    connectionRef.current = connection;
    await connection.start();
    return connection;
  };

  useEffect(() => {
    const loadMessages = async () => {
      if (!currentConversation?.userId) return;

      try {
        // Mark unread messages from the other user as read when opening the conversation.
        await commonService.markConversationAsRead(currentConversation.userId);

        const res = await commonService.getMessages({
          userId: currentConversation.userId,
          page: 1,
          limit: 100,
        });

        const payload = res.data; // ApiResponse.data => PaginatedResponse<Message>
        const apiMessages = payload?.data ?? [];

        setMessages(
          apiMessages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            receiverId: m.receiverId,
            content: m.content,
            read: m.read,
            createdAt: m.createdAt,
          }))
        );
      } catch (e) {
        console.error("Failed to load messages:", e);
        setMessages([]);
      }
    };

    loadMessages();
  }, [currentConversation?.userId]);

  // Start SignalR connection so the UI can receive NewMessage events.
  useEffect(() => {
    ensureConnectionStarted().catch((e) => console.error("SignalR connect failed:", e));

    return () => {
      connectionRef.current?.stop().catch(() => {});
      connectionRef.current = null;
    };
    // hubBaseUrl is stable (memoized). ensureConnectionStarted uses connectionRef + localStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubBaseUrl]);

  const handleSendMessage = async () => {
    const content = messageInput.trim();
    if (!content) return;
    if (!currentConversation?.userId) return;

    const receiverId = currentConversation.userId;

    try {
      const connection = await ensureConnectionStarted();
      await connection.invoke("SendMessage", receiverId, content);
    } catch (e) {
      // Fallback to REST if SignalR fails (still creates the message on server).
      await commonService.sendMessage(receiverId, content);
    } finally {
      setMessageInput("");
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r flex flex-col">
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm tin nhắn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onConversationSelect(conversation.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg hover:bg-agro-cream transition-colors",
                  currentConversationId === conversation.id && "bg-agro-cream"
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.userAvatar} />
                    <AvatarFallback className="bg-agro-green text-white">
                      {conversation.userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm truncate">
                      {conversation.userName}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {conversation.lastMessageTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate flex-1">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge
                        variant="default"
                        className="bg-agro-orange hover:bg-agro-orange ml-2 h-5 min-w-5 px-1.5 text-xs"
                      >
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {currentConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentConversation.userAvatar} />
                <AvatarFallback className="bg-agro-green text-white">
                  {currentConversation.userName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{currentConversation.userName}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentConversation.online ? "Đang hoạt động" : "Không hoạt động"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => {
                const isMine = !!myUserId && message.senderId === myUserId;
                return (
                <div
                  key={message.id}
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
                    <p className="text-sm">{message.content}</p>
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
                );
              })}
            </div>
          </ScrollArea>

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
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <div className="w-16 h-16 rounded-full bg-agro-cream flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-agro-green" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Chọn một cuộc trò chuyện</h3>
            <p className="text-muted-foreground">
              Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
