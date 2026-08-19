import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';

import { IconOfPipe } from '../../shared/icon';
import {
  Quotation,
  populateFromSavedQuotation,
  recalculateTotals,
  SavedQuotationSummary,
  SAVED_QUOTATIONS,
  sampleQuotationV3,
} from '../shared/quotation.model';
import { QuotationAccessorySelection } from '../shared/quotation-accessory-selection';
import { QuotationMetaBar } from '../shared/quotation-meta-bar';
import { QuotationEntityLookup } from '../shared/quotation-entity-lookup';
import { QuotationPageHeader } from '../shared/quotation-page-header';
import { QuotationSummary } from '../shared/quotation-summary';
import { ZarCurrencyPipe } from '../shared/zar-currency.pipe';
import { missingQuotationFields, quotationSectionHasData } from '../shared/quotation-section-validation';

type StageId = 'customer' | 'requirements' | 'vehicle' | 'accessories' | 'tradein' | 'pricing' | 'finance' | 'notes';

const STAGES: { id: StageId; label: string; icon: string }[] = [
  { id: 'customer', label: 'Customer', icon: 'user' },
  { id: 'requirements', label: 'Requirements', icon: 'clipboard-list' },
  { id: 'vehicle', label: 'Vehicle', icon: 'car' },
  { id: 'accessories', label: 'Accessories', icon: 'package' },
  { id: 'tradein', label: 'Trade-in', icon: 'swap-2' },
  { id: 'pricing', label: 'Pricing', icon: 'calculator' },
  { id: 'finance', label: 'Finance', icon: 'landmark' },
  { id: 'notes', label: 'Notes', icon: 'sticky-note' },
];

/**
 * V3 quotation variant: the definitive tabbed quotation workflow. It keeps
 * V3's clean staged tab navigation and sticky summary, reproducing
 * `v3-tabs-flow.js` as native Angular state (an active-stage signal) instead
 * of imperative class/style toggling, while folding in V1's fuller detailed
 * fields, accessory catalog selection, editable selected accessories,
 * trade-in/comments/pricing/finance capabilities.
 */
@Component({
  selector: 'app-quotation-v3',
  standalone: true,
  imports: [FormsModule, IconOfPipe, LucideDynamicIcon, ZarCurrencyPipe, QuotationMetaBar, QuotationPageHeader, QuotationSummary, QuotationEntityLookup],
  templateUrl: './quotation-v3.html',
})
export class QuotationV3 {
  private readonly route = inject(ActivatedRoute);
  public readonly quotation: Quotation = sampleQuotationV3();
  public readonly stages = STAGES;

  public readonly activeStage = signal<StageId>('customer');
  public readonly summaryRevision = signal(0);
  private readonly checkedStages = signal<ReadonlySet<StageId>>(new Set());

  public constructor() {
    const number = this.route.snapshot.paramMap.get('number');
    const saved = SAVED_QUOTATIONS.find((row) => row.number === number);
    if (saved) {
      populateFromSavedQuotation(this.quotation, saved);
    }
  }

  public pageTitle(): string {
    return this.route.snapshot.paramMap.has('number') ? `Quote ${this.quotation.header.number} (Staged)` : 'New Quote (Staged)';
  }

  /** Shared "Available Accessories" catalog picker / "Selected Accessories" add-remove behaviour, also used by V1. */
  public readonly accessories = new QuotationAccessorySelection(
    () => this.quotation,
    () => this.recalculate(),
  );

  public setStage(stage: StageId): void {
    this.checkedStages.update((current) => new Set(current).add(this.activeStage()));
    this.activeStage.set(stage);
  }

  public scrollStages(event: WheelEvent, container: HTMLElement): void {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      container.scrollLeft += event.deltaY;
      event.preventDefault();
    }
  }

  public stageNumber(stage: StageId): number {
    return STAGES.findIndex((s) => s.id === stage) + 1;
  }

  public isComplete(stage: StageId): boolean {
    return quotationSectionHasData(this.quotation, stage) && missingQuotationFields(this.quotation, stage).length === 0;
  }

  public isIncomplete(stage: StageId): boolean {
    return this.checkedStages().has(stage) && missingQuotationFields(this.quotation, stage).length > 0;
  }

  public recalculate(): void {
    recalculateTotals(this.quotation);
    this.summaryRevision.update((value) => value + 1);
  }

  public refreshSummary(): void {
    this.summaryRevision.update((value) => value + 1);
  }

  public openSavedQuotation(row: SavedQuotationSummary): void {
    populateFromSavedQuotation(this.quotation, row);
    this.recalculate();
  }

  public onSave(): void {
    window.alert('Quote saved (demo)');
  }

  public onExportPdf(): void {
    window.alert('PDF generated (demo)');
  }

  public onSend(): void {
    window.alert('Email sent (demo)');
  }
}
