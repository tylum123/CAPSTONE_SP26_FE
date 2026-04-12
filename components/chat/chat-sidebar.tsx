"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/libs/utils/utils";
import { commonService } from "@/libs/api/services";

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

export function ChatSidebar({ initialConversations = [], currentConversationId, onConversationSelect }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);

  useEffect(() => {
    const fetchLastConversations = async () => {
      try {
        const res = await commonService.getLastConversations();
        if (res.data) {
          const formatCreatedAt = (value: string) => {
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return value;
            return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          };

          const apiConvs: Conversation[] = res.data.map((dto) => ({
            id: dto.contact.id,
            userId: dto.contact.id,
            userName: dto.contact.name || `Người dùng ${dto.contact.id.substring(0, 8)}`,
            userAvatar: dto.contact.avatarUrl || "/placeholder.svg",
            lastMessage: dto.lastMessage?.content || "Không có tin nhắn",
            lastMessageTime: dto.lastMessage?.createdAt ? formatCreatedAt(dto.lastMessage.createdAt) : "",
            unreadCount: dto.unreadCount || 0,
            online: false,
          }));

          setConversations((prev) => {
            const apiConvsMap = new Map(apiConvs.map((c) => [c.id, c]));
            const uniquePrev = prev.filter((c) => !apiConvsMap.has(c.id));
            return [...apiConvsMap.values(), ...uniquePrev]; // overwrite stub with API actual
          });
        }
      } catch (err) {
        console.error("Failed to load last conversations:", err);
      }
    };
    fetchLastConversations();
  }, []);

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
