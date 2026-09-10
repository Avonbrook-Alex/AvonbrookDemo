import { crumbsFor, navEntry, navIdFromUrl, routerPathFor } from './nav.model';

describe('sales orders navigation', () => {
  it('reuses the vorders identity for the main editor', () => {
    expect(navEntry('vorders')).toMatchObject({
      id: 'vorders',
      label: 'New Sales Order',
      icon: 'shopping-cart',
    });
    expect(routerPathFor('vorders')).toBe('/sales-orders/new');
    expect(routerPathFor('sales-order-search')).toBe('/sales-orders/search');
  });

  it('maps editor and search routes back to their sidebar entries', () => {
    expect(navIdFromUrl('/sales-orders/new?workspaceTab=workspace-1')).toBe('vorders');
    expect(navIdFromUrl('/sales-orders/5101')).toBe('vorders');
    expect(navIdFromUrl('/sales-orders/search')).toBe('sales-order-search');
    expect(crumbsFor('vorders')).toEqual(['Fortuna DMS', 'Sales', 'New Sales Order']);
  });
});
