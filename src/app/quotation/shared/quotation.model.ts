/** Contact / customer details captured on a quotation. */
export interface QuotationContact {
  contactId?: string;
  prefix?: string;
  firstName?: string;
  middleName?: string;
  surname?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  postCode?: string;
  mobile?: string;
  email?: string;
  enquiry?: string;
  vehicleType?: string;
  budget?: string;
  source?: string;
}

/** Vehicle being quoted. */
export interface QuotationVehicle {
  modelDescription?: string;
  stockBranch?: string;
  stockNumber?: string;
  colour?: string;
  regNo?: string;
  chassis?: string;
  year?: string;
  mileage?: string;
  description?: string;
  category?: string;
  franchise?: string;
  engineSize?: string;
  fuelType?: string;
  bodyType?: string;
  retailPrice?: string;
}

/** A single selected accessory line item. */
export interface QuotationAccessory {
  code: string;
  description: string;
  price: number;
  quantity: number;
}

/** Trade-in vehicle captured against the quotation. */
export interface QuotationTradeIn {
  regNo?: string;
  modelDescription?: string;
  mileage?: string;
  estimatedValue?: string;
  settlement?: string;
  comments?: string;
  valuer?: string;
}

export interface QuotationRequirements {
  includeNew: boolean;
  includeUsed: boolean;
  includeReserved: boolean;
  requiredDate: string;
  modelRange?: string;
  generalSize?: string;
  category?: string;
  colour?: string;
  engineFrom?: string;
  engineTo?: string;
  yearFrom?: string;
  yearTo?: string;
  mileageFrom?: string;
  mileageTo?: string;
  comments?: string;
}

export interface QuotationFinance {
  provider?: string;
  installments: number;
  monthlyPayment: number;
  arrangedByCustomer: boolean;
}

/** Rolled up pricing figures for a quotation. */
export interface QuotationPricing {
  vehicleRetail: number;
  accessoriesTotal: number;
  tradeInsTotal: number;
  subTotal: number;
  tradeDiscount: number;
  extraDiscounts: number;
  totalDiscount: number;
  deposit: number;
  totalPayment: number;
  vat: number;
}

export interface QuotationHeader {
  number: string;
  division: string;
  executive: string;
  franchise: string;
  date: string;
  status: string;
}

/** Full quotation aggregate shared by the V1/V2/V3 variant screens. */
export interface Quotation {
  header: QuotationHeader;
  contact: QuotationContact;
  vehicle: QuotationVehicle;
  accessories: QuotationAccessory[];
  tradeIn: QuotationTradeIn;
  requirements: QuotationRequirements;
  finance: QuotationFinance;
  pricing: QuotationPricing;
  comments: string;
}

/** Catalog of accessories available to add to a quotation (V1's "Available Accessories" list). */
export const ACCESSORY_CATALOG: QuotationAccessory[] = [
  { code: 'ACC-001', description: 'Detachable tow bar', price: 895, quantity: 1 },
  { code: 'ACC-002', description: 'Premium carpet mats', price: 145, quantity: 1 },
  { code: 'ACC-003', description: 'Paint protection treatment', price: 495, quantity: 1 },
  { code: 'ACC-004', description: 'Dash camera installation', price: 349, quantity: 1 },
  { code: 'ACC-005', description: 'Boot liner', price: 110, quantity: 1 },
  { code: 'ACC-006', description: 'Front and rear parking sensors', price: 525, quantity: 1 },
  { code: 'ACC-007', description: 'Roof bars', price: 320, quantity: 1 },
  { code: 'ACC-008', description: 'All-weather rubber mat set', price: 175, quantity: 1 },
  { code: 'ACC-009', description: 'Home EV charger installation', price: 1095, quantity: 1 },
  { code: 'ACC-010', description: 'Vehicle signwriting package', price: 790, quantity: 1 },
];

/** Quotations shown in the V1 "Search Quotation" modal. */
export interface SavedQuotationSummary {
  number: string;
  customer: string;
  phone: string;
  division: string;
  executive: string;
  model: string;
  total: number;
  date: string;
  status: string;
  reg: string;
  comments: string;
  contact: QuotationContact;
  vehicle: QuotationVehicle;
  accessories: QuotationAccessory[];
  tradeIn: QuotationTradeIn;
  pricing: Partial<QuotationPricing>;
}

