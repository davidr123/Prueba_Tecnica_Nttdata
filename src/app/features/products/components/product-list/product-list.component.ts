import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly pageSize = signal(5);
  readonly pageSizeOptions = [5, 10, 20];

  private readonly allProducts = signal<Product[]>([]);
  private readonly logoErrors = signal<Set<string>>(new Set());

  private readonly allFiltered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const products = this.allProducts();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
  });

  readonly totalResults = computed(() => this.allFiltered().length);
  readonly displayedProducts = computed(() =>
    this.allFiltered().slice(0, this.pageSize())
  );

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService.getAll().subscribe({
      next: (response) => {
        this.allProducts.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.userMessage ?? 'Error al cargar los productos. Intente nuevamente.');
        this.loading.set(false);
      },
    });
  }

  onSearchChange(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onPageSizeChange(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
  }

  onLogoError(productId: string): void {
    this.logoErrors.update((errors) => new Set([...errors, productId]));
  }

  hasLogoError(productId: string): boolean {
    return this.logoErrors().has(productId);
  }

  getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  getAvatarColor(name: string): string {
    const palette = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#06b6d4', '#f97316', '#6366f1',
    ];
    return palette[name.charCodeAt(0) % palette.length];
  }

  readonly openMenuId = signal<string | null>(null);

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openMenuId.set(null);
  }

  toggleMenu(productId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId.update((id) => (id === productId ? null : productId));
  }

  goToEdit(productId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId.set(null);
    this.router.navigate(['/products/edit', productId]);
  }

  goToAdd(): void {
    this.router.navigate(['/products/add']);
  }
}
