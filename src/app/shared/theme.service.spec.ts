import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty('--theme-primary');
    document.documentElement.style.removeProperty('--theme-secondary');
    TestBed.configureTestingModule({});
  });

  it('applies color changes as shared UI variables', () => {
    const service = TestBed.inject(ThemeService);
    service.usePreset('#7c3aed', '#f5f3ff');
    expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#7c3aed');
    expect(document.documentElement.style.getPropertyValue('--theme-secondary')).toBe('#f5f3ff');
    expect(JSON.parse(localStorage.getItem('fortuna-demo-theme') ?? '{}')).toEqual({
      primary: '#7c3aed',
      secondary: '#f5f3ff',
    });
  });
});
