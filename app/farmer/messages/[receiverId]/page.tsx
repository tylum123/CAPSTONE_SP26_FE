"use client";

import { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function FarmerMessageConversationPage() {
  const router = useRouter();
  const params = useParams<{ receiverId: string }>();
  const searchParams = useSearchParams();
  const receiverId = params?.receiverId || "";

  const nameParam = searchParams?.get("name");
  const avatarParam = searchParams?.get("avatarUrl");

  // Ideally, fetch the user's details by receiverId here.
  // Using a fallback for now.
  const displayId = receiverId.length > 8 ? receiverId.substring(0, 8).toUpperCase() : receiverId;
  const userName = nameParam || `Người dùng ${displayId}`;
  const userAvatar = avatarParam || "/placeholder.svg";

  const conversations = useMemo(
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

      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm overflow-hidden">
        <ChatInterface
          conversations={conversations}
          currentConversationId={receiverId}
          onConversationSelect={(id) => router.push(`/farmer/messages/${id}`)}
        />
      </div>
    </div>
  );
}
