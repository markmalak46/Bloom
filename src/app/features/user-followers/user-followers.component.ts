import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-user-followers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-followers.component.html',
  styleUrl: './user-followers.component.css',
})
export class UserFollowersComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly route = inject(ActivatedRoute);

  followers: any[] = [];
  userName: string = '';
  userId: string = '';
  isLoading: boolean = true;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.isLoading = true;
      if (id) {
        this.userId = id;
        this.profileService.getUserProfile(id).subscribe({
          next: (res: any) => {
            if (res?.success) {
              this.followers = res.data.user.followers || [];
              this.userName = res.data.user.name;
            }
            this.isLoading = false;
          },
          error: (err: any) => {
            console.error('Failed to fetch user followers', err);
            this.isLoading = false;
          },
        });
      }
    });
  }

  followUser(userId: string): void {
    this.profileService.followUser(userId).subscribe({
      next: (res) => {
        if (res.success) {
          this.followers = this.followers.map((user) => {
            if (user._id === userId) {
              return { ...user, following: res.data.following };
            }
            return user;
          });
        }
      },
      error: (err) => {
        console.error('Failed to follow user', err);
      },
    });
  }
}
