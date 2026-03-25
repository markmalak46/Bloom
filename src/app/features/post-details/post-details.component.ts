import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PostsService } from '../../core/services/posts.service';
import { Post } from '../../core/models/post.interface';
import { CommentPostComponent } from '../feed/components/feed-content/comment-post/comment-post.component';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-post-details',
  standalone: true,
  imports: [CommonModule, RouterModule, CommentPostComponent, ReactiveFormsModule],
  templateUrl: './post-details.component.html',
  styleUrl: './post-details.component.css',
  providers: [DatePipe]
})
export class PostDetailsComponent implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly postsService = inject(PostsService);
  private readonly authService = inject(AuthService);

  postDetails: Post | null = null;
  postId: string = '';
  userId: string = '';
  loading: boolean = true;

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) {
      this.userId = JSON.parse(stored)._id || '';
    }

    this.activatedRoute.params.subscribe((param)=>{
      this.postId = param['id']!;
      this.getPostDetails();
    })
  }

  getPostDetails():void{
    this.loading = true;
    this.postsService.getSinglePost(this.postId).subscribe({
        next: (res) => {
          if (res.success) {
            const p = res.data.post;
            p.isLiked = p.likes && p.likes.some((l: any) => l === this.userId || l._id === this.userId);
            this.postDetails = p;
          }
          this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load post details', err);
        this.loading = false;
      }
    })
  }

  toggleLike(post: Post): void {
    const prevIsLiked = post.isLiked || false;
    const prevLikesCount = post.likesCount || 0;

    post.isLiked = !post.isLiked;
    post.likesCount = post.isLiked ? prevLikesCount + 1 : Math.max(0, prevLikesCount - 1);

    this.postsService.likePost(post._id).subscribe({
      next: (res) => {
        if (res.success) {
          post.likesCount = res.data.likesCount;
          post.isLiked = res.data.liked;
        }
      },
      error: (err) => {
        post.isLiked = prevIsLiked;
        post.likesCount = prevLikesCount;
        console.error('Failed to toggle like', err);
      }
    });
  }

  toggleBookmark(post: Post): void {
    this.postsService.bookmarkPost(post._id).subscribe({
      next: (res: any) => {
        if (res.success) {
          post.bookmarked = res.data.bookmarked;
          if (res.data.bookmarksCount !== undefined) {
             post.bookmarksCount = res.data.bookmarksCount;
          }
        }
      },
      error: (err: any) => {
        console.error('Failed to toggle bookmark', err);
      }
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
          this.getPostDetails();
          this.cancelShare();
        }
      },
      error: (err: any) => {
        console.error('Failed to share post', err);
      }
    });
  }

  cancelShare(): void {
    this.isSharing = false;
    this.sharePostId = null;
    this.shareContent.setValue('');
  }

  scrollToComments(): void {
    const commentsSection = document.getElementById('comments-section');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' });
    }
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
      }
    });
  }

  closeLikesModal(): void {
    this.isViewingLikes = false;
    this.likesList = [];
  }
}
