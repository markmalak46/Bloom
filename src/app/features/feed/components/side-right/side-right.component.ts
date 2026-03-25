import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../../../core/services/profile.service';

@Component({
  selector: 'app-side-right',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './side-right.component.html',
  styleUrl: './side-right.component.css'
})
export class SideRightComponent implements OnInit {
    private readonly profileService = inject(ProfileService);


  suggestions: any[] = [];
  isLoading: boolean = true;
  searchTerm: string = '';

  ngOnInit(): void {
    this.profileService.getFollowSuggestions(10).subscribe({
      next: (res) => {
        if (res.success) {
          this.suggestions = res.data.suggestions;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load suggestions', err);
        this.isLoading = false;
      }
    });
  }

  get filteredSuggestions(): any[] {
    if (!this.searchTerm) {
      return this.suggestions;
    }
    const lowerTerm = this.searchTerm.toLowerCase();
    return this.suggestions.filter(user =>
      user.name?.toLowerCase().includes(lowerTerm) ||
      user.username?.toLowerCase().includes(lowerTerm)
    );
  }

  followUser(userId: string): void {
    this.profileService.followUser(userId).subscribe({
      next: (res) => {
        if (res.success) {
          this.suggestions = this.suggestions.map(user => {
            if (user._id === userId) {
              return { ...user, following: res.data.following };
            }
            return user;
          });
        }
      },
      error: (err) => {
        console.error('Failed to follow user', err);
      }
    });
  }
}
