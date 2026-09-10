import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { SalesOrderEditor } from './sales-order-editor';
import { SALES_ORDER_NOW } from './sales-order.service';

const FIXED_NOW = new Date('2026-09-08T12:00:00');

describe('SalesOrderEditor', () => {
  let fixture: ComponentFixture<SalesOrderEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesOrderEditor],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SALES_ORDER_NOW, useValue: () => FIXED_NOW },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SalesOrderEditor);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('renders the full staged new Sales Order workspace', () => {
    expect(text()).toContain('New Sales Order');
    expect(text()).toContain('Order & Vehicle');
    expect(text()).toContain('Customer & Driver');
    expect(text()).toContain('Review & Confirm');
    expect(fixture.nativeElement.querySelectorAll('[role="tab"]')).toHaveLength(6);
  });

  it('selects and clears a stocked vehicle while updating live totals', async () => {
    selectLookup('Look up stock vehicle or model', 'Skoda Octavia Style 1.5 TSI');
    await fixture.whenStable();
    expect(input('stockNumber').value).toBe('DUB-N-1042');
    expect(text()).toContain('€38,950.00');
    button('Clear').click();
    await fixture.whenStable();
    expect(input('stockNumber').value).toBe('');
  });

  it('adds, edits and removes accessories', async () => {
    populateOrderStage();
    button('Accessories').click();
    await fixture.whenStable();
    selectLookup('Look up accessory', 'Detachable tow bar');
    await fixture.whenStable();
    expect((fixture.nativeElement.querySelector('[formarrayname="accessories"] input[formcontrolname="description"]') as HTMLInputElement).value).toBe('Detachable tow bar');
    const price = fixture.nativeElement.querySelector(
      '[formarrayname="accessories"] input[formcontrolname="retailPrice"]',
    ) as HTMLInputElement;
    price.value = '1200';
    price.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(text()).toContain('€1,200.00');
    (
      fixture.nativeElement.querySelector('[aria-label="Remove accessory"]') as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    expect(text()).toContain('No accessories selected.');
  });

  it('adds, amends and removes multiple trade-ins with live totals', async () => {
    populateOrderStage();
    button('Trade-ins').click();
    await fixture.whenStable();
    button('Add trade-in').click();
    button('Add trade-in').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.trade-list fieldset')).toHaveLength(2);
    const allowance = fixture.nativeElement.querySelector(
      '[formarrayname="tradeIns"] input[formcontrolname="allowance"]',
    ) as HTMLInputElement;
    allowance.value = '8000';
    allowance.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(text()).toContain('-€8,000.00');
    button('Remove trade-in').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.trade-list fieldset')).toHaveLength(1);
  });

  it('copies customer details to the driver and saves with a stable generated id', async () => {
    populateRequiredDetails();
    await fixture.whenStable();
    button('Save').click();
    await fixture.whenStable();
    expect(text()).toContain('saved.');
    expect(text()).toContain('Amend');
    const firstId = (
      fixture.componentInstance as unknown as { order: () => { id: number } }
    ).order().id;
    const driverFirstName = fixture.nativeElement.querySelector(
      'fieldset[formgroupname="driver"] input[formcontrolname="firstName"]',
    ) as HTMLInputElement;
    expect(driverFirstName.value).toBe('Aisling');
    button('Amend').click();
    await fixture.whenStable();
    expect(
      (fixture.componentInstance as unknown as { order: () => { id: number } }).order().id,
    ).toBe(firstId);
  });

  it('confirms a complete stocked order and makes it read-only', async () => {
    populateRequiredDetails();
    button('Review & Confirm').click();
    await fixture.whenStable();
    button('Confirm Sales Order').click();
    await fixture.whenStable();
    expect(text()).toContain('confirmed as Ordered.');
    expect(text()).toContain('This Ordered order is read-only.');
    expect(input('salesperson').disabled).toBe(true);
  });

  it('marks an open sale Lost and makes it read-only', async () => {
    populateOrderStage();
    button('Review & Confirm').click();
    await fixture.whenStable();
    button('Sale Lost').click();
    await fixture.whenStable();
    expect(text()).toContain('marked as Lost.');
    expect(text()).toContain('This Lost order is read-only.');
  });

  it('requires finance provider and term when finance is selected', async () => {
    populateRequiredDetails();
    button('Finance').click();
    await fixture.whenStable();
    const toggle = fixture.nativeElement.querySelector(
      '.same-toggle input[type="checkbox"]',
    ) as HTMLInputElement;
    toggle.click();
    await fixture.whenStable();
    button('Review & Confirm').click();
    await fixture.whenStable();
    expect(button('Confirm Sales Order').disabled).toBe(true);
  });

  it('keeps the user on the first stage until salesperson and vehicle are selected', async () => {
    button('Continue').click();
    await fixture.whenStable();
    expect(text()).toContain('Select a salesperson and vehicle or model before continuing.');
    expect(text()).toContain('Look up stock vehicle or model');
    expect(fixture.nativeElement.querySelector('.step.is-incomplete')).not.toBeNull();
    populateOrderStage();
    button('Continue').click();
    await fixture.whenStable();
    expect(text()).toContain('Look up accessory');
    expect(fixture.nativeElement.querySelector('.step.is-complete')).not.toBeNull();
  });

  it('enforces the legacy Trade sale rule for trade-ins', async () => {
    populateOrderStage();
    const saleType = input('saleType') as unknown as HTMLSelectElement;
    saleType.value = 'Trade';
    saleType.dispatchEvent(new Event('change', { bubbles: true }));
    button('Trade-ins').click();
    await fixture.whenStable();
    expect(button('Add trade-in').disabled).toBe(true);
  });

  it('scrolls the stage strip horizontally with the mouse wheel', () => {
    const tabs = fixture.nativeElement.querySelector('.stage-tabs') as HTMLElement;
    tabs.scrollLeft = 0;
    tabs.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, cancelable: true }));
    expect(tabs.scrollLeft).toBe(120);
  });

  it('uses theme variables for active stages, actions, focus and totals', () => {
    const styles = [...document.querySelectorAll('style')]
      .map((style) => style.textContent)
      .join('\n');
    expect(styles).toContain('var(--theme-primary)');
    expect(styles).toContain('var(--theme-secondary)');
    expect(styles).not.toMatch(/#(?:1e40af|eff6ff|dbeafe|2563eb|3b82f6)/i);
  });

  function populateRequiredDetails(): void {
    populateOrderStage();
    button('Customer & Driver').click();
    fixture.detectChanges();
    selectLookup('Look up customer', 'Aisling Byrne');
  }

  function populateOrderStage(): void {
    selectLookup('Look up stock vehicle or model', 'Skoda Octavia Style 1.5 TSI');
    setInput('salesperson', 'Padraig Greenwood');
  }

  function selectLookup(openLabel: string, resultLabel: string): void {
    button(openLabel).click();
    fixture.detectChanges();
    button(resultLabel).click();
    fixture.detectChanges();
  }

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
  function button(label: string): HTMLButtonElement {
    return [...fixture.nativeElement.querySelectorAll('button')].find((item) =>
      item.textContent?.includes(label),
    ) as HTMLButtonElement;
  }
  function input(name: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`[formcontrolname="${name}"]`) as HTMLInputElement;
  }
  function setInput(name: string, value: string): void {
    const element = input(name);
    element.value = value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
