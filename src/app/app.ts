import { Component, inject } from '@angular/core';

import { AppShell } from './shell/app-shell/app-shell';
import { ThemeService } from './shared/theme.service';
import { AuthService } from './auth/auth.service';
import { Login } from './auth/login';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShell, Login],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly theme = inject(ThemeService);
  protected readonly auth = inject(AuthService);
}
