import { Component, OnInit, DestroyRef, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { TooltipIconComponent } from '../../../../shared/components/tooltip-icon/tooltip-icon.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, TooltipIconComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
  host: { '(document:click)': 'closeMenu()' },
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly products = signal<Product[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly pageSize = signal(5);
  readonly activeMenuId = signal<string | null>(null);

  readonly searchControl = new FormControl('');
  readonly pageSizes = [5, 10, 20];
  readonly logoErrors = new Set<string>();

  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.products();
    return this.products().filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
  });

  readonly totalResults = computed(() => this.filteredProducts().length);
  readonly paginatedProducts = computed(() => this.filteredProducts().slice(0, this.pageSize())
  );

  ngOnInit(): void {
    this.setupSearch();
    this.loadProducts();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => this.searchTerm.set(term ?? ''));
  }

  private loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.productService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err?.userMessage ?? 'Error al cargar los productos.');
          this.isLoading.set(false);
        },
      });
  }

  onPageSizeChange(event: Event): void {
    this.pageSize.set(parseInt((event.target as HTMLSelectElement).value, 10));
  }

  onLogoError(productId: string): void {
    this.logoErrors.add(productId);
  }

  hasLogoError(productId: string): boolean {
    return this.logoErrors.has(productId);
  }

  getLogoInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  toggleMenu(event: Event, productId: string): void {
    event.stopPropagation();
    this.activeMenuId.set(this.activeMenuId() === productId ? null : productId);
  }

  closeMenu(): void {
    this.activeMenuId.set(null);
  }

  editProduct(event: Event, productId: string): void {
    event.stopPropagation();
    this.goToEditProduct(productId);
    this.closeMenu();
  }

  goToAddProduct(): void {
    this.router.navigate(['/products/add']);
  }

  goToEditProduct(productId: string): void {
    this.router.navigate(['/products/edit', productId]);
  }
}
