"use client";

import { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ChatSidebar } from "@/components/chat/chat-sidebar";

export default function FarmerMessageConversationPage() {
  const router = useRouter();
  const params = useParams<{ receiverId: string }>();
  const searchParams = useSearchParams();
  const receiverId = params?.receiverId || "";

  const nameParam = searchParams?.get("name");
  const avatarParam = searchParams?.get("avatarUrl");

  const displayId = receiverId.length > 8 ? receiverId.substring(0, 8).toUpperCase() : receiverId;
  const userName = nameParam || `Người dùng ${displayId}`;
  const userAvatar = avatarParam || "/placeholder.svg";

  const initialConversations = useMemo(
    () => [
      {
        id: receiverId,
        userId: receiverId,
        userName,
        userAvatar,
        lastMessage: "Bấm vào để xem tin nhắn",
        lastMessageTime: "vừa xong",
        unreadCount: 0,
        online: true,
      },
    ],
    [receiverId, userName, userAvatar]
  );

  return (
    <div className="h-[calc(100vh-6rem)] p-4 lg:p-6 flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="shrink-0 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tin nhắn</h1>
        <p className="text-sm text-muted-foreground">Trao đổi trực tiếp với người dùng và quản lý cập nhật công việc</p>
      </div>

      <div className="flex-1 min-h-0 flex gap-4">
        {/* Sidebar Card */}
        <div className="hidden sm:flex w-80 shrink-0 bg-white border rounded-2xl shadow-sm overflow-hidden flex-col">
          <ChatSidebar
            initialConversations={initialConversations}
            currentConversationId={receiverId}
            onConversationSelect={(conv) => {
              const query = new URLSearchParams();
              if (conv.userName) query.set("name", conv.userName);
              if (conv.userAvatar) query.set("avatarUrl", conv.userAvatar);
              router.push(`/farmer/messages/${conv.id}?${query.toString()}`);
            }}
          />
        </div>

        {/* Chat Card */}
        <div className="flex-1 bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <ChatInterface
            receiver={{ id: receiverId, name: userName, avatarUrl: userAvatar }}
          />
        </div>
      </div>
    </div>
  );
}
