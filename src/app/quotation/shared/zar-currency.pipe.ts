import { Pipe, PipeTransform } from '@angular/core';

import { formatCurrency } from './quotation.model';

/** Formats a quotation value as Euro currency. */
@Pipe({
  name: 'zar',
  standalone: true,
  pure: true,
})
export class ZarCurrencyPipe implements PipeTransform {
  transform(value: number | string | undefined): string {
    return formatCurrency(value);
  }
}
