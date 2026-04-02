export interface NotificationDTO {
    id: string;
    userId: string;
    relatedEntityId: string;
    type: number;
    typeName: string;
    title: string;
    message: string;
    isRead: boolean;
    sentAt: string;
    readAt: string;
}