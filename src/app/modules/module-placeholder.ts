import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { map } from 'rxjs/operators';

import { IconOfPipe } from '../shared/icon';
import { ThemeService } from '../shared/theme.service';
import { navEntry } from '../shell/nav.model';

/**
 * Generic "module coming soon" placeholder, reproducing the legacy
 * `moduleMarkup()` screen for every sidebar destination that isn't part of
 * this prototype (dashboard and the quotation variants). Keeps every sidebar
 * link inside the Angular router instead of pointing at pages that don't exist.
 */
@Component({
  selector: 'app-module-placeholder',
  standalone: true,
  imports: [IconOfPipe, LucideDynamicIcon],
  templateUrl: './module-placeholder.html',
})
export class ModulePlaceholder {
  private readonly route = inject(ActivatedRoute);
  protected readonly theme = inject(ThemeService);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? 'dashboard')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? 'dashboard' },
  );

  protected readonly entry = computed(() => navEntry(this.id()));
  protected readonly isAppearanceSettings = computed(() => this.id() === 'admin');
}
