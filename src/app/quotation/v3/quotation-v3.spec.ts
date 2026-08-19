import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { QuotationV3 } from './quotation-v3';

describe('QuotationV3', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotationV3],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(QuotationV3);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('retains staged tab navigation and defaults to the customer stage', async () => {
    const fixture = TestBed.createComponent(QuotationV3);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const tabs = compiled.querySelectorAll('.v3-tab');
    expect(tabs.length).toBe(8);
    expect(fixture.componentInstance.activeStage()).toBe('customer');
    expect(compiled.textContent).toContain('Contact Details');
    expect(compiled.textContent).not.toContain('Vehicle Details');
  });

  it('keeps trade-in and finance as complete separate stages', async () => {
    const fixture = TestBed.createComponent(QuotationV3);
    const component = fixture.componentInstance;
    await fixture.whenStable();

    const tradeInStage = component.stages.find((stage) => stage.id === 'tradein');
    expect(tradeInStage?.label).toBe('Trade-in');

    component.setStage('tradein');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Trade-in Vehicle');

    component.setStage('finance');
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Finance Details');
  });

  it('adds an accessory from the catalog and removes a selected accessory', () => {
    const fixture = TestBed.createComponent(QuotationV3);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const initialCount = component.quotation.accessories.length;
    component.accessories.selectAvailable(0);
    component.accessories.add();
    expect(component.quotation.accessories.length).toBe(initialCount + 1);

    component.accessories.selectSelected(0);
    component.accessories.remove();
    expect(component.quotation.accessories.length).toBe(initialCount);
  });
});
