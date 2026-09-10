import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { IconOfPipe } from '../shared/icon';
import { ShowroomAccessory, ShowroomPerson, ShowroomVehicle } from './sales-order.models';

export type SalesOrderLookupItem = ShowroomVehicle | ShowroomAccessory | Omit<ShowroomAccessory, 'id' | 'quantity'> | ShowroomPerson;

@Component({
  selector: 'app-sales-order-entity-lookup', standalone: true,
  imports: [FormsModule, IconOfPipe, LucideDynamicIcon],
  template: `
    <button type="button" class="action-secondary" [disabled]="disabled()" (click)="open.set(true)"><svg [lucideIcon]="'search' | iconOf" class="w-4 h-4"></svg>Look up {{ label() }}</button>
    @if (open()) {
      <div class="fixed inset-0 z-50 bg-slate-950/30" role="dialog" aria-modal="true" (click)="close()">
        <aside class="absolute inset-y-0 right-0 w-full md:w-[58vw] xl:w-1/2 bg-white shadow-2xl flex flex-col" (click)="$event.stopPropagation()">
          <header class="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4"><div><p class="text-[11px] font-bold uppercase tracking-[.12em] text-blue-600">Avonbrook Motors</p><h2 class="text-lg font-bold text-slate-900 mt-1">{{ title() }}</h2><p class="text-xs text-slate-500 mt-1">Select a record to populate the connected Sales Order fields.</p></div><button type="button" class="icon-button" aria-label="Close lookup" (click)="close()"><svg [lucideIcon]="'x' | iconOf" class="w-5 h-5"></svg></button></header>
          <div class="p-6 border-b border-slate-100"><div class="relative"><svg [lucideIcon]="'search' | iconOf" class="absolute left-3 top-2.5 w-4 h-4 text-slate-400"></svg><input class="detail-input is-editable pl-10" [(ngModel)]="query" [placeholder]="placeholder()" /></div></div>
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            @for (item of filteredItems(); track trackItem(item)) {
              <button type="button" class="lookup-result" (click)="choose(item)"><span class="lookup-icon"><svg [lucideIcon]="icon() | iconOf" class="w-5 h-5"></svg></span><span class="min-w-0 text-left"><strong class="block text-sm text-slate-900">{{ itemTitle(item) }}</strong><span class="block text-xs text-slate-500 mt-1">{{ itemMeta(item) }}</span></span><strong class="text-sm text-slate-900 ml-auto whitespace-nowrap">{{ itemValue(item) }}</strong></button>
            } @empty { <p class="p-8 text-center text-sm text-slate-500">No matching records.</p> }
          </div>
        </aside>
      </div>
    }
  `,
})
export class SalesOrderEntityLookup {
  readonly kind = input.required<'vehicle' | 'customer' | 'accessory'>();
  readonly items = input.required<readonly SalesOrderLookupItem[]>();
  readonly disabled = input(false);
  readonly selected = output<SalesOrderLookupItem>();
  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly filteredItems = computed(() => { const q = this.query().trim().toLowerCase(); return this.items().filter((item) => !q || Object.values(item).some((value) => String(value ?? '').toLowerCase().includes(q))); });
  protected label(): string { return { vehicle: 'stock vehicle or model', customer: 'customer', accessory: 'accessory' }[this.kind()]; }
  protected title(): string { return { vehicle: 'Available stock and models', customer: 'Customer lookup', accessory: 'Accessory catalogue' }[this.kind()]; }
  protected placeholder(): string { return { vehicle: 'Search model, registration, stock or colour', customer: 'Search name, code, phone or email', accessory: 'Search code or description' }[this.kind()]; }
  protected icon(): string { return { vehicle: 'car', customer: 'user-round', accessory: 'package' }[this.kind()]; }
  protected itemTitle(item: SalesOrderLookupItem): string { if ('modelCode' in item) return item.modelDescription; if ('retailPrice' in item) return item.description; return item.company || `${item.firstName} ${item.surname}`; }
  protected itemMeta(item: SalesOrderLookupItem): string { if ('modelCode' in item) return `${item.stockNumber || 'Model order'} · ${item.registration || item.modelCode} · ${item.colour || 'Colour not set'}`; if ('retailPrice' in item) return `${item.code} · Avonbrook approved accessory`; return `${item.customerCode} · ${item.mobile} · ${item.city}`; }
  protected itemValue(item: SalesOrderLookupItem): string { const price = 'modelCode' in item ? item.retailPrice : 'retailPrice' in item ? item.retailPrice : null; return price === null ? '' : new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(price); }
  protected trackItem(item: SalesOrderLookupItem): string | number { if ('modelCode' in item) return `${item.stockNumber}|${item.modelCode}`; if ('retailPrice' in item) return item.code; return item.customerCode; }
  protected choose(item: SalesOrderLookupItem): void { this.selected.emit(item); this.close(); }
  protected close(): void { this.open.set(false); this.query.set(''); }
}
