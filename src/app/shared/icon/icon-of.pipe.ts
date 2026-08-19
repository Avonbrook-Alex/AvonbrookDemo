import { Pipe, PipeTransform } from '@angular/core';
import type { LucideIcon } from '@lucide/angular';

import { resolveIcon } from './icon-map';

/**
 * Resolves a legacy kebab-case icon name (e.g. "layout-dashboard") to the
 * matching `@lucide/angular` icon component so templates can bind it directly
 * to `[lucideIcon]` without any imperative DOM manipulation.
 */
@Pipe({
  name: 'iconOf',
  standalone: true,
  pure: true,
})
export class IconOfPipe implements PipeTransform {
  transform(name: string | null | undefined): LucideIcon {
    return resolveIcon(name);
  }
}
