export interface SalesOrderFilters {
  fromDate: string;
  toDate: string;
  fromOrderNumber: number | null;
  toOrderNumber: number | null;
  fromSalesOrderNumber: number | null;
  toSalesOrderNumber: number | null;
  fromQuotationNumber: number | null;
  toQuotationNumber: number | null;
  fromCustomerCode: number | null;
  toCustomerCode: number | null;
  fromSalespersonCode: number | null;
  toSalespersonCode: number | null;
  showArchive: boolean;
}

export interface SalesOrderQuery extends SalesOrderFilters {
  branchCode: string;
  orderedOnly: true;
  unprocessedOnly: true;
}

export interface SalesOrderRecord {
  salesOrderId: number;
  branchCode: string;
  division: string;
  orderNumber: number;
  quotationNumber: number;
  customerCode: number;
  customer: string;
  salespersonCode: number;
  employee: string;
  modelName: string;
  totalPayment: number;
  salesOrderDate: string;
  isArchive: boolean;
  status: 'Draft' | 'Ordered' | 'Cancelled';
  processed: boolean;
}

export interface SalesOrderLookup {
  code: number;
  label: string;
}

export interface ArchiveChange {
  salesOrderId: number;
  isArchive: boolean;
}

export type SalesOrderAgeBand = 'under-30' | 'over-30' | 'over-60' | 'over-90';

export function salesOrderAgeBand(orderDate: string, now: Date): SalesOrderAgeBand {
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  const placed = new Date(`${orderDate}T12:00:00`);
  const age = Math.floor((today.getTime() - placed.getTime()) / 86_400_000);
  if (age > 90) return 'over-90';
  if (age > 60) return 'over-60';
  if (age > 30) return 'over-30';
  return 'under-30';
}

export const EMPTY_SALES_ORDER_FILTERS: SalesOrderFilters = {
  fromDate: '',
  toDate: '',
  fromOrderNumber: null,
  toOrderNumber: null,
  fromSalesOrderNumber: null,
  toSalesOrderNumber: null,
  fromQuotationNumber: null,
  toQuotationNumber: null,
  fromCustomerCode: null,
  toCustomerCode: null,
  fromSalespersonCode: null,
  toSalespersonCode: null,
  showArchive: false,
};

export function normalizeSalesOrderFilters(filters: SalesOrderFilters): SalesOrderFilters {
  const normalized = { ...filters };
  normalizeNumericRange(normalized, 'fromOrderNumber', 'toOrderNumber');
  normalizeNumericRange(normalized, 'fromSalesOrderNumber', 'toSalesOrderNumber');
  normalizeNumericRange(normalized, 'fromQuotationNumber', 'toQuotationNumber');
  normalizeNumericRange(normalized, 'fromCustomerCode', 'toCustomerCode');
  normalizeNumericRange(normalized, 'fromSalespersonCode', 'toSalespersonCode');

  if (normalized.fromDate && normalized.toDate && normalized.toDate < normalized.fromDate) {
    normalized.toDate = normalized.fromDate;
  }
  return normalized;
}

function normalizeNumericRange(
  filters: SalesOrderFilters,
  fromKey: keyof SalesOrderFilters,
  toKey: keyof SalesOrderFilters,
): void {
  const from = filters[fromKey] as number | null;
  const to = filters[toKey] as number | null;
  if (from !== null && to !== null && to < from) {
    (filters as unknown as Record<string, number | null>)[toKey] = from;
  }
}

export type ShowroomSalesOrderStatus = 'Open' | 'Ordered' | 'Lost';

export interface ShowroomVehicle {
  stockNumber: string;
  modelCode: string;
  modelDescription: string;
  registration: string;
  chassisNumber: string;
  colour: string;
  year: number | null;
  mileage: number | null;
  retailPrice: number;
  discount: number;
}

export interface ShowroomAccessory {
  id: number;
  code: string;
  description: string;
  quantity: number;
  retailPrice: number;
}

