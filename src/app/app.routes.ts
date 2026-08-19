import { Routes } from '@angular/router';

import { Dashboard } from './dashboard/dashboard';
import { ModulePlaceholder } from './modules/module-placeholder';
import { QuotationV2 } from './quotation/v2/quotation-v2';
import { QuotationV3 } from './quotation/v3/quotation-v3';
import { QuotationSearchPage } from './quotation/shared/quotation-search-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: Dashboard, title: 'Dashboard' },
  { path: 'quotation', pathMatch: 'full', redirectTo: 'quotation/guided/new' },
  { path: 'quotation/guided', pathMatch: 'full', redirectTo: 'quotation/guided/new' },
  { path: 'quotation/staged', pathMatch: 'full', redirectTo: 'quotation/staged/new' },
  { path: 'quotation/search', component: QuotationSearchPage, title: 'Search Quotes' },
  { path: 'quotation/guided/new', component: QuotationV2, title: 'New Quote (Guided)' },
  { path: 'quotation/guided/search', pathMatch: 'full', redirectTo: 'quotation/search' },
  { path: 'quotation/guided/quote/:number', component: QuotationV2, title: 'Quote (Guided)' },
  { path: 'quotation/staged/new', component: QuotationV3, title: 'New Quote (Staged)' },
  { path: 'quotation/staged/search', pathMatch: 'full', redirectTo: 'quotation/search' },
  { path: 'quotation/staged/quote/:number', component: QuotationV3, title: 'Quote (Staged)' },
  { path: 'module/:id', component: ModulePlaceholder, title: 'Module' },
  { path: '**', redirectTo: 'dashboard' },
];
