export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface MessageUser {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: MessageUser
  receiver: MessageUser
}

export interface LastConversationsDTO {
  contact: MessageUser;
  lastMessage: Message;
  unreadCount: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export type Status = "pending" | "active" | "completed" | "cancelled";

export interface SelectOption {
  label: string;
  value: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}
