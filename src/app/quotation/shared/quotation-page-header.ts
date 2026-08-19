import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';

import { IconOfPipe } from '../../shared/icon';
import { QUOTATION_STATUSES, Quotation, statusToneClasses } from './quotation.model';

/**
 * Shared quotation page header: icon + title + status badge + subtitle on the
 * left, and a compact New/Save/PDF/Send action cluster on the right. Used
 * identically by V1 (classic tabs), V2 (collapsible sections), and V3 (stage
 * tabs) so the top of every quotation screen reads the same way.
 */
@Component({
  selector: 'app-quotation-page-header',
  standalone: true,
  imports: [FormsModule, IconOfPipe, LucideDynamicIcon],
  templateUrl: './quotation-page-header.html',
})
export class QuotationPageHeader {
  public readonly quotation = input.required<Quotation>();
  public readonly revision = input(0);
  public readonly title = input('Quotation');
  public readonly subtitle = input('Create and manage vehicle quotations');
  /** Extra pill next to the actions, used by V1 for its Create/View mode indicator. */
  public readonly modeLabel = input<string | null>(null);
  /** Whether to show the "New" action (V1 only - V2/V3 don't have a create/reset workflow). */
  public readonly showNewButton = input(false);
  /** Whether the status badge is an editable select (V2/V3) or a read-only pill (V1). */
  public readonly editableStatus = input(false);

  public readonly newQuotation = output<void>();
  public readonly save = output<void>();
  public readonly exportPdf = output<void>();
  public readonly send = output<void>();

  protected readonly statuses = QUOTATION_STATUSES;

  protected statusTone(): string {
    return statusToneClasses(this.quotation().header.status);
  }
}
