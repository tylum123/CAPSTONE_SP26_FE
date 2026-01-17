"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";

// Mock data - replace with real API calls
const mockConversations = [
  {
    id: "1",
    userId: "worker1",
    userName: "Nguyễn Văn Bình",
    userAvatar: "/placeholder.svg",
    lastMessage: "Cảm ơn bạn, tôi sẽ đến đúng giờ!",
    lastMessageTime: "10:35 AM",
    unreadCount: 0,
    online: true,
  },
  {
    id: "2",
    userId: "worker2",
    userName: "Trần Thị Cúc",
    userAvatar: "/placeholder.svg",
    lastMessage: "Công việc này có cần kinh nghiệm không ạ?",
    lastMessageTime: "9:20 AM",
    unreadCount: 2,
    online: false,
  },
  {
    id: "3",
    userId: "worker3",
    userName: "Lê Minh Đức",
    userAvatar: "/placeholder.svg",
    lastMessage: "Tôi đã nộp đơn xin việc rồi",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    online: true,
  },
  {
    id: "4",
    userId: "worker4",
    userName: "Phạm Thị Hoa",
    userAvatar: "/placeholder.svg",
    lastMessage: "Chào anh, tôi muốn hỏi về mức lương",
    lastMessageTime: "2 days ago",
    unreadCount: 1,
    online: false,
  },
];

export default function FarmerMessagesPage() {
  const [currentConversationId, setCurrentConversationId] = useState<string>();

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tin nhắn</h1>
        <p className="text-muted-foreground">
          Trao đổi với các lao động về công việc và yêu cầu
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
