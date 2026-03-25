import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommentsService } from './comments.service';
import { Comment } from '../../../../../core/models/comment.interface';
import { AuthService } from '../../../../../core/auth/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { ProfileService } from '../../../../../core/services/profile.service';

@Component({
  selector: 'app-comment-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './comment-post.component.html',
  styleUrl: './comment-post.component.css',
})
export class CommentPostComponent implements OnInit {
  private readonly commentsService = inject(CommentsService);
  private readonly profileService = inject(ProfileService);
  private readonly toastr = inject(ToastrService);

  @Input() postId: string = "";
  commentList: Comment[] = [];
  userPhoto: string = "";
  currentUserId: string = "";
  commentControl = new FormControl('', [Validators.required, Validators.minLength(1)]);
  editCommentControl = new FormControl('', [Validators.required, Validators.minLength(1)]);
  replyCommentControl = new FormControl('', [Validators.required, Validators.minLength(1)]);
  isSubmitting = false;
  isSubmittingReply = false;
  editingCommentId: string | null = null;
  replyingCommentId: string | null = null;

  ngOnInit(): void {
    this.getCommentPost();
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      this.currentUserId = user._id || '';
      this.userPhoto = user.photo || '';
    }

    this.profileService.getProfileData().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.user) {
           this.userPhoto = res.data.user.photo;
           this.currentUserId = res.data.user._id;
        }
      }
    });
  }

  getCommentPost(): void {
    this.commentsService.getPostComments(this.postId).subscribe({
      next: (res) => {
        this.commentList = res.data.comments;
      },
      error: (err) => {
        console.error('Failed to load comments:', err);
      }
    });
  }

  sendComment(): void {
    if (this.commentControl.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    const content = this.commentControl.value!;

    this.commentsService.createComment(this.postId, { content }).subscribe({
      next: (res) => {
        if (res.success) {
          this.commentList = [res.data.comment, ...this.commentList];
          this.commentControl.reset();
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Failed to create comment:', err);
        this.isSubmitting = false;
      }
    });
  }

  deleteComment(commentId: string): void {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    this.commentsService.deleteComment(this.postId, commentId).subscribe({
      next: (res) => {
        if (res.success) {
          this.commentList = this.commentList.filter(c => c._id !== commentId);
        }
      },
      error: (err) => {
        console.error('Failed to delete comment:', err);
      }
    });
  }

  startEdit(comment: Comment): void {
    this.editingCommentId = comment._id;
    this.editCommentControl.setValue(comment.content);
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editCommentControl.reset();
  }

  updateComment(commentId: string): void {
    if (this.editCommentControl.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    const content = this.editCommentControl.value!;

    this.commentsService.updateComment(this.postId, commentId, { content }).subscribe({
      next: (res) => {
        if (res.success) {
          const index = this.commentList.findIndex(c => c._id === commentId);
          if (index !== -1) {
            this.commentList[index] = res.data.comment;
          }
          this.cancelEdit();
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Failed to update comment:', err);
        this.isSubmitting = false;
      }
    });
  }

  toggleLikeComment(comment: Comment): void {
    this.commentsService.likeComment(this.postId, comment._id).subscribe({
      next: (res) => {
        if (res.success) {
          if (res.data && res.data.comment) {
            Object.assign(comment, res.data.comment);
          } else if (res.data) {
             if (res.data.likesCount !== undefined) {
               comment.likesCount = res.data.likesCount;
             }
             if (res.data.liked !== undefined) {
               comment.isLiked = res.data.liked;
             }
          }
        }
      },
      error: (err) => console.error('Failed to like comment', err)
    });
  }

  getLikesCount(comment: Comment): number {
    if (comment.likesCount !== undefined) {
      return comment.likesCount;
    }
    return comment.likes?.length || 0;
  }

  isCommentLiked(comment: Comment): boolean {
    if (comment.isLiked !== undefined) {
      return comment.isLiked;
    }
    if (!comment.likes || !this.currentUserId) return false;
    return comment.likes.some((like: any) => 
      like === this.currentUserId || (like && like._id === this.currentUserId)
    );
  }

  toggleReply(commentId: string): void {
    if (this.replyingCommentId === commentId) {
      this.replyingCommentId = null;
    } else {
      this.replyingCommentId = commentId;
      this.replyCommentControl.reset();
    }
  }

  submitReply(comment: Comment): void {
    if (this.replyCommentControl.invalid || this.isSubmittingReply) return;

    this.isSubmittingReply = true;
    const content = this.replyCommentControl.value!;

    this.commentsService.createCommentReply(this.postId, comment._id, { content }).subscribe({
      next: (res) => {
        if (res.success) {
          if (!comment.replies) {
            comment.replies = [];
          }
          comment.replies.push(res.data.reply);
          comment.repliesCount = (comment.repliesCount || 0) + 1;
          comment.showReplies = true;
          
          this.replyingCommentId = null;
          this.replyCommentControl.reset();
          this.toastr.success(res.message || 'Reply posted', 'Bloom');
        }
        this.isSubmittingReply = false;
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to post reply', 'Bloom');
        this.isSubmittingReply = false;
      }
    });
  }

  toggleViewReplies(comment: Comment): void {
    if (comment.showReplies) {
      comment.showReplies = false;
    } else {
      if (comment.replies && comment.replies.length > 0) {
        comment.showReplies = true;
      } else {
        this.loadReplies(comment);
      }
    }
  }

  loadReplies(comment: Comment): void {
    this.commentsService.getCommentReplies(this.postId, comment._id).subscribe({
      next: (res) => {
        if (res.success) {
          comment.replies = res.data.replies;
          comment.showReplies = true;
        }
      },
      error: (err) => console.error('Failed to load replies', err)
    });
  }
}
