import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';

import { IconOfPipe } from '../../shared/icon';
import {
  MOCK_CUSTOMERS,
  MOCK_TRADE_INS,
  MOCK_VEHICLES,
  ACCESSORY_CATALOG,
  Quotation,
  QuotationAccessory,
  QuotationContact,
  QuotationTradeIn,
  QuotationVehicle,
} from './quotation.model';
import { ZarCurrencyPipe } from './zar-currency.pipe';

@Component({
  selector: 'app-quotation-entity-lookup',
  standalone: true,
  imports: [FormsModule, IconOfPipe, LucideDynamicIcon, ZarCurrencyPipe],
  template: `
    <button type="button" class="action-secondary" (click)="open.set(true)">
      <svg [lucideIcon]="'search' | iconOf" class="w-4 h-4"></svg>
      Look up {{ buttonLabel() }}
    </button>

    @if (open()) {
      <div class="fixed inset-0 z-50 bg-slate-950/30" role="dialog" aria-modal="true" (click)="open.set(false)">
        <aside class="absolute inset-y-0 right-0 w-full md:w-[58vw] xl:w-1/2 bg-white shadow-2xl flex flex-col" (click)="$event.stopPropagation()">
          <header class="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-[.12em] text-blue-600">Avonbrook Motors</p>
              <h2 class="text-lg font-bold text-slate-900 mt-1">{{ drawerTitle() }}</h2>
              <p class="text-xs text-slate-500 mt-1">Select a record to populate all connected quotation fields.</p>
            </div>
            <button type="button" class="icon-button" aria-label="Close lookup" (click)="open.set(false)">
              <svg [lucideIcon]="'x' | iconOf" class="w-5 h-5"></svg>
            </button>
          </header>
          <div class="p-6 border-b border-slate-100">
            <div class="relative">
              <svg [lucideIcon]="'search' | iconOf" class="absolute left-3 top-2.5 w-4 h-4 text-slate-400"></svg>
              <input class="detail-input is-editable pl-10" [(ngModel)]="query" [placeholder]="searchPlaceholder()" />
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            @if (kind() === 'customer') {
              @for (customer of customers(); track customer.contactId) {
                <button type="button" class="lookup-result" (click)="selectCustomer(customer)">
                  <span class="lookup-icon"><svg [lucideIcon]="'user-round' | iconOf" class="w-5 h-5"></svg></span>
                  <span class="min-w-0 text-left">
                    <strong class="block text-sm text-slate-900">{{ customer.company || (customer.firstName + ' ' + customer.surname) }}</strong>
                    <span class="block text-xs text-slate-500 mt-1">{{ customer.contactId }} · {{ customer.mobile }} · {{ customer.city }}</span>
                    <span class="block text-xs text-slate-400 mt-1 truncate">{{ customer.address1 }}, {{ customer.postCode }}</span>
                  </span>
                  <svg [lucideIcon]="'chevron-right' | iconOf" class="w-5 h-5 text-slate-300 ml-auto"></svg>
                </button>
              } @empty {
                <p class="p-8 text-center text-sm text-slate-500">No customers match this search. Close the drawer to enter a new customer.</p>
              }
            } @else if (kind() === 'vehicle') {
              @for (vehicle of vehicles(); track vehicle.stockNumber) {
                <button type="button" class="lookup-result" (click)="selectVehicle(vehicle)">
                  <span class="lookup-icon"><svg [lucideIcon]="'car' | iconOf" class="w-5 h-5"></svg></span>
                  <span class="min-w-0 text-left">
                    <strong class="block text-sm text-slate-900">{{ vehicle.modelDescription }}</strong>
                    <span class="block text-xs text-slate-500 mt-1">{{ vehicle.stockNumber }} · {{ vehicle.regNo }} · {{ vehicle.year }} · {{ vehicle.mileage }} km</span>
                    <span class="block text-xs text-slate-400 mt-1">{{ vehicle.colour }} · {{ vehicle.fuelType }} · {{ vehicle.bodyType }}</span>
                  </span>
                  <strong class="text-sm text-slate-900 ml-auto whitespace-nowrap">{{ vehicle.retailPrice | zar }}</strong>
                </button>
              } @empty {
                <p class="p-8 text-center text-sm text-slate-500">No available vehicles match this search.</p>
              }
            } @else if (kind() === 'accessory') {
              @for (accessory of accessories(); track accessory.code) {
                <button type="button" class="lookup-result" (click)="selectAccessory(accessory)">
                  <span class="lookup-icon"><svg [lucideIcon]="'package' | iconOf" class="w-5 h-5"></svg></span>
                  <span class="min-w-0 text-left">
                    <strong class="block text-sm text-slate-900">{{ accessory.description }}</strong>
                    <span class="block text-xs text-slate-500 mt-1">{{ accessory.code }} · Avonbrook approved accessory</span>
                  </span>
                  <strong class="text-sm text-slate-900 ml-auto">{{ accessory.price | zar }}</strong>
                </button>
              }
            } @else {
              @for (tradeIn of tradeIns(); track tradeIn.regNo) {
                <button type="button" class="lookup-result" (click)="selectTradeIn(tradeIn)">
                  <span class="lookup-icon"><svg [lucideIcon]="'swap-2' | iconOf" class="w-5 h-5"></svg></span>
                  <span class="min-w-0 text-left">
                    <strong class="block text-sm text-slate-900">{{ tradeIn.modelDescription }}</strong>
                    <span class="block text-xs text-slate-500 mt-1">{{ tradeIn.regNo }} · {{ tradeIn.mileage }} km · Valued by {{ tradeIn.valuer }}</span>
                    <span class="block text-xs text-slate-400 mt-1">{{ tradeIn.comments }}</span>
                  </span>
                  <strong class="text-sm text-slate-900 ml-auto">{{ tradeIn.estimatedValue | zar }}</strong>
                </button>
              }
            }
          </div>
        </aside>
      </div>
    }
  `,
})
export class QuotationEntityLookup {
  readonly quotation = input.required<Quotation>();
  readonly kind = input.required<'customer' | 'vehicle' | 'accessory' | 'tradein'>();
  readonly selected = output<void>();
  protected readonly open = signal(false);
  protected readonly query = signal('');

