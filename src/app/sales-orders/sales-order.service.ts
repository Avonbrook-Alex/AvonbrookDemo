import { InjectionToken, Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import {
  ArchiveChange,
  SalesOrderLookup,
  SalesOrderQuery,
  SalesOrderRecord,
  ShowroomAccessory,
  ShowroomPerson,
  ShowroomSalesOrder,
  ShowroomVehicle,
  calculateShowroomSalesOrderTotals,
  canConfirmShowroomSalesOrder,
} from './sales-order.models';

export const SALES_ORDER_NOW = new InjectionToken<() => Date>('SALES_ORDER_NOW', {
  providedIn: 'root',
  factory: () => () => new Date(),
});

export const CURRENT_SALES_BRANCH = 'DUB01';

@Injectable({ providedIn: 'root' })
export class SalesOrderService {
  private readonly now = inject(SALES_ORDER_NOW);
  private records = createSalesOrderFixture(this.now());
  private showroomOrders = createShowroomSalesOrderFixture(this.now());
  private nextSalesOrderId = Math.max(...this.records.map((row) => row.salesOrderId)) + 1;

  readonly customers: readonly SalesOrderLookup[] = [
    { code: 101, label: 'Aisling Byrne' },
    { code: 205, label: 'Cormac Murphy' },
    { code: 314, label: 'Doyle Construction Ltd' },
    { code: 427, label: 'Niamh O’Connor' },
  ];

  readonly salespeople: readonly SalesOrderLookup[] = [
    { code: 12, label: 'Padraig Greenwood' },
    { code: 18, label: 'Sarah Nolan' },
    { code: 27, label: 'Liam Kelly' },
  ];

  readonly vehicleCatalog: readonly ShowroomVehicle[] = [
    vehicle(
      'DUB-N-1042',
      'SK-OCT-STYLE',
      'Skoda Octavia Style 1.5 TSI',
      '251-D-1042',
      'TMBJR7NE8S0124102',
      'Graphite Grey',
      2026,
      12,
      38_950,
    ),
    vehicle(
      'DUB-N-1088',
      'VW-ID4-PRO',
      'Volkswagen ID.4 Pro',
      '',
      'WVGZZZE2ZSP041088',
      'Glacier White',
      2026,
      8,
      49_870,
    ),
    vehicle(
      'DUB-U-0874',
      'AU-A3-SLINE',
      'Audi A3 Sportback S line',
      '241-D-874',
      'WAUZZZGY4RA084874',
      'Mythos Black',
      2024,
      18_420,
      42_500,
    ),
    vehicle(
      '',
      'SK-KOD-SPORT',
      'Skoda Kodiaq Sportline (model order)',
      '',
      '',
      '',
      null,
      null,
      57_495,
    ),
  ];

  readonly accessoryCatalog: readonly Omit<ShowroomAccessory, 'id' | 'quantity'>[] = [
    { code: 'ACC-TOW', description: 'Detachable tow bar', retailPrice: 1_095 },
    { code: 'ACC-MATS', description: 'Premium carpet mat set', retailPrice: 145 },
    { code: 'ACC-PACK', description: 'Protection pack', retailPrice: 625 },
    { code: 'ACC-CAM', description: 'Front and rear dash camera', retailPrice: 495 },
  ];

  readonly customerCatalog: readonly ShowroomPerson[] = [
    person(
      '101',
      'Ms',
      'Aisling',
      'Byrne',
      '',
      '087 410 2240',
      'aisling.byrne@example.ie',
      '18 Cedar Grove',
      'Dublin',
      'D04 X2Y8',
    ),
    person(
      '205',
      'Mr',
      'Cormac',
      'Murphy',
      '',
      '086 241 9062',
      'cormac.murphy@example.ie',
      '7 Coast Road',
      'Malahide',
      'K36 R2F8',
    ),
    person(
      '314',
      '',
      '',
      '',
      'Doyle Construction Ltd',
      '01 614 8210',
      'fleet@doyleconstruction.example',
      '44 Park West',
      'Dublin',
      'D12 H9P6',
    ),
  ];

  search(query: SalesOrderQuery): Observable<readonly SalesOrderRecord[]> {
    const rows = this.records
      .filter((row) => row.branchCode === query.branchCode)
      .filter((row) => !query.orderedOnly || row.status === 'Ordered')
      .filter((row) => !query.unprocessedOnly || !row.processed)
      .filter((row) => query.showArchive || !row.isArchive)
      .filter((row) => inDateRange(row.salesOrderDate, query.fromDate, query.toDate))
      .filter((row) => inRange(row.orderNumber, query.fromOrderNumber, query.toOrderNumber))
      .filter((row) =>
        inRange(row.salesOrderId, query.fromSalesOrderNumber, query.toSalesOrderNumber),
      )
      .filter((row) =>
        inRange(row.quotationNumber, query.fromQuotationNumber, query.toQuotationNumber),
      )
      .filter((row) => inRange(row.customerCode, query.fromCustomerCode, query.toCustomerCode))
      .filter((row) =>
        inRange(row.salespersonCode, query.fromSalespersonCode, query.toSalespersonCode),
      )
      .map((row) => ({ ...row }));

    return of(rows);
  }

  updateArchive(changes: readonly ArchiveChange[]): Observable<void> {
    if (changes.length === 0) {
      return throwError(() => new Error('At least one archive change is required.'));
    }
    const requested = new Map(changes.map((change) => [change.salesOrderId, change.isArchive]));
    this.records = this.records.map((row) =>
      requested.has(row.salesOrderId)
        ? { ...row, isArchive: requested.get(row.salesOrderId)! }
        : row,
    );
    return of(undefined);
  }

  newOrder(): ShowroomSalesOrder {
    return createBlankShowroomSalesOrder(this.now());
  }

  loadOrder(id: number): Observable<ShowroomSalesOrder> {
    const stored = this.showroomOrders.find((order) => order.id === id);
    if (stored) return of(cloneOrder(stored));

    const summary = this.records.find((record) => record.salesOrderId === id);
    return summary
      ? of(orderFromEnquiryRecord(summary, this.now()))
      : throwError(() => new Error('Sales order was not found.'));
  }

  saveOrder(order: ShowroomSalesOrder): Observable<ShowroomSalesOrder> {
    const saved = cloneOrder(order);
    if (saved.id === null) {
      saved.id = this.nextSalesOrderId++;
      saved.orderNumber = `SO-${saved.id}`;
    }
    const index = this.showroomOrders.findIndex((item) => item.id === saved.id);
    if (index === -1) this.showroomOrders = [...this.showroomOrders, cloneOrder(saved)];
    else
      this.showroomOrders = this.showroomOrders.map((item, itemIndex) =>
        itemIndex === index ? cloneOrder(saved) : item,
      );
    if (saved.status === 'Ordered') this.upsertEnquiryRecord(saved);
    return of(saved);
  }

  confirmOrder(order: ShowroomSalesOrder): Observable<ShowroomSalesOrder> {
    if (order.status !== 'Open' || !canConfirmShowroomSalesOrder(order)) {
      return throwError(() => new Error('The open sales order is not ready to confirm.'));
    }
    return this.saveOrder({ ...order, status: 'Ordered' });
  }

  markSaleLost(order: ShowroomSalesOrder): Observable<ShowroomSalesOrder> {
    if (order.status !== 'Open') {
      return throwError(() => new Error('Only an open sales order can be marked lost.'));
    }
    return this.saveOrder({ ...order, status: 'Lost' });
  }

  private upsertEnquiryRecord(order: ShowroomSalesOrder): void {
    const id = order.id!;
    const customer =
      order.customer.company ||
      [order.customer.firstName, order.customer.surname].filter(Boolean).join(' ');
    const record: SalesOrderRecord = {
      salesOrderId: id,
      branchCode: CURRENT_SALES_BRANCH,
      division: order.division,
      orderNumber: id + 75_000,
      quotationNumber: Number(order.quotationNumber.replace(/\D/g, '')) || 0,
      customerCode: Number(order.customer.customerCode) || 0,
      customer,
      salespersonCode:
        this.salespeople.find((person) => person.label === order.salesperson)?.code ?? 0,
      employee: order.salesperson,
      modelName: order.vehicle.modelDescription,
      totalPayment: calculateShowroomSalesOrderTotals(order).totalPayment,
      salesOrderDate: order.orderDate,
      isArchive: false,
      status: 'Ordered',
      processed: false,
    };
    const exists = this.records.some((item) => item.salesOrderId === id);
    this.records = exists
      ? this.records.map((item) => (item.salesOrderId === id ? record : item))
      : [...this.records, record];
  }
}

export function createBlankShowroomSalesOrder(now: Date): ShowroomSalesOrder {
  return {
    id: null,
    orderNumber: 'New sales order',
    quotationNumber: '',
    status: 'Open',
    saleType: 'Retail',
    division: 'Avonbrook Motors',
    orderDate: localDate(now),
    requiredDeliveryDate: '',
    salesperson: '',
    businessManager: '',
    source: 'Showroom',
    vehicle: vehicle('', '', '', '', '', '', null, null, 0),
    accessories: [],
    tradeIns: [],
    customer: person('', '', '', '', '', '', '', '', '', ''),
    driverSameAsCustomer: true,
    driver: person('', '', '', '', '', '', '', '', '', ''),
    finance: {
      required: false,
      provider: '',
      agreementNumber: '',
      termMonths: null,
      amount: 0,
      interestRate: null,
      deposit: 0,
      monthlyPayment: 0,
    },
    comments: '',
    confirmedBy: '',
    dealerManager: '',
  };
}

export function createShowroomSalesOrderFixture(now: Date): ShowroomSalesOrder[] {
  const first = createBlankShowroomSalesOrder(now);
  first.id = 5101;
  first.orderNumber = 'SO-5101';
  first.quotationNumber = 'Q-4101';
  first.status = 'Ordered';
  first.requiredDeliveryDate = localDate(new Date(now.getTime() + 7 * 86_400_000));
  first.salesperson = 'Padraig Greenwood';
  first.businessManager = 'Sarah Nolan';
  first.vehicle = vehicle(
    'DUB-N-1042',
    'SK-OCT-STYLE',
    'Skoda Octavia Style 1.5 TSI',
    '251-D-1042',
    'TMBJR7NE8S0124102',
    'Graphite Grey',
    2026,
    12,
    38_950,
  );
  first.accessories = [
    {
      id: 1,
      code: 'ACC-MATS',
      description: 'Premium carpet mat set',
      quantity: 1,
      retailPrice: 145,
    },
  ];
  first.customer = person(
    '101',
    'Ms',
    'Aisling',
    'Byrne',
    '',
    '087 410 2240',
    'aisling.byrne@example.ie',
    '18 Cedar Grove',
    'Dublin',
    'D04 X2Y8',
  );
  first.driver = { ...first.customer };

  const second = createBlankShowroomSalesOrder(now);
  second.id = 5102;
  second.orderNumber = 'SO-5102';
  second.quotationNumber = 'Q-4102';
  second.status = 'Ordered';
  second.salesperson = 'Sarah Nolan';
  second.vehicle = vehicle(
    '',
    'SK-KOD-SPORT',
    'Skoda Kodiaq Sportline (model order)',
    '',
    '',
    '',
    null,
    null,
    57_495,
  );
  second.customer = person(
    '205',
    'Mr',
    'Cormac',
    'Murphy',
    '',
    '086 241 9062',
    'cormac.murphy@example.ie',
    '7 Coast Road',
    'Malahide',
    'K36 R2F8',
  );
  second.driver = { ...second.customer };
  return [first, second];
}

export function createSalesOrderFixture(now: Date): SalesOrderRecord[] {
  const date = (daysAgo: number): string => {
    const value = new Date(now);
    value.setHours(12, 0, 0, 0);
    value.setDate(value.getDate() - daysAgo);
    return value.toISOString().slice(0, 10);
  };
  return [
    row(
      5101,
      81001,
      4101,
      101,
      12,
      'Aisling Byrne',
      'Padraig Greenwood',
      'Skoda Octavia Style',
      38_950,
      date(0),
    ),
    row(
      5102,
      81002,
      4102,
      205,
      18,
      'Cormac Murphy',
      'Sarah Nolan',
      'Skoda Kodiaq Sportline',
      57_495,
      date(31),
    ),
    row(
      5103,
      81003,
      4103,
      314,
      27,
      'Doyle Construction Ltd',
      'Liam Kelly',
      'Volkswagen ID.4 Pro',
      49_870,
      date(61),
    ),
    row(
      5104,
      81004,
      4104,
      427,
      12,
      'Niamh O’Connor',
      'Padraig Greenwood',
      'Audi A3 Sportback',
      45_250,
      date(91),
    ),
    row(
      5109,
      81009,
      4109,
      205,
      18,
      'Cormac Murphy',
      'Sarah Nolan',
      'Volkswagen T-Roc R-Line',
      42_680,
      date(0),
    ),
    row(
      5110,
      81010,
      4110,
      314,
      27,
      'Doyle Construction Ltd',
      'Liam Kelly',
      'Skoda Enyaq 85',
      59_990,
      date(0),
    ),
    row(
      5111,
      81011,
      4111,
      427,
      12,
      'Niamh O’Connor',
      'Padraig Greenwood',
      'Audi Q3 S line',
      52_350,
      date(0),
    ),
    row(
      5112,
      81012,
      4112,
      427,
      12,
      'Niamh O’Connor',
      'Padraig Greenwood',
      'Volkswagen Golf Life',
      34_995,
      date(3),
    ),
    row(
      5113,
      81013,
      4113,
      101,
      12,
      'Aisling Byrne',
      'Padraig Greenwood',
      'Skoda Kamiq Ambition',
      31_450,
      date(7),
    ),
    row(
      5114,
      81014,
      4114,
      205,
      18,
      'Cormac Murphy',
      'Sarah Nolan',
      'Audi A4 Avant',
      47_880,
      date(21),
    ),
    row(
      5115,
      81015,
      4115,
      314,
      27,
      'Doyle Construction Ltd',
      'Liam Kelly',
      'Volkswagen Tiguan Elegance',
      55_240,
      date(45),
    ),
    row(
      5116,
      81016,
      4116,
      101,
      12,
      'Aisling Byrne',
      'Padraig Greenwood',
      'Skoda Octavia SE',
      36_725,
      date(75),
    ),
    row(
      5117,
      81017,
      4117,
      205,
      18,
      'Cormac Murphy',
      'Sarah Nolan',
      'Audi Q5 Sport',
      68_410,
      date(18),
    ),
    {
      ...row(
        5118,
        81018,
        4118,
        427,
        27,
        'Niamh O’Connor',
        'Liam Kelly',
        'Volkswagen ID.7 Tourer',
        63_995,
        date(32),
      ),
      isArchive: true,
    },
    {
      ...row(
        5105,
        81005,
        4105,
        205,
        18,
        'Cormac Murphy',
        'Sarah Nolan',
        'Skoda Superb Selection',
        51_120,
        date(14),
      ),
      isArchive: true,
    },
    {
      ...row(
        5106,
        81006,
        4106,
        101,
        12,
        'Aisling Byrne',
        'Padraig Greenwood',
        'Volkswagen Golf',
        36_780,
        date(8),
      ),
      branchCode: 'ORK01',
      division: 'City Motors',
    },
    {
      ...row(
        5107,
        81007,
        4107,
        314,
        27,
        'Doyle Construction Ltd',
        'Liam Kelly',
        'Audi Q4 e-tron',
        62_400,
        date(4),
      ),
      status: 'Draft',
    },
    {
      ...row(
        5108,
        81008,
        4108,
        427,
        18,
        'Niamh O’Connor',
        'Sarah Nolan',
        'Skoda Enyaq',
        54_775,
        date(2),
      ),
      processed: true,
    },
  ];
}

function row(
  salesOrderId: number,
  orderNumber: number,
  quotationNumber: number,
  customerCode: number,
  salespersonCode: number,
  customer: string,
  employee: string,
  modelName: string,
  totalPayment: number,
  salesOrderDate: string,
): SalesOrderRecord {
  return {
    salesOrderId,
    branchCode: CURRENT_SALES_BRANCH,
    division: 'Avonbrook Motors',
    orderNumber,
    quotationNumber,
    customerCode,
    customer,
    salespersonCode,
    employee,
    modelName,
    totalPayment,
    salesOrderDate,
    isArchive: false,
    status: 'Ordered',
    processed: false,
  };
}

function inRange(value: number, from: number | null, to: number | null): boolean {
  // Legacy enquiry applies a range only after the upper bound is supplied.
  return to === null || (value >= (from ?? 0) && value <= to);
}

function inDateRange(value: string, from: string, to: string): boolean {
  return !from || !to || (value >= from && value <= to);
}

function vehicle(
  stockNumber: string,
  modelCode: string,
  modelDescription: string,
  registration: string,
  chassisNumber: string,
  colour: string,
  year: number | null,
  mileage: number | null,
  retailPrice: number,
): ShowroomVehicle {
  return {
    stockNumber,
    modelCode,
    modelDescription,
    registration,
    chassisNumber,
    colour,
    year,
    mileage,
    retailPrice,
    discount: 0,
  };
}

function person(
  customerCode: string,
  title: string,
  firstName: string,
  surname: string,
  company: string,
  mobile: string,
  email: string,
  address: string,
  city: string,
  postcode: string,
): ShowroomPerson {
  return {
    customerCode,
    title,
    firstName,
    surname,
    company,
    mobile,
    email,
    address,
    city,
    postcode,
  };
}

function cloneOrder(order: ShowroomSalesOrder): ShowroomSalesOrder {
  return {
    ...order,
    vehicle: { ...order.vehicle },
    accessories: order.accessories.map((item) => ({ ...item })),
    tradeIns: order.tradeIns.map((item) => ({ ...item })),
    customer: { ...order.customer },
    driver: { ...order.driver },
    finance: { ...order.finance },
  };
}

function localDate(value: Date): string {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 10);
}

function orderFromEnquiryRecord(record: SalesOrderRecord, now: Date): ShowroomSalesOrder {
  const order = createBlankShowroomSalesOrder(now);
  const [firstName = '', ...surname] = record.customer.split(' ');
  order.id = record.salesOrderId;
  order.orderNumber = `SO-${record.salesOrderId}`;
  order.quotationNumber = `Q-${record.quotationNumber}`;
  order.status = record.status === 'Ordered' ? 'Ordered' : 'Open';
  order.division = record.division;
  order.orderDate = record.salesOrderDate;
  order.salesperson = record.employee;
  order.vehicle = vehicle(
    '',
    `MODEL-${record.salesOrderId}`,
    record.modelName,
    '',
    '',
    '',
    null,
    null,
    record.totalPayment,
  );
  order.customer = person(
    String(record.customerCode),
    '',
    firstName,
    surname.join(' '),
    '',
    '',
    '',
    '',
    '',
    '',
  );
  order.driver = { ...order.customer };
  return order;
}