export const MOCK_CUSTOMERS: QuotationContact[] = [
  { contactId: 'AC-10492', prefix: 'Ms', firstName: 'Aoife', surname: 'Byrne', address1: '18 Seabury Avenue', city: 'Malahide', postCode: 'K36 YN24', mobile: '087 214 6380', email: 'aoife.byrne@example.ie', source: 'Website', enquiry: 'Interested in a new hybrid SUV.' },
  { contactId: 'AC-08731', company: 'O’Connell Electrical Ltd', firstName: 'Niamh', surname: 'O’Connell', address1: 'Unit 7, Northwest Business Park', city: 'Dublin 15', postCode: 'D15 K6Y2', mobile: '01 685 2910', email: 'fleet@oconnellelectrical.ie', source: 'Referral', enquiry: 'Replacement electric commercial vehicle.' },
  { contactId: 'AC-11208', prefix: 'Mr', firstName: 'Michael', surname: 'Kavanagh', address1: '4 Glenview Close', city: 'Bray', postCode: 'A98 X2N7', mobile: '086 390 7421', email: 'm.kavanagh@example.ie', source: 'Showroom', enquiry: 'Family crossover with finance.' },
  { contactId: 'AC-11844', prefix: 'Dr', firstName: 'Ciara', surname: 'Doyle', address1: '29 College Park', city: 'Dundrum', postCode: 'D14 R2F8', mobile: '085 741 2260', email: 'ciara.doyle@example.ie', source: 'Website' },
];

export const MOCK_VEHICLES: QuotationVehicle[] = [
  { modelDescription: 'Honda CR-V 2.0 i-MMD Elegance', description: '2.0 petrol hybrid automatic', stockBranch: 'Avonbrook Motors', stockNumber: 'AVB-26184', regNo: '261-D-1842', chassis: 'JHMRW6860NL018421', year: '2026', mileage: '12', colour: 'Platinum White', category: 'SUV', franchise: 'Honda', engineSize: '1993 cc', fuelType: 'Hybrid', bodyType: '5-door SUV', retailPrice: '48950' },
  { modelDescription: 'Volkswagen ID. Buzz Cargo', description: 'Pro 79kWh electric automatic', stockBranch: 'Avonbrook Motors', stockNumber: 'AVB-26163', regNo: '261-D-1639', chassis: 'WVGZZZEB6NP016390', year: '2026', mileage: '24', colour: 'Candy White', category: 'Commercial', franchise: 'Volkswagen', engineSize: 'Electric', fuelType: 'Electric', bodyType: 'Panel van', retailPrice: '51780' },
  { modelDescription: 'Nissan Qashqai 1.3 MHEV SV', description: '1.3 mild hybrid petrol manual', stockBranch: 'Avonbrook Motors', stockNumber: 'AVB-26308', regNo: '261-WW-308', chassis: 'SJNTAAJ12U1260308', year: '2026', mileage: '9', colour: 'Ceramic Grey', category: 'Crossover', franchise: 'Nissan', engineSize: '1332 cc', fuelType: 'Petrol hybrid', bodyType: '5-door crossover', retailPrice: '37400' },
  { modelDescription: 'Skoda Octavia 2.0 TDI Style', description: '2.0 diesel DSG', stockBranch: 'Avonbrook Motors', stockNumber: 'AVB-25116', regNo: '251-D-9116', chassis: 'TMBJG7NX5SY091160', year: '2025', mileage: '8420', colour: 'Graphite Grey', category: 'Passenger', franchise: 'Skoda', engineSize: '1968 cc', fuelType: 'Diesel', bodyType: '5-door hatchback', retailPrice: '38900' },
  { modelDescription: 'Toyota Corolla Cross 1.8 Hybrid Luna', description: '1.8 petrol hybrid automatic', stockBranch: 'Avonbrook Motors', stockNumber: 'AVB-26241', regNo: '261-D-2241', chassis: 'NMTKZ3BX90R022410', year: '2026', mileage: '18', colour: 'Metal Stream', category: 'SUV', franchise: 'Toyota', engineSize: '1798 cc', fuelType: 'Hybrid', bodyType: '5-door SUV', retailPrice: '39950' },
  { modelDescription: 'Kia Sportage 1.6 HEV K3', description: '1.6 petrol hybrid automatic', stockBranch: 'Avonbrook Motors', stockNumber: 'AVB-26287', regNo: '261-D-2287', chassis: 'U5YPX81GBSL022870', year: '2026', mileage: '7', colour: 'Experience Green', category: 'SUV', franchise: 'Kia', engineSize: '1598 cc', fuelType: 'Hybrid', bodyType: '5-door SUV', retailPrice: '42650' },
  { modelDescription: 'BMW 330e M Sport', description: '2.0 plug-in hybrid automatic', stockBranch: 'Avonbrook Motors', stockNumber: 'AVB-25352', regNo: '252-D-7352', chassis: 'WBA5P71080FM73520', year: '2025', mileage: '11800', colour: 'Portimao Blue', category: 'Passenger', franchise: 'BMW', engineSize: '1998 cc', fuelType: 'Plug-in hybrid', bodyType: '4-door saloon', retailPrice: '52900' },
  { modelDescription: 'Ford Ranger Wildtrak 2.0 Bi-Turbo', description: '2.0 diesel automatic 4x4', stockBranch: 'Avonbrook Motors', stockNumber: 'AVB-25204', regNo: '252-D-5204', chassis: '6FPPXXMJ2PS052040', year: '2025', mileage: '16400', colour: 'Agate Black', category: 'Commercial', franchise: 'Ford', engineSize: '1996 cc', fuelType: 'Diesel', bodyType: 'Double cab pickup', retailPrice: '54800' },
  { modelDescription: 'Hyundai Tucson 1.6 PHEV Executive', description: '1.6 plug-in hybrid automatic', stockBranch: 'Avonbrook Motors', stockNumber: 'AVB-26129', regNo: '261-D-1294', chassis: 'TMAJE81BPST012940', year: '2026', mileage: '31', colour: 'Amazon Grey', category: 'SUV', franchise: 'Hyundai', engineSize: '1598 cc', fuelType: 'Plug-in hybrid', bodyType: '5-door SUV', retailPrice: '46795' },
  { modelDescription: 'Renault Austral E-Tech Techno', description: '1.2 full hybrid automatic', stockBranch: 'Avonbrook Motors', stockNumber: 'AVB-26177', regNo: '261-D-1774', chassis: 'VF1RHN00XUA017740', year: '2026', mileage: '15', colour: 'Diamond Black', category: 'SUV', franchise: 'Renault', engineSize: '1199 cc', fuelType: 'Hybrid', bodyType: '5-door SUV', retailPrice: '44295' },
];

