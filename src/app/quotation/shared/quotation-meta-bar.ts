import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Quotation } from './quotation.model';
import { ZarCurrencyPipe } from './zar-currency.pipe';

/**
 * Shared metadata/header strip used identically across V1, V2, and V3:
 * quotation search/number, division, sales executive, franchise, date, and
 * the running total payment. Extracting this keeps the three variants'
 * "at a glance" quotation identity fields visually and structurally in sync.
 */
@Component({
  selector: 'app-quotation-meta-bar',
  standalone: true,
  imports: [FormsModule, ZarCurrencyPipe],
  templateUrl: './quotation-meta-bar.html',
})
export class QuotationMetaBar {
  public readonly quotation = input.required<Quotation>();
}
