import { Injectable, signal } from '@angular/core';

import { environment } from '../../environments/environment';

const SESSION_KEY = 'fortuna-demo-auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal(sessionStorage.getItem(SESSION_KEY) === '1');

  async login(username: string, password: string): Promise<boolean> {
    const passwordHash = await this.hash(password);
    const valid = username.trim() === environment.demoUsername && passwordHash === environment.demoPasswordHash;
    if (valid) {
      sessionStorage.setItem(SESSION_KEY, '1');
      this.isAuthenticated.set(true);
    }
    return valid;
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.isAuthenticated.set(false);
  }

  private async hash(value: string): Promise<string> {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
}
