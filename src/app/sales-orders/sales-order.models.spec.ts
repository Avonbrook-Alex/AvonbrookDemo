import {
  EMPTY_SALES_ORDER_FILTERS,
  normalizeSalesOrderFilters,
  salesOrderAgeBand,
  calculateShowroomSalesOrderTotals,
  canConfirmShowroomSalesOrder,
} from './sales-order.models';
import { createBlankShowroomSalesOrder } from './sales-order.service';

describe('sales order filter normalization', () => {
  it('raises each upper bound to its lower bound', () => {
    const filters = normalizeSalesOrderFilters({
      ...EMPTY_SALES_ORDER_FILTERS,
      fromDate: '2026-09-07',
      toDate: '2026-09-01',
      fromOrderNumber: 20,
      toOrderNumber: 10,
      fromSalesOrderNumber: 40,
      toSalesOrderNumber: 30,
      fromQuotationNumber: 60,
      toQuotationNumber: 50,
      fromCustomerCode: 200,
      toCustomerCode: 100,
      fromSalespersonCode: 18,
      toSalespersonCode: 12,
    });

    expect(filters.toDate).toBe('2026-09-07');
    expect(filters.toOrderNumber).toBe(20);
    expect(filters.toSalesOrderNumber).toBe(40);
    expect(filters.toQuotationNumber).toBe(60);
    expect(filters.toCustomerCode).toBe(200);
    expect(filters.toSalespersonCode).toBe(18);
  });

  it('does not synthesize a missing upper bound', () => {
    const filters = normalizeSalesOrderFilters({
      ...EMPTY_SALES_ORDER_FILTERS,
      fromOrderNumber: 20,
    });
    expect(filters.toOrderNumber).toBeNull();
  });
});

describe('sales order age bands', () => {
  const now = new Date('2026-09-07T12:00:00');

  it.each([
    ['2026-08-08', 'under-30'],
    ['2026-08-07', 'over-30'],
    ['2026-07-09', 'over-30'],
    ['2026-07-08', 'over-60'],
    ['2026-06-09', 'over-60'],
    ['2026-06-08', 'over-90'],
  ] as const)('classifies %s using the strict legacy thresholds', (date, expected) => {
    expect(salesOrderAgeBand(date, now)).toBe(expected);
  });
});

describe('Showroom Sales Order rules', () => {
  it('calculates vehicle, accessories, trade-ins, settlements and finance balance', () => {
    const order = createBlankShowroomSalesOrder(new Date('2026-09-08T12:00:00'));
    order.vehicle.retailPrice = 40_000;
    order.vehicle.discount = 1_000;
    order.accessories = [
      { id: 1, code: 'A', description: 'Accessory', quantity: 2, retailPrice: 500 },
    ];
    order.tradeIns = [
      {
        id: 1,
        registration: '241-D-1',
        modelDescription: 'Trade',
        year: 2024,
        mileage: 10_000,
        allowance: 8_000,
        settlement: 2_000,
        discount: 500,
      },
    ];
    order.finance.deposit = 3_000;
    expect(calculateShowroomSalesOrderTotals(order)).toMatchObject({
      vehicleNet: 39_000,
      accessories: 1_000,
      gross: 40_000,
      tradeInAllowance: 8_000,
      settlements: 2_000,
      tradeInDiscount: 500,
      totalPayment: 34_500,
      balanceToFinance: 31_500,
    });
  });

  it('requires a stocked vehicle to confirm a complete open order', () => {
    const order = createBlankShowroomSalesOrder(new Date());
    order.vehicle.modelCode = 'MODEL';
    order.customer.firstName = 'Aisling';
    order.salesperson = 'Padraig Greenwood';
    expect(canConfirmShowroomSalesOrder(order)).toBe(false);
    order.vehicle.stockNumber = 'DUB-N-1';
    expect(canConfirmShowroomSalesOrder(order)).toBe(true);
  });

  it('requires finance provider, term and amount when finance is used', () => {
    const order = createBlankShowroomSalesOrder(new Date());
    order.vehicle.modelCode = 'MODEL';
    order.vehicle.stockNumber = 'DUB-N-1';
    order.customer.firstName = 'Aisling';
    order.salesperson = 'Padraig Greenwood';
    order.finance.required = true;
    order.finance.provider = 'Volkswagen Financial Services';
    order.finance.termMonths = 36;
    expect(canConfirmShowroomSalesOrder(order)).toBe(false);
    order.finance.amount = 25_000;
    expect(canConfirmShowroomSalesOrder(order)).toBe(true);
  });
});
