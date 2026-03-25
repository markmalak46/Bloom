import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Post } from '../../core/models/post.interface';
import { PostsService } from '../../core/services/posts.service';
import { CommentPostComponent } from '../feed/components/feed-content/comment-post/comment-post.component';
import { Follower, ProfileData } from '../../core/models/profile-data.interface';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, CommentPostComponent, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  providers: [DatePipe]
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly postsService = inject(PostsService);
  private readonly profileService = inject(ProfileService);
  private readonly route = inject(ActivatedRoute);

  profileData: ProfileData | null = null;
  posts: Post[] = [];
  loading: boolean = true;
  postsLoading: boolean = false;
  error: string | null = null;
  isCurrentUser: boolean = true;
  loggedInUserId: string = '';

  isUpdateMode: boolean = false;
  updatePostId: string | null = null;
  content: FormControl = new FormControl('');
  privacy: FormControl = new FormControl('public');
  saveFile: File | null | undefined = undefined;
  imgUrl: string | ArrayBuffer | null | undefined = '';

  isSharing: boolean = false;
  sharePostId: string | null = null;
  shareContent: FormControl = new FormControl('');

  isUploadingPhoto: boolean = false;

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const formData = new FormData();
    formData.append('photo', input.files[0]);

    this.isUploadingPhoto = true;
    this.profileService.uploadPhoto(formData).subscribe({
      next: (res: any) => {
        if (res.success && this.profileData) {
          this.profileData.photo = res.data.user.photo;
          const stored = localStorage.getItem('user');
          if (stored) {
            const u = JSON.parse(stored);
            u.photo = res.data.user.photo;
            localStorage.setItem('user', JSON.stringify(u));
          }
        }
        this.isUploadingPhoto = false;
      },
      error: (err: any) => {
        console.error('Failed to upload photo', err);
        this.isUploadingPhoto = false;
      }
    });
  }

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      this.loggedInUserId = user._id || '';
    }

    this.route.paramMap.subscribe(params => {
      const userId = params.get('id');
      this.loading = true;
      this.error = null;
      this.profileData = null;

      if (userId) {
        this.isCurrentUser = false;
        this.profileService.getUserProfile(userId).subscribe({
          next: (res) => {
            if (res.success) {
              this.profileData = res.data.user;

              if (this.profileData) {
                this.profileData.isFollowing = res.data.isFollowing;
              }

              if (this.profileData?.followers?.length) {
                this.profileData.followers = this.profileData.followers.map(follower => ({
                  ...follower,
                  isFollowing: false
                }));
              }

              this.loadUserPosts(userId);
            }
            this.loading = false;
          },
          error: (err) => {
            console.error('Failed to load user profile data', err);
            this.error = 'Failed to load user profile data. Please try again later.';
            this.loading = false;
          }
        });
      } else {
        this.isCurrentUser = true;
        this.profileService.getProfileData().subscribe({
          next: (res) => {
            if (res.success) {
              this.profileData = res.data.user;

              if (this.profileData?.followers?.length) {
                this.profileData.followers = this.profileData.followers.map(follower => ({
                  ...follower,
                  isFollowing: false
                }));
              }

              if (this.profileData?._id) {
                this.loadUserPosts(this.profileData._id);
              }
            }
            this.loading = false;
          },
          error: (err) => {
            console.error('Failed to load personal profile data', err);
            this.error = 'Failed to load profile data. Please try again later.';
            this.loading = false;
          }
        });
      }
    });
  }

  loadUserPosts(userId: string): void {
    this.postsLoading = true;
    this.postsService.getUserPosts(userId).subscribe({
      next: (res) => {
        if (res.success) {
          this.posts = res.data.posts.map((p: any) => ({
            ...p,
            isLiked: p.likes && p.likes.some((l: any) => l === this.loggedInUserId || l._id === this.loggedInUserId)
          }));
        }
        this.postsLoading = false;
      },
      error: (err) => {
        console.error('Failed to load user posts', err);
        this.postsLoading = false;
      }
    });
  }

  toggleFollow(): void {
    if (!this.profileData || !this.profileData._id) return;

    this.profileService.followUser(this.profileData._id).subscribe({
      next: (res) => {
        if (res.success && this.profileData) {
          this.profileData.isFollowing = res.data.following;
          this.profileData.followersCount = res.data.followersCount;
        }
      },
      error: (err) => {
        console.error('Failed to toggle follow', err);
      }
    });
  }

  toggleFollowUser(follower: Follower): void {
    const followerId = follower._id || follower.id;
    if (!followerId) return;

    this.profileService.followUser(followerId).subscribe({
      next: (res) => {
        if (res.success) {
          follower.isFollowing = res.data.following;

          if (typeof res.data.followersCount === 'number') {
            follower.followersCount = res.data.followersCount;
          }
        }
      },
      error: (err) => {
        console.error('Failed to toggle follower follow state', err);
      }
    });
  }

  deletePost(postId: string): void {
    if (!confirm('Are you sure you want to delete this post?')) return;

    this.postsService.deletePost(postId).subscribe({
      next: (res) => {
        if (res.success) {
          this.posts = this.posts.filter(post => post._id !== postId);
        }
      },
      error: (err) => {
        console.error('Failed to delete post', err);
      }
    });
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

  openEditModal(post: Post): void {
    this.isUpdateMode = true;
    this.updatePostId = post._id;
    this.content.setValue(post.body || '');
    this.privacy.setValue(post.privacy || 'public');
    this.imgUrl = post.image || '';
  }

  submitUpdateForm(event: Event): void {
    event.preventDefault();
    if (!this.updatePostId) return;

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

    this.postsService.updatePost(this.updatePostId, formData).subscribe({
      next: (res) => {
        if (res.success) {
          if (this.profileData?._id) {
            this.loadUserPosts(this.profileData._id);
          } else {
            const stored = localStorage.getItem('user');
            if (stored) {
              this.loadUserPosts(JSON.parse(stored)._id);
            }
          }
          this.cancelUpdate();
        }
      },
      error: (err) => {
        console.error('Failed to update post', err);
      }
    });
  }

  cancelUpdate(): void {
    this.isUpdateMode = false;
    this.updatePostId = null;
    this.imgUrl = '';
    this.saveFile = null;
    this.privacy.setValue('public');
    this.content.setValue('');
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
      next: (res) => {
        if (res.success) {
          if (this.profileData?._id) {
            this.loadUserPosts(this.profileData._id);
          }
          this.cancelShare();
        }
      },
      error: (err) => {
        console.error('Failed to share post', err);
      }
    });
  }

  cancelShare(): void {
    this.isSharing = false;
    this.sharePostId = null;
    this.shareContent.setValue('');
  }
}