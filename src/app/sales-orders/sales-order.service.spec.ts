import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { EMPTY_SALES_ORDER_FILTERS } from './sales-order.models';
import {
  CURRENT_SALES_BRANCH,
  SALES_ORDER_NOW,
  SalesOrderService,
  createSalesOrderFixture,
} from './sales-order.service';

const FIXED_NOW = new Date('2026-09-07T12:00:00');

describe('SalesOrderService', () => {
  let service: SalesOrderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: SALES_ORDER_NOW, useValue: () => FIXED_NOW }],
    });
    service = TestBed.inject(SalesOrderService);
  });

  it('maps the query fixture including TotalPayment and age-boundary dates', () => {
    const rows = createSalesOrderFixture(FIXED_NOW);
    expect(rows.slice(0, 4).map((row) => row.salesOrderDate)).toEqual([
      '2026-09-07',
      '2026-08-07',
      '2026-07-08',
      '2026-06-08',
    ]);
    expect(rows[0].totalPayment).toBe(38_950);
  });

  it('returns only current-branch, ordered, unprocessed, unarchived records', async () => {
    const rows = await firstValueFrom(service.search(query()));
    expect(rows).toHaveLength(13);
    expect(rows.map((row) => row.salesOrderId)).toContain(5101);
    expect(rows.map((row) => row.salesOrderId)).toContain(5116);
    expect(rows.every((row) => row.branchCode === CURRENT_SALES_BRANCH)).toBe(true);
    expect(rows.every((row) => row.status === 'Ordered' && !row.processed && !row.isArchive)).toBe(
      true,
    );
  });

  it('includes archived records only when requested', async () => {
    const rows = await firstValueFrom(service.search(query({ showArchive: true })));
    expect(rows.map((row) => row.salesOrderId)).toContain(5105);
  });

  it('applies date, number, customer and salesperson ranges only with upper bounds', async () => {
    const rows = await firstValueFrom(
      service.search(
        query({
          fromDate: '2026-07-01',
          toDate: '2026-08-31',
          fromSalesOrderNumber: 5102,
          toSalesOrderNumber: 5103,
          fromCustomerCode: 200,
          toCustomerCode: 400,
          fromSalespersonCode: 18,
          toSalespersonCode: 27,
        }),
      ),
    );
    expect(rows.map((row) => row.salesOrderId)).toEqual([5102, 5103]);

    const ignoredLowerOnly = await firstValueFrom(
      service.search(query({ fromSalesOrderNumber: 9999 })),
    );
    expect(ignoredLowerOnly).toHaveLength(13);
  });

  it('persists archive changes through its typed contract', async () => {
    await firstValueFrom(service.updateArchive([{ salesOrderId: 5101, isArchive: true }]));
    const rows = await firstValueFrom(service.search(query()));
    expect(rows.map((row) => row.salesOrderId)).not.toContain(5101);
  });

  it('creates, reloads and amends a Showroom Sales Order with a stable id', async () => {
    const order = service.newOrder();
    order.vehicle = { ...service.vehicleCatalog[0] };
    order.customer = { ...service.customerCatalog[0] };
    order.driver = { ...order.customer };
    order.salesperson = service.salespeople[0].label;
    const saved = await firstValueFrom(service.saveOrder(order));
    expect(saved.id).not.toBeNull();
    const loaded = await firstValueFrom(service.loadOrder(saved.id!));
    loaded.comments = 'Amended';
    const amended = await firstValueFrom(service.saveOrder(loaded));
    expect(amended.id).toBe(saved.id);
    expect((await firstValueFrom(service.loadOrder(saved.id!))).comments).toBe('Amended');
  });

  it('loads enquiry records with the same Ordered state shown in search', async () => {
    const searched = await firstValueFrom(service.search(query({ showArchive: true })));
    const loaded = await firstValueFrom(service.loadOrder(5101));
    expect(searched.find((row) => row.salesOrderId === loaded.id)?.status).toBe('Ordered');
    expect(loaded.status).toBe('Ordered');
  });

  it('confirms only a complete open order with allocated stock', async () => {
    const order = service.newOrder();
    order.vehicle = { ...service.vehicleCatalog[0] };
    order.customer = { ...service.customerCatalog[0] };
    order.salesperson = service.salespeople[0].label;
    const confirmed = await firstValueFrom(service.confirmOrder(order));
    expect(confirmed.status).toBe('Ordered');
    await expect(firstValueFrom(service.markSaleLost(confirmed))).rejects.toThrow();
  });
});

function query(overrides: Partial<ReturnType<typeof queryBase>> = {}) {
  return { ...queryBase(), ...overrides };
}

function queryBase() {
  return {
    ...EMPTY_SALES_ORDER_FILTERS,
    branchCode: CURRENT_SALES_BRANCH,
    orderedOnly: true as const,
    unprocessedOnly: true as const,
  };
}
