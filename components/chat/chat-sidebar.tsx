"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/libs/utils/utils";
import { commonService } from "@/libs/api/services";
import { useAuth } from "@/libs/stores/auth.store";
import { useSignalR, type IncomingMessage } from "@/contexts/signalr-context";

export interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online?: boolean;
}

interface ChatSidebarProps {
  initialConversations?: Conversation[];
  currentConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
}

export function ChatSidebar({
  initialConversations = [],
  currentConversationId,
  onConversationSelect,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);

  const { user } = useAuth();
  const myUserId = user?.userId;
  const { onMessage } = useSignalR();

  const formatTime = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  /* ─── Initial fetch ────────────────────────────────────────── */
  useEffect(() => {
    const fetchLastConversations = async () => {
      try {
        const res = await commonService.getLastConversations();
        if (res.data) {
          const apiConvs: Conversation[] = res.data.map((dto) => ({
            id: dto.contact.id,
            userId: dto.contact.id,
            userName:
              dto.contact.name ||
              `Người dùng ${dto.contact.id.substring(0, 8)}`,
            userAvatar: dto.contact.avatarUrl || "/placeholder.svg",
            lastMessage: dto.lastMessage?.content || "Không có tin nhắn",
            lastMessageTime: dto.lastMessage?.createdAt
              ? formatTime(dto.lastMessage.createdAt)
              : "",
            unreadCount: dto.unreadCount || 0,
            online: false,
          }));

          setConversations((prev) => {
            const apiMap = new Map(apiConvs.map((c) => [c.id, c]));
            const uniquePrev = prev.filter((c) => !apiMap.has(c.id));
            return [...apiMap.values(), ...uniquePrev];
          });
        }
      } catch (err) {
        console.error("Failed to load last conversations:", err);
      }
    };
    fetchLastConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Realtime: update sidebar preview on new message ──────── */
  const handleIncomingMessage = useCallback(
    (msg: IncomingMessage) => {
      if (!myUserId) return;

      // The "other" participant is whoever isn't us
      const otherUserId =
        msg.senderId.toLowerCase() === myUserId.toLowerCase()
          ? msg.receiverId
          : msg.senderId;

      // Is this message for the currently-open conversation?
      const isActiveConversation =
        currentConversationId?.toLowerCase() === otherUserId.toLowerCase();

      setConversations((prev) => {
        const existing = prev.find(
          (c) => c.id.toLowerCase() === otherUserId.toLowerCase()
        );

        const updated: Conversation = existing
          ? {
              ...existing,
              lastMessage: msg.content,
              lastMessageTime: formatTime(msg.createdAt),
              // Only bump unread count if conversation is not currently open
              unreadCount: isActiveConversation
                ? 0
                : existing.unreadCount + (msg.senderId !== myUserId ? 1 : 0),
            }
          : {
              id: otherUserId,
              userId: otherUserId,
              userName: `Người dùng ${otherUserId.substring(0, 8).toUpperCase()}`,
              userAvatar: "/placeholder.svg",
              lastMessage: msg.content,
              lastMessageTime: formatTime(msg.createdAt),
              unreadCount: isActiveConversation ? 0 : 1,
              online: false,
            };

        // Bring the updated conversation to the top, remove old entry
        const rest = prev.filter(
          (c) => c.id.toLowerCase() !== otherUserId.toLowerCase()
        );
        return [updated, ...rest];
      });
    },
    [myUserId, currentConversationId]
  );

  useEffect(() => {
    const unsubscribe = onMessage(handleIncomingMessage);
    return unsubscribe;
  }, [onMessage, handleIncomingMessage]);

  /* ─── Reset unread when opening a conversation ──────────────── */
  useEffect(() => {
    if (!currentConversationId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id.toLowerCase() === currentConversationId.toLowerCase()
          ? { ...c, unreadCount: 0 }
          : c
      )
    );
  }, [currentConversationId]);

  const filteredConversations = conversations.filter((conv) =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
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
              onClick={() => onConversationSelect(conversation)}
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
  );
}
