import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './suggestions.component.html',
  styleUrl: './suggestions.component.css'
})
export class SuggestionsComponent implements OnInit {
  private readonly authService = inject(AuthService);
    private readonly profileService = inject(ProfileService);
  
  searchTerm: string = '';
  suggestions: any[] = [];
  isLoading: boolean = true;

  ngOnInit(): void {
    this.profileService.getFollowSuggestions(50).subscribe({
      next: (res) => {
        if (res.success) {
          this.suggestions = res.data.suggestions;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

get filteredSuggestions() {
  const term = this.searchTerm.trim().toLowerCase();

  if (!term) return this.suggestions;

  return this.suggestions.filter(user =>
    user.name?.toLowerCase().includes(term) ||
    user.username?.toLowerCase().includes(term)
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
