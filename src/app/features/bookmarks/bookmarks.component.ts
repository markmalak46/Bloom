import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PostsService } from '../../core/services/posts.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { Post } from '../../core/models/post.interface';
import { SideLeftComponent } from '../feed/components/side-left/side-left.component';
import { SideRightComponent } from '../feed/components/side-right/side-right.component';
import { CommentPostComponent } from '../feed/components/feed-content/comment-post/comment-post.component';

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SideLeftComponent,
    SideRightComponent,
    CommentPostComponent,
  ],
  templateUrl: './bookmarks.component.html',
  styleUrl: './bookmarks.component.css',
  providers: [DatePipe],
})
export class BookmarksComponent implements OnInit {
  private postsService = inject(PostsService);
  private authService = inject(AuthService);

  userId: string = '';
  postList: Post[] = [];
  loading: boolean = true;

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) {
      this.userId = JSON.parse(stored)._id || '';
    }
    this.getBookmarks();
  }

  getBookmarks(): void {
    this.loading = true;
    this.postsService.getBookmarks().subscribe({
      next: (res: any) => {
        if (res.success && res.data && res.data.bookmarks) {
          this.postList = res.data.bookmarks.map((p: any) => ({
            ...p,
            isLiked:
              p.likes && p.likes.some((l: any) => l === this.userId || l._id === this.userId),
          }));
        } else {
          this.postList = [];
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to load bookmarks', err);
        this.loading = false;
      },
    });
  }

  toggleLike(post: Post): void {
    const prevIsLiked = post.isLiked || false;
    const prevLikesCount = post.likesCount || 0;

    post.isLiked = !post.isLiked;
    post.likesCount = post.isLiked ? prevLikesCount + 1 : Math.max(0, prevLikesCount - 1);

    this.postsService.likePost(post._id).subscribe({
      next: (res: any) => {
        if (res.success) {
          post.likesCount = res.data.likesCount;
          post.isLiked = res.data.liked;
        }
      },
      error: (err: any) => {
        post.isLiked = prevIsLiked;
        post.likesCount = prevLikesCount;
        console.error('Failed to toggle like', err);
      },
    });
  }

  toggleBookmark(post: Post): void {
    this.postsService.bookmarkPost(post._id).subscribe({
      next: (res: any) => {
        if (res.success) {
          post.bookmarked = res.data.bookmarked;
          if (!post.bookmarked) {
            this.postList = this.postList.filter((p) => p._id !== post._id);
          }
        }
      },
      error: (err: any) => {
        console.error('Failed to toggle bookmark', err);
      },
    });
  }

  isSharing: boolean = false;
  sharePostId: string | null = null;
  shareContent: FormControl = new FormControl('');

  openShareModal(post: Post): void {
    this.isSharing = true;
    this.sharePostId = post._id;
    this.shareContent.setValue('');
  }

  submitShareForm(event: Event): void {
    event.preventDefault();
    if (!this.sharePostId) return;

    this.postsService.sharePost(this.sharePostId, this.shareContent.value).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getBookmarks();
          this.cancelShare();
        }
      },
      error: (err: any) => {
        console.error('Failed to share post', err);
      },
    });
  }

  cancelShare(): void {
    this.isSharing = false;
    this.sharePostId = null;
    this.shareContent.setValue('');
  }

  isViewingLikes: boolean = false;
  likesList: any[] = [];
  likesLoading: boolean = false;

  openLikesModal(postId: string): void {
    this.isViewingLikes = true;
    this.likesLoading = true;
    this.postsService.getPostLikes(postId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.likesList = res.data.likes;
        }
        this.likesLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load likes', err);
        this.likesLoading = false;
      },
    });
  }

  closeLikesModal(): void {
    this.isViewingLikes = false;
    this.likesList = [];
  }
}