export const MOCK_TRADE_INS: QuotationTradeIn[] = [
  { regNo: '221-D-18420', modelDescription: 'Honda Civic 1.5 VTEC Sport', mileage: '52400', estimatedValue: '17800', settlement: '6200', valuer: 'Sarah Nolan', comments: 'Full service history; two keys.' },
  { regNo: '181-WW-204', modelDescription: 'Nissan X-Trail 1.6 dCi SV', mileage: '91800', estimatedValue: '13250', settlement: '0', valuer: 'Padraig Greenwood', comments: 'Good condition; minor wheel refurbishment.' },
  { regNo: '202-D-7319', modelDescription: 'Volkswagen Golf 1.5 TSI Life', mileage: '63800', estimatedValue: '19400', settlement: '4800', valuer: 'Sarah Nolan', comments: 'Inspection completed.' },
  { regNo: '191-KE-442', modelDescription: 'Toyota C-HR 1.8 Hybrid Sport', mileage: '78450', estimatedValue: '18100', settlement: '2100', valuer: 'Padraig Greenwood', comments: 'One owner; dealer service history.' },
  { regNo: '231-D-11028', modelDescription: 'Kia Niro EV K3', mileage: '29700', estimatedValue: '26750', settlement: '14900', valuer: 'Sarah Nolan', comments: 'Battery health report available.' },
  { regNo: '172-MH-908', modelDescription: 'Skoda Superb 2.0 TDI Style', mileage: '132600', estimatedValue: '10900', settlement: '0', valuer: 'Padraig Greenwood', comments: 'High mileage, clean interior.' },
];

export const SAVED_QUOTATIONS: SavedQuotationSummary[] = [
  { number: 'Q-10482', customer: 'Aoife Byrne', phone: '087 214 6380', division: 'Avonbrook Motors', executive: 'Padraig Greenwood', model: 'Honda CR-V 2.0 i-MMD Elegance', total: 48950, date: '2026-03-08', status: 'Enquiry', reg: '261-D-1842', comments: 'Customer requested PCP options.', contact: MOCK_CUSTOMERS[0], vehicle: MOCK_VEHICLES[0], accessories: [{ ...ACCESSORY_CATALOG[1] }], tradeIn: { regNo: '221-D-18420', modelDescription: 'Honda Civic 1.5 VTEC', mileage: '52400', estimatedValue: '17800', settlement: '6200', valuer: 'Sarah Nolan' }, pricing: { tradeDiscount: 750, deposit: 5000, vat: 0 } },
  { number: 'Q-10477', customer: 'O’Connell Electrical Ltd', phone: '01 685 2910', division: 'Avonbrook Motors', executive: 'Padraig Greenwood', model: 'Volkswagen ID. Buzz Cargo', total: 51780, date: '2026-03-06', status: 'Approved', reg: '261-D-1639', comments: 'Fleet vehicle with signwriting.', contact: MOCK_CUSTOMERS[1], vehicle: MOCK_VEHICLES[1], accessories: [{ ...ACCESSORY_CATALOG[3] }], tradeIn: {}, pricing: { extraDiscounts: 1250, deposit: 10000, vat: 0 } },
  { number: 'Q-10461', customer: 'Michael Kavanagh', phone: '086 390 7421', division: 'Avonbrook Motors', executive: 'Sarah Nolan', model: 'Nissan Qashqai 1.3 MHEV SV', total: 37400, date: '2026-03-02', status: 'Ordered', reg: '261-WW-308', comments: 'Handover planned for Friday.', contact: MOCK_CUSTOMERS[2], vehicle: MOCK_VEHICLES[2], accessories: [], tradeIn: { regNo: '181-WW-204', modelDescription: 'Nissan X-Trail SV', mileage: '91800', estimatedValue: '13250', settlement: '0', valuer: 'Padraig Greenwood' }, pricing: { tradeDiscount: 500, deposit: 3000, vat: 0 } },
];

