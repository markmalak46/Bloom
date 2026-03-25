import { Component, HostListener, inject, OnInit } from '@angular/core';
import { PostsService } from '../../../../core/services/posts.service';
import { Post } from '../../../../core/models/post.interface';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CommentPostComponent } from './comment-post/comment-post.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-feed-content',
  imports: [CommonModule, ReactiveFormsModule, CommentPostComponent, RouterLink],
  templateUrl: './feed-content.component.html',
  styleUrl: './feed-content.component.css',
})
export class FeedContentComponent implements OnInit {
  private readonly postsService = inject(PostsService);

  postList: Post[] = [];

  userId: string = '';
  userName: string = '';
  userPhoto: string = '';
  content: FormControl = new FormControl('');
  privacy: FormControl = new FormControl('public');

  saveFile: File | null | undefined = undefined;
  imgUrl: string | ArrayBuffer | null | undefined = '';

  currentPage: number = 1;
  limit: number = 10;
  hasMore: boolean = true;
  isLoadingFeed: boolean = false;

  isUpdateMode: boolean = false;
  updatePostId: string | null = null;

  isSharing: boolean = false;
  sharePostId: string | null = null;
  shareContent: FormControl = new FormControl('');

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      this.userId = user._id || '';
      this.userName = user.name || 'User';
      this.userPhoto = user.photo || '/assets/imgs/default-profile.png';
    }

    this.loadFeedPosts();
  }

  loadFeedPosts(reset: boolean = false): void {
    if (this.isLoadingFeed || (!this.hasMore && !reset)) return;

    if (reset) {
      this.currentPage = 1;
      this.hasMore = true;
      this.postList = [];
    }

    this.isLoadingFeed = true;

    this.postsService.getFollowingFeed(this.currentPage, this.limit).subscribe({
      next: (res) => {
        let newPosts = res?.data?.posts || [];
        const pagination = res?.meta?.pagination;
        newPosts = newPosts.map((p: any) => ({
          ...p,
          isLiked: p.likes && p.likes.some((l: any) => l === this.userId || l._id === this.userId)
        }));

        this.postList = [...this.postList, ...newPosts];

        if (pagination) {
          this.hasMore = this.currentPage < pagination.numberOfPages;
        } else {
          this.hasMore = newPosts.length === this.limit;
        }

        if (this.hasMore) {
          this.currentPage++;
        }

        this.isLoadingFeed = false;
      },
      error: (err) => {
        console.log(err);
        this.isLoadingFeed = false;
      }
    });
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 300;

    if (scrollPosition >= threshold) {
      this.loadFeedPosts();
    }
  }

  changeImg(info: Event): void {
    const input = info.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.saveFile = input.files[0];

      const fileReader = new FileReader();
      fileReader.readAsDataURL(this.saveFile);
      fileReader.onload = (e: ProgressEvent<FileReader>) => {
        this.imgUrl = e.target?.result;
      };
    }
  }

  isSubmitting: boolean = false;

  submitForm(event: Event, form: HTMLFormElement): void {
    event.preventDefault();
    if (this.isSubmitting) return;

    const formData = new FormData();

    if (this.content.value) {
      formData.append('body', this.content.value);
    }
    if (this.privacy.value) {
      formData.append('privacy', this.privacy.value);
    }
    if (this.saveFile) {
      formData.append('image', this.saveFile);
    }

    if (this.isUpdateMode && this.updatePostId) {
      const targetPost = this.postList.find(p => p._id === this.updatePostId);
      const prevBody = targetPost?.body;
      const prevImage = targetPost?.image;

      if (targetPost) {
        targetPost.body = this.content.value;
        if (this.imgUrl && typeof this.imgUrl === 'string') {
          targetPost.image = this.imgUrl;
        }
      }

      this.isSubmitting = true;
      this.postsService.updatePost(this.updatePostId, formData).subscribe({
        next: (res) => {
          if (res.success) {
            const updated = res.data?.post;
            if (targetPost && updated) {
              targetPost.image = updated.image;
              targetPost.body = updated.body;
            }
            this.cancelUpdate(form);
          } else {
            if (targetPost) {
              targetPost.body = prevBody;
              targetPost.image = prevImage;
            }
          }
          this.isSubmitting = false;
        },
        error: (err) => {
          if (targetPost) {
            targetPost.body = prevBody;
            targetPost.image = prevImage;
          }
          this.isSubmitting = false;
          console.error('Failed to update post', err);
        }
      });
    } else {
      const localPreview: any = {
        _id: `temp-${Date.now()}`,
        body: this.content.value,
        image: this.imgUrl ? String(this.imgUrl) : undefined,
        privacy: this.privacy.value,
        user: { _id: this.userId, name: this.userName, username: '', photo: this.userPhoto },
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        isLiked: false,
        bookmarked: false,
        createdAt: new Date().toISOString(),
        id: `temp-${Date.now()}`,
        isShare: false,
        _isOptimistic: true
      };

      this.postList.unshift(localPreview);
      const tempId = localPreview._id;
      form.reset();
      this.imgUrl = '';
      this.saveFile = null;
      this.privacy.setValue('public');
      this.content.setValue('');

      this.isSubmitting = true;
      this.postsService.createPost(formData).subscribe({
        next: (res) => {
          if (res.success) {
            const realPost = res.data?.post;
            const idx = this.postList.findIndex(p => p._id === tempId);
            if (idx !== -1 && realPost) {
              realPost.isLiked = false;
              this.postList[idx] = realPost;
            } else if (idx !== -1) {
              this.postList.splice(idx, 1);
              this.loadFeedPosts(true);
            }
          } else {
            this.postList = this.postList.filter(p => p._id !== tempId);
          }
          this.isSubmitting = false;
        },
        error: (err) => {
          this.postList = this.postList.filter(p => p._id !== tempId);
          this.isSubmitting = false;
          console.log(err);
        }
      });
    }
  }

  openEditModal(post: Post): void {
    this.isUpdateMode = true;
    this.updatePostId = post._id;
    this.content.setValue(post.body || '');
    this.privacy.setValue(post.privacy || 'public');
    this.imgUrl = post.image || '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelUpdate(form: HTMLFormElement): void {
    this.isUpdateMode = false;
    this.updatePostId = null;
    form.reset();
    this.imgUrl = '';
    this.saveFile = null;
    this.privacy.setValue('public');
    this.content.setValue('');
  }

  deletePost(postId: string): void {
    this.postsService.deletePost(postId).subscribe({
      next: (res) => {
        console.log(res);
        if (res.success) {
          this.postList = this.postList.filter(post => post._id !== postId);
        }
      },
      error: (err) => {
        console.log(err);
      }
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
          this.loadFeedPosts(true);
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