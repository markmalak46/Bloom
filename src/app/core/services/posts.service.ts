import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  private readonly httpClient = inject(HttpClient);

  getAllPosts():Observable<any>{
    return this.httpClient.get(`${environment.baseUrl}/posts`)
  }

  getFollowingFeed(page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('only', 'all')
      .set('limit', limit)
      .set('page', page);

    return this.httpClient.get(`${environment.baseUrl}/posts/feed`, { params });
  }

  createPost(data: object):Observable<any>{
    return this.httpClient.post(`${environment.baseUrl}/posts`, data)
  }

  getSinglePost(postId: string):Observable<any>{
    return this.httpClient.get(`${environment.baseUrl}/posts/${postId}`)
  }

  deletePost(postId: string):Observable<any>{
    return this.httpClient.delete(`${environment.baseUrl}/posts/${postId}`)
  }

  getUserPosts(userId: string): Observable<any>{
    return this.httpClient.get(`${environment.baseUrl}/users/${userId}/posts`)
  }

  likePost(postId: string): Observable<any>{
    return this.httpClient.put(`${environment.baseUrl}/posts/${postId}/like`, {})
  }

  updatePost(postId: string, formData: FormData): Observable<any>{
    return this.httpClient.put(`${environment.baseUrl}/posts/${postId}`, formData)
  }

  sharePost(postId: string, body: string): Observable<any>{
    return this.httpClient.post(`${environment.baseUrl}/posts/${postId}/share`, { body })
  }

  bookmarkPost(postId: string): Observable<any>{
    return this.httpClient.put(`${environment.baseUrl}/posts/${postId}/bookmark`, {})
  }

  getBookmarks(): Observable<any>{
    return this.httpClient.get(`${environment.baseUrl}/users/bookmarks`);
  }

  getPostLikes(postId: string): Observable<any> {
    return this.httpClient.get(`${environment.baseUrl}/posts/${postId}/likes`);
  }
}
