import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';

import { IconOfPipe } from '../shared/icon';
import {
  ShowroomAccessory,
  ShowroomPerson,
  ShowroomSalesOrder,
  ShowroomTradeIn,
  calculateShowroomSalesOrderTotals,
  canConfirmShowroomSalesOrder,
  missingShowroomSalesOrderFields,
} from './sales-order.models';
import { SalesOrderService } from './sales-order.service';
import { SalesOrderEntityLookup } from './sales-order-entity-lookup';

type StageId = 'order' | 'accessories' | 'trade-ins' | 'customer' | 'finance' | 'review';
type LoadState = 'ready' | 'loading' | 'error';

interface Feedback {
  tone: 'success' | 'error' | 'info';
  message: string;
}

const STAGES: readonly { id: StageId; label: string; icon: string }[] = [
  { id: 'order', label: 'Order & Vehicle', icon: 'car' },
  { id: 'accessories', label: 'Accessories', icon: 'package' },
  { id: 'trade-ins', label: 'Trade-ins', icon: 'repeat-2' },
  { id: 'customer', label: 'Customer & Driver', icon: 'users' },
  { id: 'finance', label: 'Finance', icon: 'landmark' },
  { id: 'review', label: 'Review & Confirm', icon: 'clipboard-check' },
];

@Component({
  selector: 'app-sales-order-editor',
  standalone: true,
  imports: [CurrencyPipe, IconOfPipe, LucideDynamicIcon, ReactiveFormsModule, SalesOrderEntityLookup],
  templateUrl: './sales-order-editor.html',
  styleUrl: './sales-order-editor.css',
})
export class SalesOrderEditor {
  private readonly formBuilder = inject(FormBuilder);
  private readonly service = inject(SalesOrderService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly stages = STAGES;
  protected readonly activeStage = signal<StageId>('order');
  protected readonly checkedStages = signal<ReadonlySet<StageId>>(new Set());
  protected readonly loadState = signal<LoadState>('ready');
  protected readonly feedback = signal<Feedback | null>(null);
  protected readonly order = signal(this.service.newOrder());
  protected readonly revision = signal(0);
  protected readonly vehicleCatalog = this.service.vehicleCatalog;
  protected readonly accessoryCatalog = this.service.accessoryCatalog;
  protected readonly customerCatalog = this.service.customerCatalog;
  protected readonly salespeople = this.service.salespeople;
  protected readonly totals = computed(() => {
    this.revision();
    return calculateShowroomSalesOrderTotals(this.formValue());
  });
  protected readonly isReadOnly = computed(() => this.order().status !== 'Open');
  protected readonly canConfirm = computed(() => {
    this.revision();
    return (
      this.order().status === 'Open' &&
      this.form.valid &&
      canConfirmShowroomSalesOrder(this.formValue())
    );
  });

  protected readonly form = this.buildForm(this.order());

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.form.controls.driverSameAsCustomer.value) this.copyCustomerToDriver();
      this.revision.update((value) => value + 1);
      this.feedback.set(null);
    });
    this.syncDriverAvailability();

    const rawId = this.route.snapshot.paramMap.get('id');
    if (rawId && /^\d+$/.test(rawId)) this.load(Number(rawId));
  }

  protected setStage(stage: StageId): void {
    this.markStageChecked(this.activeStage());
    if (this.stageNumber(stage) > 1 && !this.canLeaveOrderStage()) return;
    this.activeStage.set(stage);
  }

  protected previousStage(): void {
    this.markStageChecked(this.activeStage());
    const index = STAGES.findIndex((stage) => stage.id === this.activeStage());
    if (index > 0) this.activeStage.set(STAGES[index - 1].id);
  }

  protected continueStage(): void {
    this.markStageChecked(this.activeStage());
    if (!this.canLeaveOrderStage()) return;
    const index = STAGES.findIndex((stage) => stage.id === this.activeStage());
    if (index < STAGES.length - 1) this.activeStage.set(STAGES[index + 1].id);
  }

  protected changeSaleType(event: Event): void {
    const saleType = (event.target as HTMLSelectElement).value as 'Retail' | 'Trade';
    if (saleType === 'Trade' && this.tradeIns.length) {
      this.form.controls.saleType.setValue('Retail');
      this.feedback.set({
        tone: 'error',
        message: 'Remove all trade-ins before changing this order to Trade.',
      });
    }
  }

  protected newOrder(): void {
    const order = this.service.newOrder();
    this.applyOrder(order);
    this.activeStage.set('order');
    this.feedback.set({ tone: 'info', message: 'A new Sales Order is ready.' });
    void this.router.navigate(['/sales-orders/new'], { queryParamsHandling: 'preserve' });
  }

  protected openSearch(): void {
    void this.router.navigate(['/sales-orders/search'], { queryParamsHandling: 'preserve' });
  }

  protected selectVehicle(vehicle: ShowroomSalesOrder['vehicle']): void {
    this.form.controls.vehicle.setValue({ ...vehicle });
  }

  protected clearVehicle(): void {
    this.form.controls.vehicle.setValue({ ...this.service.newOrder().vehicle });
  }

  protected addAccessory(item: ShowroomAccessory): void {
    const existing = this.accessories.controls.find(
      (group) => group.controls['code'].value === item.code,
    );
    if (existing) {
      existing.controls['quantity'].setValue((existing.controls['quantity'].value || 0) + 1);
    } else {
      this.accessories.push(this.accessoryGroup({ ...item, id: Date.now(), quantity: 1 }));
    }
  }

  protected removeAccessory(index: number): void {
    this.accessories.removeAt(index);
  }

  protected addTradeIn(): void {
    if (this.form.controls.saleType.value === 'Trade') {
      this.feedback.set({
        tone: 'error',
        message: 'Trade orders cannot contain trade-in vehicles.',
      });
      return;
    }
    this.tradeIns.push(
      this.tradeInGroup({
        id: Date.now(),
        registration: '',
        modelDescription: '',
        year: null,
        mileage: null,
        allowance: 0,
        settlement: 0,
        discount: 0,
      }),
    );
  }

  protected removeTradeIn(index: number): void {
    this.tradeIns.removeAt(index);
  }

  protected selectCustomer(customer: ShowroomPerson): void {
    this.form.controls.customer.setValue({ ...customer });
  }

  protected toggleDriverSame(): void {
    if (this.form.controls.driverSameAsCustomer.value) this.copyCustomerToDriver();
    this.syncDriverAvailability();
  }

  protected save(): void {
    if (this.isReadOnly()) return;
    const missing = missingShowroomSalesOrderFields(this.formValue());
    if (missing.length || this.form.invalid) {
      const details = missing.length ? missing.join(', ') : 'the invalid highlighted values';
      this.feedback.set({ tone: 'error', message: `Complete ${details} before saving.` });
      return;
    }
    this.service
      .saveOrder(this.formValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.applyOrder(saved);
          this.feedback.set({
            tone: 'success',
            message: `Sales Order ${saved.orderNumber} saved.`,
          });
          void this.router.navigate(['/sales-orders', saved.id], {
            queryParamsHandling: 'preserve',
            replaceUrl: true,
          });
        },
        error: () =>
          this.feedback.set({
            tone: 'error',
            message: 'The Sales Order could not be saved. Please try again.',
          }),
      });
  }

  protected confirm(): void {
    if (!this.canConfirm()) {
      this.feedback.set({
        tone: 'error',
        message: 'Select a stocked vehicle and complete the required details before confirming.',
      });
      return;
    }
    this.service
      .confirmOrder(this.formValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.applyOrder(saved);
          this.feedback.set({
            tone: 'success',
            message: `Sales Order ${saved.orderNumber} confirmed as Ordered.`,
          });
          void this.router.navigate(['/sales-orders', saved.id], {
            queryParamsHandling: 'preserve',
            replaceUrl: true,
          });
        },
        error: () =>
          this.feedback.set({ tone: 'error', message: 'The Sales Order could not be confirmed.' }),
      });
  }

  protected markLost(): void {
    if (this.isReadOnly()) return;
    this.service
      .markSaleLost(this.formValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.applyOrder(saved);
          this.feedback.set({
            tone: 'success',
            message: `Sales Order ${saved.orderNumber} marked as Lost.`,
          });
          void this.router.navigate(['/sales-orders', saved.id], {
            queryParamsHandling: 'preserve',
            replaceUrl: true,
          });
        },
        error: () =>
          this.feedback.set({
            tone: 'error',
            message: 'The Sales Order could not be marked as lost.',
          }),
      });
  }

  protected stageNumber(stage: StageId): number {
    return STAGES.findIndex((item) => item.id === stage) + 1;
  }

  protected scrollStages(event: WheelEvent, container: HTMLElement): void {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      container.scrollLeft += event.deltaY;
      event.preventDefault();
    }
  }

  protected isComplete(stage: StageId): boolean {
    return this.stageHasData(stage) && this.missingForStage(stage).length === 0;
  }

  protected isIncomplete(stage: StageId): boolean {
    return this.checkedStages().has(stage) && this.missingForStage(stage).length > 0;
  }

  private markStageChecked(stage: StageId): void {
    this.checkedStages.update((current) => new Set(current).add(stage));
  }

  private missingForStage(stage: StageId): string[] {
    const value = this.formValue();
    if (stage === 'order') return [!value.salesperson ? 'salesperson' : '', !value.vehicle.modelCode ? 'vehicle or model' : ''].filter(Boolean);
    if (stage === 'customer') return [!value.customer.firstName && !value.customer.company ? 'customer' : '', !value.driverSameAsCustomer && !value.driver.firstName && !value.driver.company ? 'driver' : ''].filter(Boolean);
    if (stage === 'finance' && value.finance.required) return [!value.finance.provider ? 'provider' : '', !value.finance.amount ? 'amount' : '', !value.finance.termMonths ? 'term' : ''].filter(Boolean);
    if (stage === 'review') return [!value.vehicle.stockNumber ? 'stocked vehicle' : ''].filter(Boolean);
    return [];
  }

  private stageHasData(stage: StageId): boolean {
    const value = this.formValue();
    if (stage === 'order') return Boolean(value.salesperson || value.vehicle.modelCode);
    if (stage === 'accessories') return this.checkedStages().has(stage) || value.accessories.length > 0;
    if (stage === 'trade-ins') return this.checkedStages().has(stage) || value.tradeIns.length > 0;
    if (stage === 'customer') return Boolean(value.customer.firstName || value.customer.company);
    if (stage === 'finance') return this.checkedStages().has(stage) || value.finance.required;
    return this.checkedStages().has(stage) || Boolean(value.comments || value.confirmedBy || value.dealerManager);
  }

  private canLeaveOrderStage(): boolean {
    if (this.activeStage() !== 'order') return true;
    const missing: string[] = [];
    if (!this.form.controls.salesperson.value) missing.push('salesperson');
    if (!this.form.controls.vehicle.controls.modelCode.value) missing.push('vehicle or model');
    if (!missing.length) return true;
    this.feedback.set({
      tone: 'error',
      message: `Select a ${missing.join(' and ')} before continuing.`,
    });
    return false;
  }

  private load(id: number): void {
    this.loadState.set('loading');
    this.service
      .loadOrder(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.applyOrder(order);
          this.loadState.set('ready');
        },
        error: () => {
          this.loadState.set('error');
          this.feedback.set({
            tone: 'error',
            message: 'The requested Sales Order could not be loaded.',
          });
        },
      });
  }

  private applyOrder(order: ShowroomSalesOrder): void {
    this.order.set(order);
    this.form.reset(order, { emitEvent: false });
    this.accessories.clear({ emitEvent: false });
    order.accessories.forEach((item) =>
      this.accessories.push(this.accessoryGroup(item), { emitEvent: false }),
    );
    this.tradeIns.clear({ emitEvent: false });
    order.tradeIns.forEach((item) =>
      this.tradeIns.push(this.tradeInGroup(item), { emitEvent: false }),
    );
    order.status === 'Open'
      ? this.form.enable({ emitEvent: false })
      : this.form.disable({ emitEvent: false });
    this.checkedStages.set(order.id ? new Set(STAGES.map((stage) => stage.id)) : new Set());
    this.syncDriverAvailability();
    this.revision.update((value) => value + 1);
  }

  private copyCustomerToDriver(): void {
    this.form.controls.driver.setValue(this.form.controls.customer.getRawValue(), {
      emitEvent: false,
    });
  }

  private syncDriverAvailability(): void {
    if (this.isReadOnly() || this.form.controls.driverSameAsCustomer.value) {
      this.form.controls.driver.disable({ emitEvent: false });
    } else {
      this.form.controls.driver.enable({ emitEvent: false });
    }
  }

  private formValue(): ShowroomSalesOrder {
    return {
      ...this.form.getRawValue(),
      id: this.order().id,
      status: this.order().status,
    } as ShowroomSalesOrder;
  }

  private buildForm(order: ShowroomSalesOrder) {
    return this.formBuilder.group({
      id: [order.id],
      orderNumber: [order.orderNumber],
      quotationNumber: [order.quotationNumber],
      status: [order.status],
      saleType: [order.saleType],
      division: [order.division],
      orderDate: [order.orderDate],
      requiredDeliveryDate: [order.requiredDeliveryDate],
      salesperson: [order.salesperson, Validators.required],
      businessManager: [order.businessManager],
      source: [order.source],
      vehicle: this.formBuilder.group(order.vehicle),
      accessories: this.formBuilder.array(
        order.accessories.map((item) => this.accessoryGroup(item)),
      ),
      tradeIns: this.formBuilder.array(order.tradeIns.map((item) => this.tradeInGroup(item))),
      customer: this.formBuilder.group(order.customer),
      driverSameAsCustomer: [order.driverSameAsCustomer],
      driver: this.formBuilder.group(order.driver),
      finance: this.formBuilder.group(order.finance),
      comments: [order.comments],
      confirmedBy: [order.confirmedBy],
      dealerManager: [order.dealerManager],
    });
  }

  private accessoryGroup(item: ShowroomAccessory): FormGroup {
    return this.formBuilder.group({
      id: [item.id],
      code: [item.code],
      description: [item.description, Validators.required],
      quantity: [item.quantity, [Validators.required, Validators.min(1)]],
      retailPrice: [item.retailPrice, Validators.min(0)],
    });
  }

  private tradeInGroup(item: ShowroomTradeIn): FormGroup {
    return this.formBuilder.group({
      id: [item.id],
      registration: [item.registration],
      modelDescription: [item.modelDescription],
      year: [item.year],
      mileage: [item.mileage],
      allowance: [item.allowance, Validators.min(0)],
      settlement: [item.settlement, Validators.min(0)],
      discount: [item.discount, Validators.min(0)],
    });
  }

  protected get accessories(): FormArray<FormGroup> {
    return this.form.controls.accessories;
  }
  protected get tradeIns(): FormArray<FormGroup> {
    return this.form.controls.tradeIns;
  }
}
