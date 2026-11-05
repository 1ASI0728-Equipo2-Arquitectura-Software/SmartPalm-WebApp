export interface Notification {
  id: number;
  userId: number;
  type: 'alert_critical' | 'alert_warning' | 'alert_informative' | 'device_offline' | 'recommendation_published' | 'report_published';
  title: string;
  body: string;
  relatedResourceType: 'alert' | 'device' | 'recommendation' | 'report';
  relatedResourceId: number;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationListResponse {
  totalElements: number;
  unreadCount: number;
  notifications: Notification[];
}

export interface NotificationCount {
  unreadCount: number;
}
