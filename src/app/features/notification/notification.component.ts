import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationsService } from '../../core/services/notifications.service';
import { Notification } from '../../core/models/notification.interface';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css',
  providers: [DatePipe]
})
export class NotificationComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService);
  
  notifications: Notification[] = [];
  loading: boolean = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationsService.getNotifications().subscribe({
      next: (res) => {
        console.log('Notifications Response:', res);
        if (res.success) {
          this.notifications = res.data.notifications;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
        this.error = 'Failed to load notifications. Please try again later.';
        this.loading = false;
      }
    });
  }

  markAsRead(notif: Notification): void {
    if (notif.isRead) return;
    this.notificationsService.markAsRead(notif._id).subscribe({
      next: (res) => {
        if (res.message === 'success' || res.success) {
          notif.isRead = true;
        }
      }
    });
  }

  markAllAsRead(): void {
    const hasUnread = this.notifications.some(n => !n.isRead);
    if (!hasUnread) return;
    
    this.notificationsService.markAllAsRead().subscribe({
      next: (res) => {
        if (res.message === 'success' || res.success) {
          this.notifications.forEach(n => n.isRead = true);
        }
      }
    });
  }

  getNotificationMessage(notif: Notification): string {
    switch (notif.type) {
      case 'like_post':
        return 'liked your post';
      case 'comment_post':
        return 'commented on your post';
      case 'follow_user':
        return 'started following you';
      case 'share_post':
        return 'shared your post';
      default:
        return 'interacted with you';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'like_post':
        return 'fa-heart text-pink-500';
      case 'comment_post':
        return 'fa-comment text-indigo-500';
      case 'follow_user':
        return 'fa-user-plus text-emerald-500';
      case 'share_post':
        return 'fa-share-nodes text-blue-500';
      default:
        return 'fa-bell text-slate-400';
    }
  }
}
