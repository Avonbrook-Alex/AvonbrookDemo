import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';

import { IconOfPipe } from '../../shared/icon';
import { createBlankQuotation, populateFromSavedQuotation, SAVED_QUOTATIONS, SavedQuotationSummary, statusToneClasses } from './quotation.model';
import { ZarCurrencyPipe } from './zar-currency.pipe';

@Component({
  selector: 'app-quotation-search-page',
  standalone: true,
  imports: [FormsModule, IconOfPipe, LucideDynamicIcon, ZarCurrencyPipe],
  template: `
    <div class="flex-1 overflow-y-auto no-sb bg-[#F8FAFC]">
      <div class="max-w-[1700px] mx-auto px-6 py-5 space-y-4">
        <section class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <svg [lucideIcon]="'search' | iconOf" class="w-5 h-5 text-blue-600"></svg>
          </div>
          <div>
            <h1 class="text-[20px] font-bold text-slate-900">Search Quotes</h1>
            <p class="text-[12px] text-slate-500 mt-1">Find a quotation, review its details, then choose how you want to edit it.</p>
          </div>
        </section>

        <section class="quotation-card p-4 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <label><span class="field-label">Quotation No.</span><input class="detail-input" [(ngModel)]="numberFilter" placeholder="e.g. Q-10482" /></label>
            <label><span class="field-label">Customer</span><input class="detail-input" [(ngModel)]="customerFilter" placeholder="Name or company" /></label>
            <label><span class="field-label">Division</span><select class="detail-input" [(ngModel)]="divisionFilter"><option value="">All divisions</option><option>Avonbrook Motors</option><option>City Motors</option></select></label>
            <label><span class="field-label">Sales Executive</span><select class="detail-input" [(ngModel)]="executiveFilter"><option value="">All executives</option><option>Padraig Greenwood</option><option>Sarah Nolan</option></select></label>
            <label><span class="field-label">Status</span><select class="detail-input" [(ngModel)]="statusFilter"><option value="">All statuses</option>@for (status of statuses; track status) { <option>{{ status }}</option> }</select></label>
          </div>
        </section>

        <section class="quotation-card overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 class="text-[14px] font-bold text-slate-900">Available quotations</h2>
            <span class="text-[11px] text-slate-500">{{ results().length }} results</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[1280px] text-left text-[12px] whitespace-nowrap">
              <thead class="quotation-table-head">
                <tr><th>Quotation No.</th><th>Customer</th><th>Phone</th><th>Division</th><th>Sales Executive</th><th>Model Name</th><th>Total</th><th>Date</th><th>Status</th><th>Reg Number</th></tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (row of results(); track row.number) {
                  <tr class="hover:bg-blue-50/50 cursor-pointer" [class.bg-blue-50]="selectedNumber() === row.number" (click)="select(row)">
                    <td class="px-3 py-3 font-bold text-blue-600">{{ row.number }}</td>
                    <td class="px-3 py-3 font-semibold">{{ row.customer }}</td>
                    <td class="px-3 py-3">{{ row.phone }}</td>
                    <td class="px-3 py-3">{{ row.division }}</td>
                    <td class="px-3 py-3">{{ row.executive }}</td>
                    <td class="px-3 py-3">{{ row.model }}</td>
                    <td class="px-3 py-3 font-semibold tabular-nums">{{ row.total | zar }}</td>
                    <td class="px-3 py-3 tabular-nums">{{ row.date }}</td>
                    <td class="px-3 py-3"><span class="quotation-status-badge" [class]="statusTone(row.status)">{{ row.status }}</span></td>
                    <td class="px-3 py-3">{{ row.reg }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        @if (selected(); as quote) {
          <div class="fixed inset-0 z-50 bg-slate-950/30 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Quotation details" (click)="selected.set(null)">
          <section class="w-full max-w-[1000px] max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl" (click)="$event.stopPropagation()">
            <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-[16px] font-bold text-slate-900">{{ quote.header.number }}</h2>
                  <span class="quotation-status-badge" [class]="statusTone(quote.header.status)">{{ quote.header.status }}</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Complete quotation details</p>
              </div>
              <div class="flex gap-2">
                <button type="button" class="action-primary" (click)="edit('guided')"><svg [lucideIcon]="'clipboard-list' | iconOf" class="w-3.5 h-3.5"></svg>Edit in Guided</button>
                <button type="button" class="action-primary" (click)="edit('staged')"><svg [lucideIcon]="'sparkles' | iconOf" class="w-3.5 h-3.5"></svg>Edit in Staged</button>
                <button type="button" class="icon-button" aria-label="Close quotation details" (click)="selected.set(null)"><svg [lucideIcon]="'x' | iconOf" class="w-4 h-4"></svg></button>
              </div>
            </div>
            <div class="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 text-[12px]">
              <div class="space-y-3">
                <h3 class="font-bold text-slate-900">Customer</h3>
                <dl class="detail-list">
                  <div><dt>Name</dt><dd>{{ customerName(quote) }}</dd></div>
                  <div><dt>Phone</dt><dd>{{ quote.contact.mobile || '—' }}</dd></div>
                  <div><dt>Email</dt><dd>{{ quote.contact.email || '—' }}</dd></div>
                  <div><dt>Address</dt><dd>{{ quote.contact.address1 || '—' }}</dd></div>
                </dl>
              </div>
              <div class="space-y-3">
                <h3 class="font-bold text-slate-900">Quotation</h3>
                <dl class="detail-list">
                  <div><dt>Division</dt><dd>{{ quote.header.division }}</dd></div>
                  <div><dt>Sales executive</dt><dd>{{ quote.header.executive }}</dd></div>
                  <div><dt>Franchise</dt><dd>{{ quote.header.franchise || '—' }}</dd></div>
                  <div><dt>Date</dt><dd>{{ quote.header.date }}</dd></div>
                </dl>
              </div>
              <div class="space-y-3">
                <h3 class="font-bold text-slate-900">Vehicle</h3>
                <dl class="detail-list">
                  <div><dt>Model</dt><dd>{{ quote.vehicle.modelDescription || '—' }}</dd></div>
                  <div><dt>Stock number</dt><dd>{{ quote.vehicle.stockNumber || '—' }}</dd></div>
                  <div><dt>Registration</dt><dd>{{ quote.vehicle.regNo || '—' }}</dd></div>
                  <div><dt>Colour</dt><dd>{{ quote.vehicle.colour || '—' }}</dd></div>
                </dl>
              </div>
              <div class="space-y-3">
                <h3 class="font-bold text-slate-900">Trade-in</h3>
                <dl class="detail-list">
                  <div><dt>Model</dt><dd>{{ quote.tradeIn.modelDescription || 'None' }}</dd></div>
                  <div><dt>Registration</dt><dd>{{ quote.tradeIn.regNo || '—' }}</dd></div>
                  <div><dt>Estimated value</dt><dd>{{ quote.tradeIn.estimatedValue || 0 | zar }}</dd></div>
                </dl>
              </div>
              <div class="space-y-3">
                <h3 class="font-bold text-slate-900">Accessories & finance</h3>
                <dl class="detail-list">
                  <div><dt>Accessories</dt><dd>{{ quote.accessories.length }}</dd></div>
                  <div><dt>Provider</dt><dd>{{ quote.finance.provider || 'Not specified' }}</dd></div>
                  <div><dt>Monthly payment</dt><dd>{{ quote.finance.monthlyPayment | zar }}</dd></div>
                </dl>
              </div>
              <div class="space-y-3">
                <h3 class="font-bold text-slate-900">Pricing</h3>
                <dl class="detail-list">
                  <div><dt>Vehicle retail</dt><dd>{{ quote.pricing.vehicleRetail | zar }}</dd></div>
                  <div><dt>Deposit</dt><dd>{{ quote.pricing.deposit | zar }}</dd></div>
                  <div><dt>Total payment</dt><dd class="font-bold text-blue-700">{{ quote.pricing.totalPayment | zar }}</dd></div>
                </dl>
              </div>
              <div class="lg:col-span-3">
                <h3 class="font-bold text-slate-900 mb-2">Notes</h3>
                <p class="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-slate-600">{{ quote.comments || 'No notes recorded.' }}</p>
              </div>
            </div>
          </section>
          </div>
        }
      </div>
    </div>
  `,
})
export class QuotationSearchPage {
  private readonly router = inject(Router);
  protected readonly statuses = ['Draft', 'Enquiry', 'Approved', 'Ordered', 'Cancelled', 'Lost'];
  protected readonly numberFilter = signal('');
  protected readonly customerFilter = signal('');
  protected readonly divisionFilter = signal('');
  protected readonly executiveFilter = signal('');
  protected readonly statusFilter = signal('');
  protected readonly selectedNumber = signal('');
  protected readonly selected = signal<ReturnType<typeof createBlankQuotation> | null>(null);

  protected readonly results = computed(() => SAVED_QUOTATIONS.filter((row) =>
    (!this.numberFilter() || row.number.toLowerCase().includes(this.numberFilter().toLowerCase())) &&
    (!this.customerFilter() || row.customer.toLowerCase().includes(this.customerFilter().toLowerCase())) &&
    (!this.divisionFilter() || row.division === this.divisionFilter()) &&
    (!this.executiveFilter() || row.executive === this.executiveFilter()) &&
    (!this.statusFilter() || row.status === this.statusFilter())
  ));

  protected select(row: SavedQuotationSummary): void {
    const quotation = createBlankQuotation();
    populateFromSavedQuotation(quotation, row);
    this.selectedNumber.set(row.number);
    this.selected.set(quotation);
  }

  protected edit(variant: 'guided' | 'staged'): void {
    void this.router.navigate(['/quotation', variant, 'quote', this.selectedNumber()], {
      queryParamsHandling: 'preserve',
    });
  }

  protected customerName(quote: ReturnType<typeof createBlankQuotation>): string {
    return [quote.contact.firstName, quote.contact.surname].filter(Boolean).join(' ') || quote.contact.company || '—';
  }

  protected statusTone(status: string): string {
    return statusToneClasses(status);
  }
}
