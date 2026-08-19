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
  sampleQuotationV2,
} from '../shared/quotation.model';
import { QuotationMetaBar } from '../shared/quotation-meta-bar';
import { QuotationEntityLookup } from '../shared/quotation-entity-lookup';
import { QuotationPageHeader } from '../shared/quotation-page-header';
import { QuotationSummary } from '../shared/quotation-summary';
import { ZarCurrencyPipe } from '../shared/zar-currency.pipe';
import { missingQuotationFields, quotationSectionHasData } from '../shared/quotation-section-validation';

type SectionId = 'customer' | 'requirements' | 'vehicle' | 'accessories' | 'tradein' | 'pricing' | 'finance' | 'notes';

const SECTION_ORDER: SectionId[] = ['customer', 'requirements', 'vehicle', 'accessories', 'tradein', 'pricing', 'finance', 'notes'];

const SECTION_TITLES: Record<SectionId, string> = {
  customer: 'Customer Details',
  requirements: 'Vehicle Requirements',
  vehicle: 'Vehicle Details',
  accessories: 'Accessories & Options',
  tradein: 'Trade-in Vehicle',
  pricing: 'Pricing',
  finance: 'Finance',
  notes: 'Notes',
};

/**
 * V2 quotation variant: reference layout with collapsible sections and a
 * sticky summary panel, reproducing `v2-sections-flow.js` as native Angular
 * state (an open-sections signal) instead of imperative `classList.toggle`.
 */
@Component({
  selector: 'app-quotation-v2',
  standalone: true,
  imports: [FormsModule, IconOfPipe, LucideDynamicIcon, ZarCurrencyPipe, QuotationMetaBar, QuotationPageHeader, QuotationSummary, QuotationEntityLookup],
  templateUrl: './quotation-v2.html',
})
export class QuotationV2 {
  private readonly route = inject(ActivatedRoute);
  public readonly quotation: Quotation = sampleQuotationV2();
  public readonly sections = SECTION_ORDER;
  public readonly summaryRevision = signal(0);

  /** Only the customer section is expanded by default, matching the reference. */
  private readonly openSections = signal<ReadonlySet<SectionId>>(new Set(['customer']));
  private readonly checkedSections = signal<ReadonlySet<SectionId>>(new Set());

  public constructor() {
    const number = this.route.snapshot.paramMap.get('number');
    const saved = SAVED_QUOTATIONS.find((row) => row.number === number);
    if (saved) {
      populateFromSavedQuotation(this.quotation, saved);
    }
  }

  public pageTitle(): string {
    return this.route.snapshot.paramMap.has('number') ? `Quote ${this.quotation.header.number} (Guided)` : 'New Quote (Guided)';
  }

  public isOpen(section: SectionId): boolean {
    return this.openSections().has(section);
  }

  public toggleSection(section: SectionId): void {
    for (const open of this.openSections()) {
      if (open !== section) {
        this.markChecked(open);
      }
    }
    if (this.isOpen(section)) {
      this.markChecked(section);
    }
    this.openSections.update((current) => {
      const next = new Set(current);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }

  public sectionTitle(section: SectionId): string {
    return SECTION_TITLES[section];
  }

  public sectionNumber(section: SectionId): number {
    return SECTION_ORDER.indexOf(section) + 1;
  }

  public isComplete(section: SectionId): boolean {
    return quotationSectionHasData(this.quotation, section) && missingQuotationFields(this.quotation, section).length === 0;
  }

  public isIncomplete(section: SectionId): boolean {
    return this.checkedSections().has(section) && missingQuotationFields(this.quotation, section).length > 0;
  }

  public validationMessage(section: SectionId): string {
    const missing = missingQuotationFields(this.quotation, section);
    return missing.length > 2 ? 'Required information is missing' : `Missing: ${missing.join(', ')}`;
  }

  public completeAndContinue(section: SectionId): void {
    this.markChecked(section);
    if (!this.isComplete(section)) {
      return;
    }
    const next = SECTION_ORDER[SECTION_ORDER.indexOf(section) + 1];
    this.openSections.set(new Set(next ? [next] : []));
  }

  private markChecked(section: SectionId): void {
    this.checkedSections.update((current) => new Set(current).add(section));
  }

  public sectionSummary(section: SectionId): string {
    switch (section) {
      case 'customer': {
        const name = [
          this.quotation.contact.firstName,
          this.quotation.contact.surname,
        ]
          .filter(Boolean)
          .join(' ');
        return [
          name,
          this.quotation.contact.company,
          this.quotation.contact.mobile,
          this.quotation.contact.email,
        ]
          .filter(Boolean)
          .join(' · ');
      }
      case 'vehicle':
        return [
          this.quotation.vehicle.modelDescription,
          this.quotation.vehicle.year,
          this.quotation.vehicle.colour,
          this.quotation.vehicle.regNo,
        ]
          .filter(Boolean)
          .join(' · ');
      case 'requirements':
        return this.isComplete('requirements')
          ? [this.quotation.contact.vehicleType, this.quotation.requirements.modelRange, this.quotation.requirements.requiredDate].filter(Boolean).join(' · ')
          : '';
      case 'accessories': {
        const count = this.quotation.accessories.length;
        if (!count) {
          return '';
        }
        return `${count} ${count === 1 ? 'item' : 'items'} · ${this.quotation.accessories
          .map((item) => item.description)
          .slice(0, 2)
          .join(', ')}`;
      }
      case 'tradein':
        return [
          this.quotation.tradeIn.modelDescription,
          this.quotation.tradeIn.regNo,
          this.quotation.tradeIn.mileage
            ? `${this.quotation.tradeIn.mileage} km`
            : '',
        ]
          .filter(Boolean)
          .join(' · ');
      case 'notes': {
        const notes = this.quotation.comments.trim();
        return notes.length > 72 ? `${notes.slice(0, 72)}…` : notes;
      }
      case 'pricing':
        return `Balance ${this.quotation.pricing.totalPayment.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' })}`;
      case 'finance':
        return this.quotation.finance.arrangedByCustomer ? 'Arranged by customer' : [this.quotation.finance.provider, `${this.quotation.finance.installments} repayments`].filter(Boolean).join(' · ');
    }
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
