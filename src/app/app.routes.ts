import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';
import { ForgotPasswordComponent } from './features/forgot-password/forgot-password.component';
import { FeedComponent } from './features/feed/feed.component';
import { ProfileComponent } from './features/profile/profile.component';
import { NotificationComponent } from './features/notification/notification.component';
import { ChangePasswordComponent } from './features/change-password/change-password.component';
import { NotfoundComponent } from './features/notfound/notfound.component';
import { authGuard } from './core/auth/guards/auth-guard';
import { guestGuard } from './core/auth/guards/guest-guard';
import { PostDetailsComponent } from './features/post-details/post-details.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      { path: 'login', component: LoginComponent, title: 'Login' },
      { path: 'register', component: RegisterComponent, title: 'Register' },
      { path: 'forgotPassword', component: ForgotPasswordComponent, title: 'Forgot Password' },
    ],
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'feed', component: FeedComponent, title: 'Timeline' },
      { path: 'profile', component: ProfileComponent, title: 'Profile' },
      { path: 'user/:id', component: ProfileComponent, title: 'User Profile' },
      { path: 'user/:id/followers', loadComponent: () => import('./features/user-followers/user-followers.component').then(m => m.UserFollowersComponent), title: 'Followers' },
      { path: 'notification', component: NotificationComponent, title: 'Notifications' },
      { path: 'change', component: ChangePasswordComponent, title: 'Change Password' },
      { path: 'details/:id', component: PostDetailsComponent, title: 'Post Datails'},
      { path: 'saved', loadComponent: () => import('./features/bookmarks/bookmarks.component').then(m => m.BookmarksComponent), title: 'Saved Posts' }
    ],
  },
  { path: '**', component: NotfoundComponent },
];