  protected readonly customers = computed(() => {
    const query = this.query().trim().toLowerCase();
    return MOCK_CUSTOMERS.filter((item) => !query || Object.values(item).some((value) => String(value ?? '').toLowerCase().includes(query)));
  });

  protected readonly vehicles = computed(() => {
    const query = this.query().trim().toLowerCase();
    return MOCK_VEHICLES.filter((item) => !query || Object.values(item).some((value) => String(value ?? '').toLowerCase().includes(query)));
  });

  protected readonly accessories = computed(() => {
    const query = this.query().trim().toLowerCase();
    return ACCESSORY_CATALOG.filter((item) => !query || `${item.code} ${item.description}`.toLowerCase().includes(query));
  });

  protected readonly tradeIns = computed(() => {
    const query = this.query().trim().toLowerCase();
    return MOCK_TRADE_INS.filter((item) => !query || Object.values(item).some((value) => String(value ?? '').toLowerCase().includes(query)));
  });

  protected buttonLabel(): string {
    return { customer: 'customer', vehicle: 'stock vehicle', accessory: 'accessory', tradein: 'trade-in vehicle' }[this.kind()];
  }

  protected drawerTitle(): string {
    return { customer: 'Customer lookup', vehicle: 'Available stock', accessory: 'Accessory catalogue', tradein: 'Trade-in vehicle lookup' }[this.kind()];
  }

  protected searchPlaceholder(): string {
    return { customer: 'Search name, code, phone or email', vehicle: 'Search model, registration, stock or colour', accessory: 'Search accessory code or description', tradein: 'Search registration, model or valuer' }[this.kind()];
  }

  protected selectCustomer(customer: QuotationContact): void {
    Object.assign(this.quotation().contact, customer);
    this.finish();
  }

  protected selectVehicle(vehicle: QuotationVehicle): void {
    Object.assign(this.quotation().vehicle, vehicle);
    this.quotation().header.franchise = vehicle.franchise ?? '';
    this.finish();
  }

  protected selectAccessory(accessory: QuotationAccessory): void {
    const existing = this.quotation().accessories.find((item) => item.code === accessory.code);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.quotation().accessories.push({ ...accessory });
    }
    this.finish();
  }

  protected selectTradeIn(tradeIn: QuotationTradeIn): void {
    Object.assign(this.quotation().tradeIn, tradeIn);
    this.finish();
  }

  private finish(): void {
    this.selected.emit();
    this.open.set(false);
    this.query.set('');
  }
}
