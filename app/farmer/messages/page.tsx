"use client";

import { useRouter } from "next/navigation";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { Link, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FarmerMessagesPage() {
  const router = useRouter();

  return (
    <div className="h-[calc(100vh-6rem)] p-4 lg:p-6 flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl border bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 p-5 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/20">
        <div className="pointer-events-none absolute -top-12 right-6 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-700/20" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nhắn tin</h1>
            <p className="text-muted-foreground">Trao đổi trực tiếp với lao động để quản lý công việc và yêu cầu hiệu quả</p>
          </div>
        </div>
      </div>  

      <div className="flex-1 min-h-0 flex gap-4">
        {/* Sidebar Card */}
        <div className="w-80 shrink-0 bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <ChatSidebar
            onConversationSelect={(conv) => {
              const query = new URLSearchParams();
              if (conv.userName) query.set("name", conv.userName);
              if (conv.userAvatar) query.set("avatarUrl", conv.userAvatar);
              router.push(`/farmer/messages/${conv.id}?${query.toString()}`);
            }}
          />
        </div>

        {/* Empty state card */}
        <div className="hidden sm:flex flex-1 bg-white border rounded-2xl shadow-sm items-center justify-center text-center p-8">
          <div>
            <div className="w-16 h-16 rounded-full bg-agro-cream flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-agro-green" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Chọn một cuộc trò chuyện</h3>
            <p className="text-muted-foreground text-sm">
              Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