export interface ShowroomTradeIn {
  id: number;
  registration: string;
  modelDescription: string;
  year: number | null;
  mileage: number | null;
  allowance: number;
  settlement: number;
  discount: number;
}

export interface ShowroomPerson {
  customerCode: string;
  title: string;
  firstName: string;
  surname: string;
  company: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
}

export interface ShowroomFinance {
  required: boolean;
  provider: string;
  agreementNumber: string;
  termMonths: number | null;
  amount: number;
  interestRate: number | null;
  deposit: number;
  monthlyPayment: number;
}

export interface ShowroomSalesOrder {
  id: number | null;
  orderNumber: string;
  quotationNumber: string;
  status: ShowroomSalesOrderStatus;
  saleType: 'Retail' | 'Trade';
  division: string;
  orderDate: string;
  requiredDeliveryDate: string;
  salesperson: string;
  businessManager: string;
  source: string;
  vehicle: ShowroomVehicle;
  accessories: ShowroomAccessory[];
  tradeIns: ShowroomTradeIn[];
  customer: ShowroomPerson;
  driverSameAsCustomer: boolean;
  driver: ShowroomPerson;
  finance: ShowroomFinance;
  comments: string;
  confirmedBy: string;
  dealerManager: string;
}

export interface ShowroomSalesOrderTotals {
  vehicleRetail: number;
  vehicleDiscount: number;
  vehicleNet: number;
  accessories: number;
  gross: number;
  tradeInAllowance: number;
  settlements: number;
  tradeInDiscount: number;
  totalPayment: number;
  deposit: number;
  balanceToFinance: number;
}

export function calculateShowroomSalesOrderTotals(
  order: Pick<ShowroomSalesOrder, 'vehicle' | 'accessories' | 'tradeIns' | 'finance'>,
): ShowroomSalesOrderTotals {
  const vehicleRetail = positive(order.vehicle.retailPrice);
  const vehicleDiscount = Math.min(vehicleRetail, positive(order.vehicle.discount));
  const vehicleNet = vehicleRetail - vehicleDiscount;
  const accessories = order.accessories.reduce(
    (sum, item) => sum + positive(item.retailPrice) * Math.max(1, positive(item.quantity)),
    0,
  );
  const tradeInAllowance = order.tradeIns.reduce((sum, item) => sum + positive(item.allowance), 0);
  const settlements = order.tradeIns.reduce((sum, item) => sum + positive(item.settlement), 0);
  const tradeInDiscount = order.tradeIns.reduce((sum, item) => sum + positive(item.discount), 0);
  const gross = vehicleNet + accessories;
  const totalPayment = Math.max(0, gross - tradeInAllowance + settlements + tradeInDiscount);
  const deposit = positive(order.finance.deposit);
  return {
    vehicleRetail,
    vehicleDiscount,
    vehicleNet,
    accessories,
    gross,
    tradeInAllowance,
    settlements,
    tradeInDiscount,
    totalPayment,
    deposit,
    balanceToFinance: Math.max(0, totalPayment - deposit),
  };
}

export function missingShowroomSalesOrderFields(order: ShowroomSalesOrder): string[] {
  return [
    !order.vehicle.modelCode ? 'vehicle or model' : '',
    !order.customer.firstName && !order.customer.company ? 'customer' : '',
    !order.salesperson ? 'salesperson' : '',
    order.finance.required && !order.finance.provider ? 'finance provider' : '',
    order.finance.required && !order.finance.termMonths ? 'finance term' : '',
    order.finance.required && !positive(order.finance.amount) ? 'finance amount' : '',
  ].filter(Boolean);
}

export function canConfirmShowroomSalesOrder(order: ShowroomSalesOrder): boolean {
  return missingShowroomSalesOrderFields(order).length === 0 && Boolean(order.vehicle.stockNumber);
}

function positive(value: number | null | undefined): number {
  const number = Number(value) || 0;
  return Math.max(0, number);
}
