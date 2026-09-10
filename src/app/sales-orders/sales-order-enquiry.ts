import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';

import { IconOfPipe } from '../shared/icon';
import {
  ArchiveChange,
  EMPTY_SALES_ORDER_FILTERS,
  SalesOrderAgeBand,
  SalesOrderFilters,
  SalesOrderRecord,
  normalizeSalesOrderFilters,
  salesOrderAgeBand,
} from './sales-order.models';
import { CURRENT_SALES_BRANCH, SALES_ORDER_NOW, SalesOrderService } from './sales-order.service';

type ViewState = 'initial' | 'loading' | 'ready' | 'empty' | 'error';
type FeedbackTone = 'info' | 'success' | 'error';

interface Feedback {
  tone: FeedbackTone;
  message: string;
}

@Component({
  selector: 'app-sales-order-enquiry',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, IconOfPipe, LucideDynamicIcon, ReactiveFormsModule],
  templateUrl: './sales-order-enquiry.html',
  styleUrl: './sales-order-enquiry.css',
})
export class SalesOrderEnquiry {
  private readonly formBuilder = inject(FormBuilder);
  private readonly service = inject(SalesOrderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly now = inject(SALES_ORDER_NOW);
  private readonly router = inject(Router);

  protected readonly currentBranch = 'Avonbrook Motors';
  protected readonly customers = this.service.customers;
  protected readonly salespeople = this.service.salespeople;
  protected readonly rows = signal<readonly SalesOrderRecord[]>([]);
  protected readonly state = signal<ViewState>('initial');
  protected readonly feedback = signal<Feedback | null>(null);
  protected readonly selectedId = signal<number | null>(null);
  protected readonly archiveDrafts = signal<ReadonlyMap<number, boolean>>(new Map());
  protected readonly dirtyCount = computed(() => {
    const originals = new Map(this.rows().map((row) => [row.salesOrderId, row.isArchive]));
    return [...this.archiveDrafts()].filter(([id, value]) => originals.get(id) !== value).length;
  });

  protected readonly filterForm = this.formBuilder.group({
    ...EMPTY_SALES_ORDER_FILTERS,
    fromDate: this.today(),
    toDate: this.today(),
  });

  protected search(preserveFeedback = false): void {
    const normalized = normalizeSalesOrderFilters(
      this.filterForm.getRawValue() as SalesOrderFilters,
    );
    this.filterForm.setValue(normalized, { emitEvent: false });
    this.state.set('loading');
    this.selectedId.set(null);
    this.archiveDrafts.set(new Map());
    if (!preserveFeedback) {
      this.feedback.set(null);
    }

    this.service
      .search({
        ...normalized,
        branchCode: CURRENT_SALES_BRANCH,
        orderedOnly: true,
        unprocessedOnly: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.rows.set(rows);
          this.state.set(rows.length ? 'ready' : 'empty');
        },
        error: () => {
          this.rows.set([]);
          this.state.set('error');
          this.feedback.set({
            tone: 'error',
            message: 'Sales orders could not be loaded. Please try again.',
          });
        },
      });
  }

  protected normalizeRange(
    fromName: keyof SalesOrderFilters,
    toName: keyof SalesOrderFilters,
  ): void {
    const normalized = normalizeSalesOrderFilters(
      this.filterForm.getRawValue() as SalesOrderFilters,
    );
    this.filterForm.get(String(toName))?.setValue(normalized[toName]);
    this.filterForm.get(String(fromName))?.setValue(normalized[fromName]);
  }

  protected restrictNumericKey(event: KeyboardEvent): void {
    const editingKeys = new Set([
      'Backspace',
      'Delete',
      'Tab',
      'Enter',
      'Escape',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      ' ',
    ]);
    if (/^\d$/.test(event.key) || editingKeys.has(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }
    event.preventDefault();
  }

  protected selectRow(row: SalesOrderRecord): void {
    this.selectedId.set(row.salesOrderId);
    this.feedback.set(null);
  }

  protected chooseSelected(): void {
    const id = this.selectedId();
    if (id === null) {
      this.feedback.set({
        tone: 'info',
        message: 'No row is currently selected. Please click the Sales Order you wish to select.',
      });
      return;
    }
    void this.router.navigate(['/sales-orders', id], { queryParamsHandling: 'preserve' });
  }

  protected chooseRow(row: SalesOrderRecord): void {
    this.selectedId.set(row.salesOrderId);
    this.chooseSelected();
  }

  protected exit(): void {
    this.selectedId.set(null);
    this.archiveDrafts.set(new Map());
    this.feedback.set(null);
    void this.router.navigate(['/sales-orders/new'], { queryParamsHandling: 'preserve' });
  }

  protected archiveValue(row: SalesOrderRecord): boolean {
    return this.archiveDrafts().get(row.salesOrderId) ?? row.isArchive;
  }

  protected setArchive(row: SalesOrderRecord, isArchive: boolean): void {
    this.archiveDrafts.update((current) => {
      const next = new Map(current);
      next.set(row.salesOrderId, isArchive);
      return next;
    });
    this.feedback.set(null);
  }

  protected updateArchive(): void {
    const originals = new Map(this.rows().map((row) => [row.salesOrderId, row.isArchive]));
    const changes: ArchiveChange[] = [...this.archiveDrafts()]
      .filter(([id, value]) => originals.get(id) !== value)
      .map(([salesOrderId, isArchive]) => ({ salesOrderId, isArchive }));

    if (!changes.length) {
      this.feedback.set({ tone: 'info', message: 'Please select at least one record.' });
      return;
    }

    this.state.set('loading');
    this.service
      .updateArchive(changes)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.feedback.set({
            tone: 'success',
            message: 'The selected record(s) have been update successfully.',
          });
          this.search(true);
        },
        error: () => {
          this.state.set(this.rows().length ? 'ready' : 'empty');
          this.feedback.set({
            tone: 'error',
            message: 'Archive changes could not be saved. Please try again.',
          });
        },
      });
  }

  protected ageBand(row: SalesOrderRecord): SalesOrderAgeBand {
    return salesOrderAgeBand(row.salesOrderDate, this.now());
  }

  private today(): string {
    const value = new Date(this.now());
    const offset = value.getTimezoneOffset() * 60_000;
    return new Date(value.getTime() - offset).toISOString().slice(0, 10);
  }
}
