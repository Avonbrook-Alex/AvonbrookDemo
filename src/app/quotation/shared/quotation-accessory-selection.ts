import { signal } from '@angular/core';

import { ACCESSORY_CATALOG, Quotation, QuotationAccessory } from './quotation.model';

/**
 * Encapsulates the "Available Accessories" catalog picker and the
 * "Selected Accessories" add/remove interaction shared by V1 (single-page
 * workspace) and V3 (accessories stage), so both variants drive the same
 * catalog selection/add/remove behaviour instead of duplicating it.
 */
export class QuotationAccessorySelection {
  public readonly catalog: QuotationAccessory[] = ACCESSORY_CATALOG;
  public readonly selectedAvailableIndex = signal<number | null>(null);
  public readonly selectedSelectedIndex = signal<number | null>(null);

  constructor(
    private readonly getQuotation: () => Quotation,
    private readonly onChange: () => void,
  ) {}

  public selectAvailable(index: number): void {
    this.selectedAvailableIndex.set(index);
  }

  public selectSelected(index: number): void {
    this.selectedSelectedIndex.set(index);
  }

  public add(): void {
    const index = this.selectedAvailableIndex();
    if (index === null) return;
    const item = this.catalog[index];
    const quotation = this.getQuotation();
    quotation.accessories = [...quotation.accessories, { ...item, quantity: 1 }];
    this.onChange();
  }

  public remove(): void {
    const index = this.selectedSelectedIndex();
    if (index === null) return;
    const quotation = this.getQuotation();
    quotation.accessories = quotation.accessories.filter((_, i) => i !== index);
    this.selectedSelectedIndex.set(null);
    this.onChange();
  }

  public reset(): void {
    this.selectedAvailableIndex.set(null);
    this.selectedSelectedIndex.set(null);
  }

  public total(): number {
    return this.getQuotation().accessories.reduce((total, item) => total + item.price * item.quantity, 0);
  }
}
