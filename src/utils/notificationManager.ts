export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
}

class NotificationManager {
  private notifications: Notification[] = [];
  private listeners: Set<(notifications: Notification[]) => void> = new Set();

  add(message: string, type: NotificationType = 'info'): void {
    const notification: Notification = {
      id: `notification-${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: Date.now(),
    };

    this.notifications.push(notification);
    this.notifyListeners();

    setTimeout(() => {
      this.remove(notification.id);
    }, 3000);
  }

  remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getNotifications()));
  }

  clear(): void {
    this.notifications = [];
    this.notifyListeners();
  }
}

export const notificationManager = new NotificationManager();
