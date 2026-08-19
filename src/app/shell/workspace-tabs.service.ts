import { Injectable, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { navEntry, navIdFromUrl } from './nav.model';
import { WorkspaceRouteReuseStrategy } from './workspace-route-reuse.strategy';

export interface WorkspaceTab {
  id: string;
  label: string;
  icon: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceTabsService {
  private readonly router = inject(Router);
  private readonly reuseStrategy = inject(WorkspaceRouteReuseStrategy);
  private nextId = 2;

  readonly tabs = signal<WorkspaceTab[]>([
    {
      id: 'workspace-1',
      label: 'Dashboard',
      icon: 'layout-dashboard',
      path: '/dashboard',
    },
  ]);
  readonly activeTabId = signal('workspace-1');
  readonly activeTab = computed(
    () =>
      this.tabs().find((tab) => tab.id === this.activeTabId()) ??
      this.tabs()[0],
  );

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => this.syncNavigation(event as NavigationEnd));
  }

  replaceActive(path: string): void {
    const activeId = this.activeTabId();
    const metadata = this.metadata(path);
    this.tabs.update((tabs) =>
      tabs.map((tab) =>
        tab.id === activeId ? { ...tab, ...metadata, path } : tab,
      ),
    );
    void this.navigate(path, activeId);
  }

  addTab(): void {
    const id = `workspace-${this.nextId++}`;
    const tab: WorkspaceTab = {
      id,
      label: 'Dashboard',
      icon: 'layout-dashboard',
      path: '/dashboard',
    };
    this.tabs.update((tabs) => [...tabs, tab]);
    this.activeTabId.set(id);
    void this.navigate(tab.path, id);
  }

  activate(tab: WorkspaceTab): void {
    if (tab.id === this.activeTabId()) {
      return;
    }
    this.activeTabId.set(tab.id);
    void this.navigate(tab.path, tab.id);
  }

  close(tabId: string): void {
    const currentTabs = this.tabs();
    if (currentTabs.length === 1) {
      return;
    }

    const closedIndex = currentTabs.findIndex((tab) => tab.id === tabId);
    const remaining = currentTabs.filter((tab) => tab.id !== tabId);
    this.tabs.set(remaining);
    this.reuseStrategy.clearTab(tabId);

    if (this.activeTabId() !== tabId) {
      return;
    }

    const nextTab = remaining[Math.min(closedIndex, remaining.length - 1)];
    this.activeTabId.set(nextTab.id);
    void this.navigate(nextTab.path, nextTab.id);
  }

  private syncNavigation(event: NavigationEnd): void {
    const tree = this.router.parseUrl(event.urlAfterRedirects);
    const requestedTabId =
      tree.queryParams['workspaceTab'] as string | undefined;
    const activeId = requestedTabId ?? this.activeTabId();
    const path = event.urlAfterRedirects.split('?')[0].split('#')[0];

    if (!this.tabs().some((tab) => tab.id === activeId)) {
      return;
    }

    this.activeTabId.set(activeId);
    const metadata = this.metadata(path);
    this.tabs.update((tabs) =>
      tabs.map((tab) =>
        tab.id === activeId ? { ...tab, ...metadata, path } : tab,
      ),
    );

    if (!requestedTabId) {
      void this.navigate(path, activeId, true);
    }
  }

  private navigate(
    path: string,
    tabId: string,
    replaceUrl = false,
  ): Promise<boolean> {
    return this.router.navigate([path], {
      queryParams: { workspaceTab: tabId },
      replaceUrl,
    });
  }

  private metadata(path: string): Pick<WorkspaceTab, 'label' | 'icon'> {
    if (path.startsWith('/quotation/search')) {
      return { label: 'Search Quotes', icon: 'search' };
    }
    if (path.startsWith('/quotation/guided')) {
      return { label: 'New Quote (Guided)', icon: 'file-plus-2' };
    }
    if (path.startsWith('/quotation/staged')) {
      return { label: 'New Quote (Staged)', icon: 'file-plus-2' };
    }

    const entry = navEntry(navIdFromUrl(path));
    return { label: entry.label, icon: entry.icon };
  }
}
