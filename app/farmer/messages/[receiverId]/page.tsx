"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function FarmerMessageConversationPage({
  params,
}: {
  params: { receiverId: string };
}) {
  const router = useRouter();
  const receiverId = params.receiverId;

  const conversations = useMemo(
    () => [
      {
        id: receiverId,
        userId: receiverId,
        userName: receiverId,
        userAvatar: "/placeholder.svg",
        lastMessage: "",
        lastMessageTime: "",
        unreadCount: 0,
        online: false,
      },
    ],
    [receiverId]
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tin nhắn</h1>
        <p className="text-muted-foreground">Trao đổi trực tiếp với người dùng</p>
      </div>

      <ChatInterface
        conversations={conversations}
        currentConversationId={receiverId}
        onConversationSelect={(id) => router.push(`/farmer/messages/${id}`)}
      />
    </div>
  );
}

