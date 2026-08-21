import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <section class="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-xl p-7">
        <div class="text-center mb-6">
          <div class="mx-auto mb-3 w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl">F</div>
          <h1 class="text-xl font-bold text-slate-900">Fortuna DMS</h1>
          <p class="text-sm text-slate-500 mt-1">Sign in to the demo</p>
        </div>
        <form class="space-y-4" (ngSubmit)="submit()">
          <label class="block"><span class="field-label">Username</span><input class="detail-input" name="username" [(ngModel)]="username" autocomplete="username" required /></label>
          <label class="block"><span class="field-label">Password</span><input type="password" class="detail-input" name="password" [(ngModel)]="password" autocomplete="current-password" required /></label>
          @if (error()) { <p class="text-sm text-rose-600">{{ error() }}</p> }
          <button class="action-primary w-full justify-center" type="submit" [disabled]="busy()">{{ busy() ? 'Signing in…' : 'Sign in' }}</button>
        </form>
        <p class="text-[11px] text-slate-400 mt-5 text-center">Demo-only access gate. Do not use for real credentials.</p>
      </section>
    </main>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  protected username = '';
  protected password = '';
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      if (!(await this.auth.login(this.username, this.password))) {
        this.error.set('Incorrect username or password.');
      }
    } finally {
      this.busy.set(false);
    }
  }
}
