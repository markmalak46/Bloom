import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly httpClient = inject(HttpClient);
  private readonly router = inject(Router);

  getProfileData(): Observable<any> {
    return this.httpClient.get(`${environment.baseUrl}/users/profile-data`);
  }

  getUserProfile(userId: string): Observable<any> {
    return this.httpClient.get(`${environment.baseUrl}/users/${userId}/profile`);
  }

  uploadPhoto(formData: FormData): Observable<any> {
    return this.httpClient.put(`${environment.baseUrl}/users/upload-photo`, formData);
  }

  getFollowSuggestions(limit: number = 10): Observable<any> {
    return this.httpClient.get(`${environment.baseUrl}/users/suggestions?limit=${limit}`);
  }

  followUser(userId: string): Observable<any> {
    return this.httpClient.put(`${environment.baseUrl}/users/${userId}/follow`, {});
  }
}
