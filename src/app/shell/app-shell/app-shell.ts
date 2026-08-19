import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { filter } from 'rxjs/operators';

import { IconOfPipe } from '../../shared/icon';
import {
  NAV_DEFAULT_OPEN,
  NAV_SECTIONS,
  type NavItem,
  crumbsFor,
  navEntry,
  navIdFromUrl,
  routerPathFor,
} from '../nav.model';
import { WorkspaceTabsService } from '../workspace-tabs.service';

interface SidebarRow {
  item: NavItem;
  isOpen: boolean;
  isActive: boolean;
  path: string;
}

/**
 * Application shell reproducing the legacy standalone Fortuna DMS layout:
 * left sidebar navigation, top search/header bar, workspace tab + breadcrumb
 * strip, routed content area, right "Fortuna AI" rail, and bottom status bar.
 * Hosts the Angular router outlet so every page shares the same chrome
 * instead of duplicating it per route.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, IconOfPipe, LucideDynamicIcon],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly navSections = NAV_SECTIONS;
  protected readonly workspaceTabs = inject(WorkspaceTabsService);

  protected readonly activeId = signal(navIdFromUrl(this.router.url));
  protected readonly sidebarCollapsed = signal(false);
  protected readonly notifOpen = signal(false);
  protected readonly aiPanelOpen = signal(true);
  protected readonly dbLatency = signal(8);
  protected readonly activeJobs = signal(44);
  private readonly openNavItems = signal<ReadonlySet<string>>(new Set(NAV_DEFAULT_OPEN));

  protected readonly activeEntry = computed(() => navEntry(this.activeId()));
  protected readonly breadcrumbs = computed(() => crumbsFor(this.activeId()));

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.activeId.set(navIdFromUrl((event as NavigationEnd).urlAfterRedirects));
    });
    const latencyTimer = window.setInterval(() => {
      this.dbLatency.set(Math.max(4, Math.min(24, this.dbLatency() + Math.floor(Math.random() * 7) - 3)));
    }, 3_000);
    const jobsTimer = window.setInterval(() => {
      if (Math.random() > 0.55) {
        this.activeJobs.update((jobs) => Math.max(38, Math.min(52, jobs + (Math.random() > 0.45 ? 1 : -1))));
      }
    }, 45_000);
    this.destroyRef.onDestroy(() => {
      window.clearInterval(latencyTimer);
      window.clearInterval(jobsTimer);
    });
  }

  protected sidebarRows(items: NavItem[]): SidebarRow[] {
    const activeId = this.activeId();
    return items.map((item) => {
      const childActive = (item.children ?? []).some((child) => child.id === activeId);
      return {
        item,
        isOpen: this.openNavItems().has(item.id) || childActive,
        isActive: item.id === activeId || childActive,
        path: routerPathFor(item.id),
      };
    });
  }

  protected childPath(id: string): string {
    return routerPathFor(id);
  }

  protected navigateInActiveTab(path: string): void {
    this.workspaceTabs.replaceActive(path);
  }

  protected activateSidebarRow(row: SidebarRow): void {
    if (row.item.children) {
      if (this.sidebarCollapsed()) {
        this.sidebarCollapsed.set(false);
        this.openNavItems.update((current) => new Set(current).add(row.item.id));
        return;
      }
      this.openNavItems.update((current) => {
        const next = new Set(current);
        if (next.has(row.item.id)) {
          next.delete(row.item.id);
        } else {
          next.add(row.item.id);
        }
        return next;
      });
      return;
    }
    this.navigateInActiveTab(row.path);
  }

  protected isChildActive(id: string): boolean {
    return this.activeId() === id;
  }

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  protected toggleNotifications(): void {
    this.notifOpen.update((open) => !open);
  }

  protected toggleAiPanel(): void {
    this.aiPanelOpen.update((open) => !open);
  }

  protected closeAiPanel(): void {
    this.aiPanelOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.notifOpen()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-notif-scope]')) {
      return;
    }
    this.notifOpen.set(false);
  }
}
