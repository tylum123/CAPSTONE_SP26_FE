"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";

// Mock data - replace with real API calls
const mockConversations = [
  {
    id: "1",
    userId: "farmer1",
    userName: "Nông trại Xanh",
    userAvatar: "/placeholder.svg",
    lastMessage: "Bạn đã được chấp nhận cho công việc này!",
    lastMessageTime: "11:20 AM",
    unreadCount: 1,
    online: true,
  },
  {
    id: "2",
    userId: "farmer2",
    userName: "Vườn Mỹ Khánh",
    userAvatar: "/placeholder.svg",
    lastMessage: "Chúng tôi sẽ liên hệ lại sau",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    online: false,
  },
  {
    id: "3",
    userId: "farmer3",
    userName: "Trại cây ăn trái Phú Lộc",
    userAvatar: "/placeholder.svg",
    lastMessage: "Bạn có thể bắt đầu làm việc vào thứ Hai không?",
    lastMessageTime: "2 days ago",
    unreadCount: 2,
    online: true,
  },
];

export default function WorkerMessagesPage() {
  const [currentConversationId, setCurrentConversationId] = useState<string>();

  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tin nhắn</h1>
        <p className="text-muted-foreground">
          Trao đổi với nông dân về công việc và thông tin
        </p>
      </div>

      <ChatInterface
        conversations={mockConversations}
        currentConversationId={currentConversationId}
        onConversationSelect={setCurrentConversationId}
      />
    </div>
  );
}
