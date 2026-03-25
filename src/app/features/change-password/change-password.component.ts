import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  changePasswordForm: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.pattern(/^[A-Z][a-zA-Z0-9!@#\$%\^&\*]{6,16}$/)]],
    newPassword: ['', [Validators.required, Validators.pattern(/^[A-Z][a-zA-Z0-9!@#\$%\^&\*]{6,16}$/)]],
  });

  isLoading: boolean = false;
  apiError: string = '';
  apiSuccess: string = '';

  passwordVisible: boolean = false;
  newPasswordVisible: boolean = false;

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleNewPasswordVisibility(): void {
    this.newPasswordVisible = !this.newPasswordVisible;
  }

  onSubmit(): void {
    if (this.changePasswordForm.valid) {
      this.isLoading = true;
      this.apiError = '';
      this.apiSuccess = '';

      this.authService.changePassword(this.changePasswordForm.value).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.message === 'password changed successfully' || res.success) {
            localStorage.setItem('token', res.data.token);
            this.apiSuccess = 'Password updated successfully!';
            this.changePasswordForm.reset();
            
            setTimeout(() => {
                this.router.navigate(['/feed']);
            }, 1500);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.apiError = err.error?.error || err.error?.message || 'Failed to update password. Please check your current password.';
        }
      });
    } else {
      this.changePasswordForm.markAllAsTouched();
    }
  }
}
