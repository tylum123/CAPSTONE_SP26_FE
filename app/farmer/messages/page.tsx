"use client";

import { useRouter } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function FarmerMessagesPage() {
  const router = useRouter();

  return (
    <div className="h-[calc(100vh-6rem)] p-4 lg:p-6 flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="shrink-0 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tin nhắn</h1>
        <p className="text-sm text-muted-foreground">
          Trao đổi trực tiếp với lao động để quản lý công việc và yêu cầu hiệu quả
        </p>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm overflow-hidden">
        <ChatInterface
          conversations={[]}
          onConversationSelect={(id) => router.push(`/farmer/messages/${id}`)}
        />
      </div>
    </div>
  );
}
