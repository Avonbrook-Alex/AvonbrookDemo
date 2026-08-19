/** A single leaf entry in the Fortuna DMS sidebar (with an optional parent). */
export interface NavLeaf {
  id: string;
  label: string;
  icon: string;
  attention?: boolean;
}

/** A top level sidebar item, optionally expandable with child leaves. */
export interface NavItem extends NavLeaf {
  badge?: number;
  children?: NavLeaf[];
}

/** A labelled group of top level sidebar items (e.g. "Sales", "Workshop"). */
export interface NavSection {
  section: string;
  items: NavItem[];
}

/**
 * Sidebar navigation structure, ported from the legacy standalone app's NAV
 * constant (assets/js/shared.js) so the Angular sidebar matches its grouping,
 * icons, and badges exactly.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    section: 'Main',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', attention: true }],
  },
  {
    section: 'Sales',
    items: [
      {
        id: 'sales',
        label: 'Sales',
        icon: 'shopping-bag',
        badge: 3,
        children: [
          { id: 'leads', label: 'Leads', icon: 'users' },
          { id: 'quotation-guided-new', label: 'New Quote (Guided)', icon: 'file-plus-2', attention: true },
          { id: 'quotation-staged-new', label: 'New Quote (Staged)', icon: 'file-plus-2', attention: true },
          { id: 'quotation-search', label: 'Search Quotes', icon: 'search', attention: true },
          { id: 'vorders', label: 'Vehicle Orders', icon: 'car' },
          { id: 'deliver', label: 'Deliveries', icon: 'truck' },
        ],
      },
    ],
  },
  {
    section: 'Workshop',
    items: [
      {
        id: 'workshop',
        label: 'Workshop',
        icon: 'wrench',
        children: [],
      },
      {
        id: 'parts',
        label: 'Parts',
        icon: 'package',
        children: [],
      },
    ],
  },
  {
    section: 'Customers',
    items: [
      {
        id: 'crm',
        label: 'CRM',
        icon: 'message-square',
        children: [],
      },
    ],
  },
  {
    section: 'Finance',
    items: [
      {
        id: 'accounts',
        label: 'Accounts',
        icon: 'dollar-sign',
        children: [],
      },
    ],
  },
  {
    section: 'System',
    items: [
      { id: 'reports', label: 'Reports', icon: 'bar-chart-2' },
      { id: 'admin', label: 'Administration', icon: 'settings', attention: true },
    ],
  },
];

/** Top level nav ids that start expanded by default (mirrors legacy behaviour). */
export const NAV_DEFAULT_OPEN = new Set<string>(['sales']);

/** Flattened list of every nav entry (parents and children), each with its parent id if any. */
export interface FlatNavEntry extends NavLeaf {
  parent: string | null;
}

export function flatNavEntries(): FlatNavEntry[] {
  const entries: FlatNavEntry[] = [];
  for (const group of NAV_SECTIONS) {
    for (const item of group.items) {
      entries.push({ id: item.id, label: item.label, icon: item.icon, attention: item.attention, parent: null });
      for (const child of item.children ?? []) {
        entries.push({ id: child.id, label: child.label, icon: child.icon, attention: child.attention, parent: item.id });
      }
    }
  }
  return entries;
}

export function navEntry(id: string): FlatNavEntry {
  if (id === 'dashboard') {
    return { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', parent: null };
  }
  return (
    flatNavEntries().find((entry) => entry.id === id) ?? {
      id,
      label: id,
      icon: 'layout-dashboard',
      parent: null,
    }
  );
}

/** Breadcrumb trail for a given nav id, always starting with "Fortuna DMS". */
export function crumbsFor(id: string): string[] {
  const trail = ['Fortuna DMS'];
  for (const group of NAV_SECTIONS) {
    for (const item of group.items) {
      if (item.id === id) {
        trail.push(item.label);
      }
      for (const child of item.children ?? []) {
        if (child.id === id) {
          trail.push(item.label, child.label);
        }
      }
    }
  }
  if (trail.length === 1) {
    trail.push(navEntry(id).label);
  }
  return trail;
}

/** Resolves the in-app router path for a nav id, keeping every link inside the Angular router. */
export function routerPathFor(id: string): string {
  if (id === 'dashboard') {
    return '/dashboard';
  }
  if (id === 'quotation-guided-new') {
    return '/quotation/guided/new';
  }
  if (id === 'quotation-staged-new') {
    return '/quotation/staged/new';
  }
  if (id === 'quotation-search') {
    return '/quotation/search';
  }
  return `/module/${id}`;
}

/** Maps the current router URL back to the nav id it represents, for sidebar/breadcrumb highlighting. */
export function navIdFromUrl(url: string): string {
  const path = url.split('?')[0].split('#')[0];
  if (path === '/' || path.startsWith('/dashboard')) {
    return 'dashboard';
  }
  if (path.startsWith('/quotation')) {
    if (path.startsWith('/quotation/search')) {
      return 'quotation-search';
    }
    if (path.startsWith('/quotation/guided')) {
      return 'quotation-guided-new';
    }
    if (path.startsWith('/quotation/staged')) {
      return 'quotation-staged-new';
    }
    return 'quotation-guided-new';
  }
  const moduleMatch = path.match(/^\/module\/([^/]+)/);
  if (moduleMatch) {
    return moduleMatch[1];
  }
  return 'dashboard';
}
