import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private readonly httpClient = inject(HttpClient);

  getNotifications(unread: boolean = false, page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('unread', unread.toString())
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.httpClient.get(`${environment.baseUrl}/notifications`, { params });
  }
  markAsRead(notificationId: string): Observable<any> {
    return this.httpClient.put(`${environment.baseUrl}/notifications/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.httpClient.post(`${environment.baseUrl}/notifications/read-all`, {});
  }
}
