import { Component, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';

import { IconOfPipe } from '../../shared/icon';
import {
  SAVED_QUOTATIONS,
  SavedQuotationSummary,
  statusToneClasses,
} from './quotation.model';
import { ZarCurrencyPipe } from './zar-currency.pipe';

@Component({
  selector: 'app-quotation-search',
  standalone: true,
  imports: [FormsModule, IconOfPipe, LucideDynamicIcon, ZarCurrencyPipe],
  template: `
    <label class="block">
      <span class="field-label">Quotation No.</span>
      <div class="flex gap-2">
        <input
          class="detail-input bg-slate-50"
          placeholder="New quotation"
          [value]="quotationNumber()"
          readonly
        />
        <button
          type="button"
          class="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-slate-500 hover:bg-slate-50"
          aria-label="Search quotations"
          (click)="modalOpen.set(true)"
        >
          <svg [lucideIcon]="'search' | iconOf" class="w-3.5 h-3.5"></svg>
        </button>
      </div>
    </label>

    @if (modalOpen()) {
      <div class="fixed inset-0 z-50 bg-slate-950/30" role="dialog" aria-modal="true" aria-labelledby="quotationSearchTitle" (click)="modalOpen.set(false)">
        <div class="absolute inset-y-0 right-0 w-full md:w-[58vw] xl:w-1/2 overflow-y-auto bg-white border-l border-[#E5E7EB] shadow-2xl" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <div>
              <h2 id="quotationSearchTitle" class="text-[16px] font-semibold text-slate-900">Quotation Search</h2>
              <p class="text-[11px] text-slate-400 mt-0.5">Select a quotation to populate the complete workspace</p>
            </div>
            <button type="button" class="icon-button" aria-label="Close quotation search" (click)="modalOpen.set(false)">
              <svg [lucideIcon]="'x' | iconOf" class="w-4 h-4"></svg>
            </button>
          </div>
          <div class="p-5 space-y-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label class="block"><span class="field-label">Quotation No.</span><input class="detail-input" [(ngModel)]="searchNumber" /></label>
              <label class="block"><span class="field-label">Contact</span><input class="detail-input" [(ngModel)]="searchContact" /></label>
            </div>
            <div class="flex flex-wrap items-center gap-4 border-y border-[#F1F5F9] py-3">
              @for (status of statuses; track status) {
                <label class="inline-flex items-center gap-1.5 text-[12px] text-slate-600">
                  <input type="radio" [name]="'quotationStatus-' + instanceId" [value]="status" [checked]="searchStatus() === status" (change)="searchStatus.set(status)" class="text-blue-600" />{{ status }}
                </label>
              }
            </div>
            <div class="overflow-x-auto border border-[#E5E7EB] rounded-lg">
              <table class="w-full min-w-[900px] text-left">
                <thead class="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    @for (heading of headings; track heading) {
                      <th class="px-3 py-2.5 font-semibold">{{ heading }}</th>
                    }
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#F1F5F9]">
                  @for (row of searchResults(); track row.number) {
                    <tr class="hover:bg-slate-50 cursor-pointer" (click)="select(row)">
                      <td class="px-3 py-2 font-semibold text-blue-600">{{ row.number }}</td>
                      <td class="px-3 py-2">{{ row.customer }}</td>
                      <td class="px-3 py-2 text-slate-500">{{ row.phone }}</td>
                      <td class="px-3 py-2">{{ row.division }}</td>
                      <td class="px-3 py-2">{{ row.executive }}</td>
                      <td class="px-3 py-2">{{ row.model }}</td>
                      <td class="px-3 py-2 font-semibold">{{ row.total | zar }}</td>
                      <td class="px-3 py-2 text-slate-500">{{ row.date }}</td>
                      <td class="px-3 py-2"><span class="quotation-status-badge" [class]="statusTone(row.status)">{{ row.status }}</span></td>
                      <td class="px-3 py-2 text-slate-500">{{ row.reg }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class QuotationSearch {
  readonly quotationNumber = input('');
  readonly quotationSelected = output<SavedQuotationSummary>();

  protected readonly modalOpen = signal(false);
  protected readonly searchNumber = signal('');
  protected readonly searchContact = signal('');
  protected readonly searchStatus = signal('All');
  protected readonly statuses = ['All', 'Draft', 'Enquiry', 'Approved', 'Ordered', 'Cancelled', 'Lost'];
  protected readonly headings = ['Quotation No.', 'Customer', 'Phone', 'Division', 'Sales Executive', 'Model Name', 'Total', 'Date', 'Status', 'Reg Number'];
  protected readonly instanceId = Math.random().toString(36).slice(2);

  protected readonly searchResults = computed(() => {
    const number = this.searchNumber().trim().toLowerCase();
    const contact = this.searchContact().trim().toLowerCase();
    const status = this.searchStatus();
    return SAVED_QUOTATIONS.filter((row) => {
      const matchesNumber = !number || row.number.toLowerCase().includes(number);
      const matchesContact = !contact || row.customer.toLowerCase().includes(contact);
      const matchesStatus = status === 'All' || row.status === status;
      return matchesNumber && matchesContact && matchesStatus;
    });
  });

  protected select(row: SavedQuotationSummary): void {
    this.quotationSelected.emit(row);
    this.modalOpen.set(false);
  }

  protected statusTone(status: string): string {
    return statusToneClasses(status);
  }
}
