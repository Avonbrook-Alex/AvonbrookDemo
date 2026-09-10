import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';

import { SalesOrderRecord } from './sales-order.models';
import { SalesOrderEnquiry } from './sales-order-enquiry';
import { SALES_ORDER_NOW, SalesOrderService } from './sales-order.service';

const FIXED_NOW = new Date('2026-09-07T12:00:00');

describe('SalesOrderEnquiry', () => {
  let fixture: ComponentFixture<SalesOrderEnquiry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesOrderEnquiry],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SALES_ORDER_NOW, useValue: () => FIXED_NOW },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SalesOrderEnquiry);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('renders current branch and the TotalPayment query value', () => {
    expect(text()).toContain('Avonbrook Motors');
    expect(text()).toContain('Ready to search.');
    button('Search').click();
    fixture.detectChanges();
    expect(text()).toContain('€38,950.00');
    expect(rows()).toHaveLength(4);
  });

  it('normalizes reversed date and numeric ranges on search', async () => {
    setInput('fromDate', '2026-09-07');
    setInput('toDate', '2026-09-01');
    setInput('fromSalesOrderNumber', '5102');
    setInput('toSalesOrderNumber', '5101');
    button('Search').click();
    await fixture.whenStable();
    expect(input('toDate').value).toBe('2026-09-07');
    expect(input('toSalesOrderNumber').value).toBe('5102');
  });

  it('rejects non-digit number keys while preserving editing and shortcut keys', () => {
    const orderNumber = input('fromOrderNumber');
    const exponent = new KeyboardEvent('keydown', { key: 'e', cancelable: true, bubbles: true });
    const digit = new KeyboardEvent('keydown', { key: '7', cancelable: true, bubbles: true });
    const backspace = new KeyboardEvent('keydown', {
      key: 'Backspace',
      cancelable: true,
      bubbles: true,
    });

    expect(orderNumber.dispatchEvent(exponent)).toBe(false);
    expect(orderNumber.dispatchEvent(digit)).toBe(true);
    expect(orderNumber.dispatchEvent(backspace)).toBe(true);
  });

  it('shows safe feedback when Select has no active row', () => {
    button('Select').click();
    fixture.detectChanges();
    expect(text()).toContain(
      'No row is currently selected. Please click the Sales Order you wish to select.',
    );
  });

  it('selects by internal SalesOrderId and opens the full editor', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.mocked(router.navigate);
    button('Search').click();
    fixture.detectChanges();
    const row = rows()[0];
    row.click();
    button('Select').click();
    fixture.detectChanges();
    expect(row.getAttribute('aria-selected')).toBe('true');
    expect(navigate).toHaveBeenCalledWith(['/sales-orders', 5101], {
      queryParamsHandling: 'preserve',
    });

    row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledTimes(2);
  });

  it('reports no archive changes with the exact legacy message', () => {
    button('Archive Update').click();
    fixture.detectChanges();
    expect(text()).toContain('Please select at least one record.');
  });

  it('saves only a dirty archive checkbox and preserves the exact success message', async () => {
    button('Search').click();
    await fixture.whenStable();
    const archive = fixture.nativeElement.querySelector(
      'tbody input[type="checkbox"]',
    ) as HTMLInputElement;
    archive.click();
    fixture.detectChanges();
    expect(text()).toContain('1 unsaved');
    button('Archive Update').click();
    await fixture.whenStable();
    expect(text()).toContain('The selected record(s) have been update successfully.');
    expect(text()).toContain('Ordered and not processed · 3 records');
    expect(text()).not.toContain('5101');
  });

  it('clears the selection and feedback on Exit', () => {
    button('Search').click();
    fixture.detectChanges();
    rows()[0].click();
    button('Select').click();
    button('Exit').click();
    fixture.detectChanges();
    expect(rows()[0].getAttribute('aria-selected')).toBe('false');
    expect(fixture.nativeElement.querySelector('.feedback')).toBeNull();
  });

  it('uses all four accessible age-band classes when dates are broadened', async () => {
    setInput('fromDate', '');
    setInput('toDate', '');
    button('Search').click();
    await fixture.whenStable();
    const classes = rows().map((row) => row.className);
    expect(classes.some((value) => value.includes('age-under-30'))).toBe(true);
    expect(classes.some((value) => value.includes('age-over-30'))).toBe(true);
    expect(classes.some((value) => value.includes('age-over-60'))).toBe(true);
    expect(classes.some((value) => value.includes('age-over-90'))).toBe(true);
  });

  it('refreshes immediately when Show Archive changes', async () => {
    setInput('fromDate', '');
    setInput('toDate', '');
    button('Search').click();
    await fixture.whenStable();
    expect(rows()).toHaveLength(13);

    const showArchive = input('showArchive');
    showArchive.click();
    await fixture.whenStable();
    expect(rows()).toHaveLength(15);
    expect(text()).toContain('5105');
  });

  it('supports keyboard row selection', async () => {
    button('Search').click();
    await fixture.whenStable();
    const row = rows()[0];
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(row.getAttribute('aria-selected')).toBe('true');
  });

  it('uses theme variables for selection, focus, action and archive controls', () => {
    const styles = [...document.querySelectorAll('style')]
      .map((style) => style.textContent)
      .join('\n');
    expect(styles).toContain('var(--theme-primary)');
    expect(styles).toContain('var(--theme-secondary)');
    expect(styles).toContain('accent-color: var(--theme-primary)');
    expect(styles).not.toMatch(/#(?:1e40af|eff6ff|bfdbfe|dbeafe|2563eb|3b82f6)/i);
  });

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function rows(): HTMLTableRowElement[] {
    return [
      ...fixture.nativeElement.querySelectorAll('tbody tr[tabindex]'),
    ] as HTMLTableRowElement[];
  }

  function button(label: string): HTMLButtonElement {
    return [...fixture.nativeElement.querySelectorAll('button')].find(
      (item) => item.textContent?.trim() === label,
    ) as HTMLButtonElement;
  }

  function input(name: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`[formcontrolname="${name}"]`) as HTMLInputElement;
  }

  function setInput(name: string, value: string): void {
    const element = input(name);
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
});

describe('SalesOrderEnquiry states', () => {
  it('renders loading then error and retry states without exposing raw errors', async () => {
    const pending = new Subject<readonly SalesOrderRecord[]>();
    const service = {
      customers: [],
      salespeople: [],
      search: vi
        .fn()
        .mockReturnValueOnce(pending)
        .mockReturnValueOnce(throwError(() => new Error('SQL secret'))),
      updateArchive: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [SalesOrderEnquiry],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SALES_ORDER_NOW, useValue: () => FIXED_NOW },
        { provide: SalesOrderService, useValue: service },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SalesOrderEnquiry);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ready to search.');
    const search = [...fixture.nativeElement.querySelectorAll('button')].find(
      (item: HTMLButtonElement) => item.textContent?.trim() === 'Search',
    ) as HTMLButtonElement;
    search.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading sales orders…');
    pending.error(new Error('SQL secret'));
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'Sales orders could not be loaded. Please try again.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('SQL secret');
  });
});
