import { Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductFormComponent } from './components/product-form/product-form.component';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    component: ProductListComponent,
  },
  {
    path: 'add',
    component: ProductFormComponent,
  },
  {
    path: 'edit/:id',
    component: ProductFormComponent,
  },
];
