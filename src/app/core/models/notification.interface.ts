export interface Notification {
  _id: string;
  recipient: NotificationUser;
  actor: NotificationUser;
  type: 'like_post' | 'comment_post' | 'follow_user' | string;
  entityType: string;
  entityId: string;
  isRead: boolean;
  createdAt: string;
  entity: any;
}

export interface NotificationUser {
  _id: string;
  name: string;
  photo: string;
}
