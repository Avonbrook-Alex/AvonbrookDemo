import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  RouteReuseStrategy,
} from '@angular/router';

@Injectable({ providedIn: 'root' })
export class WorkspaceRouteReuseStrategy implements RouteReuseStrategy {
  private readonly handles = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return Boolean(route.component && this.tabId(route));
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    const key = this.key(route);
    if (key && handle) {
      this.handles.set(key, handle);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const key = this.key(route);
    return Boolean(key && this.handles.has(key));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const key = this.key(route);
    return key ? this.handles.get(key) ?? null : null;
  }

  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    current: ActivatedRouteSnapshot,
  ): boolean {
    return (
      future.routeConfig === current.routeConfig &&
      this.tabId(future) === this.tabId(current)
    );
  }

  clearTab(tabId: string): void {
    for (const key of this.handles.keys()) {
      if (key.startsWith(`${tabId}:`)) {
        this.handles.delete(key);
      }
    }
  }

  private key(route: ActivatedRouteSnapshot): string | null {
    const tabId = this.tabId(route);
    if (!tabId) {
      return null;
    }

    const path = route.pathFromRoot
      .flatMap((snapshot) => snapshot.url.map((segment) => segment.path))
      .join('/');
    return `${tabId}:/${path}`;
  }

  private tabId(route: ActivatedRouteSnapshot): string | null {
    return route.queryParamMap.get('workspaceTab');
  }
}