/** Formats quotation values in the dealership's Irish trading currency. */
export function formatCurrency(value: number | string | undefined): string {
  const amount = Number(value) || 0;
  return amount.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });
}

/** Statuses selectable against a quotation's business status badge. */
export const QUOTATION_STATUSES = ['Draft', 'Enquiry', 'Approved', 'Ordered', 'Cancelled', 'Lost'] as const;

/** Tailwind pill classes for a quotation status, shared by the page header badge across V1/V2/V3. */
export function statusToneClasses(status: string | undefined): string {
  switch ((status ?? '').toLowerCase()) {
    case 'ordered':
    case 'approved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'enquiry':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'cancelled':
    case 'lost':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

/** Recomputes every derived pricing figure on a quotation, mirroring `QuotationEngine.updateTotals`. */
export function recalculateTotals(quotation: Quotation): void {
  const pricing = quotation.pricing;
  pricing.vehicleRetail = Number.parseFloat(quotation.vehicle.retailPrice ?? '') || 0;
  pricing.accessoriesTotal = quotation.accessories.reduce((total, item) => total + item.price * item.quantity, 0);
  pricing.tradeInsTotal = Number.parseFloat(quotation.tradeIn.estimatedValue ?? '') || 0;
  pricing.subTotal = pricing.vehicleRetail + pricing.accessoriesTotal - pricing.tradeInsTotal;
  pricing.totalDiscount = pricing.tradeDiscount + pricing.extraDiscounts;
  pricing.totalPayment = Math.max(0, pricing.subTotal - pricing.totalDiscount - pricing.deposit);
}

export function populateFromSavedQuotation(
  quotation: Quotation,
  row: SavedQuotationSummary,
): void {
  quotation.header.number = row.number;
  quotation.header.division = row.division;
  quotation.header.executive = row.executive;
  quotation.header.date = row.date;
  quotation.header.status = row.status;
  Object.assign(quotation.contact, row.contact);
  Object.assign(quotation.vehicle, row.vehicle);
  quotation.accessories.splice(0, quotation.accessories.length, ...row.accessories.map((item) => ({ ...item })));
  Object.assign(quotation.tradeIn, row.tradeIn);
  Object.assign(quotation.pricing, row.pricing);
  quotation.comments = row.comments;
  quotation.header.franchise = row.vehicle.franchise ?? '';
  recalculateTotals(quotation);
}

/** Builds a blank quotation in "create" mode, matching `QuotationEngine.createNewQuotation`. */
export function createBlankQuotation(): Quotation {
  return {
    header: {
      number: `Q-${Math.floor(10000 + Math.random() * 90000)}`,
      division: '',
      executive: '',
      franchise: '',
      date: new Date().toISOString().slice(0, 10),
      status: 'Draft',
    },
    contact: {},
    vehicle: {},
    accessories: [],
    tradeIn: {},
    requirements: {
      includeNew: true,
      includeUsed: true,
      includeReserved: false,
      requiredDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    },
    finance: { installments: 61, monthlyPayment: 0, arrangedByCustomer: false },
    pricing: {
      vehicleRetail: 0,
      accessoriesTotal: 0,
      tradeInsTotal: 0,
      subTotal: 0,
      tradeDiscount: 0,
      extraDiscounts: 0,
      totalDiscount: 0,
      deposit: 0,
      totalPayment: 0,
      vat: 0,
    },
    comments: '',
  };
}

/** Sample quotation used to seed the V2 collapsible-sections variant. */
export function sampleQuotationV2(): Quotation {
  return createBlankQuotation();
}

/** Sample quotation used to seed the V3 tabbed stage-builder variant. */
export function sampleQuotationV3(): Quotation {
  return createBlankQuotation();
}
