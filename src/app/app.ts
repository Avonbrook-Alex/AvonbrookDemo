import { Component, inject } from '@angular/core';

import { AppShell } from './shell/app-shell/app-shell';
import { ThemeService } from './shared/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShell],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly theme = inject(ThemeService);
}
