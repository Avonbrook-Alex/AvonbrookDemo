import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { App } from './app';
import { routes } from './app.routes';
import { WorkspaceRouteReuseStrategy } from './shell/workspace-route-reuse.strategy';

const workspaceProviders = [
  provideZonelessChangeDetection(),
  provideRouter(routes),
  {
    provide: RouteReuseStrategy,
    useExisting: WorkspaceRouteReuseStrategy,
  },
];

describe('App', () => {
  beforeEach(async () => {
    sessionStorage.setItem('fortuna-demo-auth', '1');
    await TestBed.configureTestingModule({
      imports: [App],
      providers: workspaceProviders,
    }).compileComponents();
  });

  afterEach(() => {
    sessionStorage.removeItem('fortuna-demo-auth');
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the app shell chrome', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-shell')).not.toBeNull();
  });

  it('redirects the empty path to the dashboard route', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.tagName.toLowerCase()).toBe('app-dashboard');
  });

  it('navigates to the guided quotation route', async () => {
    const harness = await RouterTestingHarness.create('/quotation/guided');
    expect(harness.routeNativeElement?.tagName.toLowerCase()).toBe('app-quotation-v2');
  });
});

describe('App routing to staged quote', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: workspaceProviders,
    }).compileComponents();
  });

  it('navigates to the staged quotation route', async () => {
    const harness = await RouterTestingHarness.create('/quotation/staged');
    expect(harness.routeNativeElement?.tagName.toLowerCase()).toBe('app-quotation-v3');
  });
});

describe('App routing to sales orders', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: workspaceProviders,
    }).compileComponents();
  });

  it('redirects the Sales Orders root to the full editor', async () => {
    const harness = await RouterTestingHarness.create('/sales-orders');
    expect(harness.routeNativeElement?.tagName.toLowerCase()).toBe('app-sales-order-editor');
  });

  it('lazy-loads the Sales Order Enquiry at the search route', async () => {
    const harness = await RouterTestingHarness.create('/sales-orders/search');
    expect(harness.routeNativeElement?.tagName.toLowerCase()).toBe('app-sales-order-enquiry');
  });

  it('loads an existing Sales Order in the editor', async () => {
    const harness = await RouterTestingHarness.create('/sales-orders/5101');
    expect(harness.routeNativeElement?.tagName.toLowerCase()).toBe('app-sales-order-editor');
    expect(harness.routeNativeElement?.textContent).toContain('SO-5101');
    expect(harness.routeNativeElement?.textContent).toContain('This Ordered order is read-only.');
    const lookups = harness.routeNativeElement?.querySelectorAll('.lookup-field select');
    expect([...(lookups ?? [])].every((lookup) => (lookup as HTMLSelectElement).disabled)).toBe(
      true,
    );
  });
});
