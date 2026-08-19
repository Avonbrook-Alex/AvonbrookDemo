import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'fortuna-demo-theme';
const DEFAULT_PRIMARY = '#2563eb';
const DEFAULT_SECONDARY = '#eff6ff';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly primary = signal(DEFAULT_PRIMARY);
  readonly secondary = signal(DEFAULT_SECONDARY);

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const theme = JSON.parse(saved) as { primary?: string; secondary?: string };
      this.primary.set(theme.primary ?? DEFAULT_PRIMARY);
      this.secondary.set(theme.secondary ?? DEFAULT_SECONDARY);
    }
    this.apply();
  }

  setPrimary(value: string): void {
    this.primary.set(value);
    this.persist();
  }

  setSecondary(value: string): void {
    this.secondary.set(value);
    this.persist();
  }

  usePreset(primary: string, secondary: string): void {
    this.primary.set(primary);
    this.secondary.set(secondary);
    this.persist();
  }

  reset(): void {
    this.usePreset(DEFAULT_PRIMARY, DEFAULT_SECONDARY);
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      primary: this.primary(),
      secondary: this.secondary(),
    }));
    this.apply();
  }

  private apply(): void {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', this.primary());
    root.style.setProperty('--theme-secondary', this.secondary());
  }
}
