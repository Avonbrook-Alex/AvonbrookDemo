import { Component, input, output } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

import { IconOfPipe } from '../../shared/icon';
import { Quotation } from './quotation.model';
import { ZarCurrencyPipe } from './zar-currency.pipe';

/**
 * Sticky right-hand pricing summary shared by the V2 (collapsible sections)
 * and V3 (tabbed stage builder) quotation variants, mirroring the summary
 * aside rendered by `v2-sections-flow.js` / `v3-tabs-flow.js`.
 */
@Component({
  selector: 'app-quotation-summary',
  standalone: true,
  imports: [IconOfPipe, LucideDynamicIcon, ZarCurrencyPipe],
  templateUrl: './quotation-summary.html',
})
export class QuotationSummary {
  public readonly quotation = input.required<Quotation>();
  public readonly revision = input(0);
  public readonly save = output<void>();
  public readonly exportPdf = output<void>();
  public readonly send = output<void>();

  /** Customer display name for the summary's context header, e.g. "John Smith". */
  protected customerName(): string {
    const { firstName, surname, company } = this.quotation().contact;
    const fullName = [firstName, surname].filter(Boolean).join(' ').trim();
    return fullName || company || 'Unnamed customer';
  }

  protected vehicleTotal(): number {
    return Number(this.quotation().vehicle.retailPrice) || 0;
  }

  protected accessoryTotal(): number {
    return this.quotation().accessories.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  protected tradeInTotal(): number {
    return Number(this.quotation().tradeIn.estimatedValue) || 0;
  }

  protected grossTotal(): number {
    return this.vehicleTotal() + this.accessoryTotal();
  }

  protected balanceTotal(): number {
    return Math.max(0, this.grossTotal() - this.tradeInTotal() - this.quotation().pricing.totalDiscount);
  }
}
