import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _isDark = false;

  constructor() {
    const saved = localStorage.getItem('theme');
    this._isDark = saved === 'dark';
    this.applyTheme();
  }

  get isDark(): boolean {
    return this._isDark;
  }

  toggle(): void {
    this._isDark = !this._isDark;
    localStorage.setItem('theme', this._isDark ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    const html = document.documentElement;
    if (this._isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }
}
