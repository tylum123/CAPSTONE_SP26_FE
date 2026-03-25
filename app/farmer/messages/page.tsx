"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import { useRouter } from "next/navigation";

export default function FarmerMessagesPage() {
  const router = useRouter();

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tin nhắn</h1>
        <p className="text-muted-foreground">
          Trao đổi với các lao động về công việc và yêu cầu
        </p>
      </div>

      <ChatInterface
        conversations={[]}
        currentConversationId={undefined}
        onConversationSelect={(receiverId) => router.push(`/farmer/messages/${receiverId}`)}
      />
    </div>
  );
}
