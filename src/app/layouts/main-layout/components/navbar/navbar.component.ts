import { initFlowbite } from 'flowbite';
import { AfterViewInit, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { initDropdowns, initCollapses } from 'flowbite';
import { ThemeService } from '../../../../core/theme/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements AfterViewInit {
  private readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);

  userName: string = 'User';
  userPhoto: string = '/assets/imgs/default-profile.png';

  constructor() {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      this.userName = user.name || 'User';
      this.userPhoto = user.photo || '/assets/imgs/default-profile.png';
    }
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      initDropdowns();
      initCollapses();
    });
  }

  logOut(): void {
    this.authService.signOut();
  }
}
