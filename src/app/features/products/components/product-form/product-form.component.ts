import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { CanDeactivateComponent } from '../../../../core/guards/unsaved-changes.guard';
import { minDateTodayValidator } from '../../validators/min-date-today.validator';
import { productIdAsyncValidator } from '../../validators/product-id-async.validator';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css',
})
export class ProductFormComponent implements OnInit, CanDeactivateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly isLoadingProduct = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly editMode = signal(false);

  readonly form: FormGroup = this.fb.group({
    id: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(10)],
      [productIdAsyncValidator(this.productService)],
    ],
    name: [
      '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(100)],
    ],
    description: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(200)],
    ],
    logo: ['', [Validators.required]],
    date_release: ['', [Validators.required, minDateTodayValidator()]],
    date_revision: [{ value: '', disabled: true }],
  });

  get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');

    if (productId) {
      this.editMode.set(true);
      this.form.get('id')?.disable();
      this.form.get('id')?.clearAsyncValidators();
      this.form.get('id')?.updateValueAndValidity();
      this.loadProduct(productId);
    }

    this.form
      .get('date_release')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((date: string) => this.syncRevisionDate(date));
  }

  private loadProduct(id: string): void {
    this.isLoadingProduct.set(true);
    this.loadError.set(null);

    this.productService
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => {
          this.form.patchValue({
            id: product.id,
            name: product.name,
            description: product.description,
            logo: product.logo,
            date_release: product.date_release,
          });
          this.syncRevisionDate(product.date_release);
          this.isLoadingProduct.set(false);
        },
        error: (err) => {
          this.loadError.set(err?.userMessage ?? 'Error al cargar el producto.');
          this.isLoadingProduct.set(false);
        },
      });
  }

  private syncRevisionDate(dateStr: string): void {
    if (!dateStr) {
      this.form.get('date_revision')?.setValue('');
      return;
    }
    const release = new Date(dateStr + 'T00:00:00');
    release.setFullYear(release.getFullYear() + 1);
    this.form.get('date_revision')?.setValue(release.toISOString().split('T')[0]);
  }

  canDeactivate(): boolean {
    return !this.form?.dirty || this.isSubmitting();
  }

  onSubmit(): void {
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const product: Product = this.form.getRawValue() as Product;
    const request$ = this.editMode()
      ? this.productService.update(product)
      : this.productService.create(product);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.form.markAsPristine();
        this.isSubmitting.set(false);
        this.router.navigate(['/products']);
      },
      error: (err) => {
        this.submitError.set(err?.userMessage ?? 'Error al guardar el producto.');
        this.isSubmitting.set(false);
      },
    });
  }

  onReset(): void {
    if (!this.editMode()) {
      this.form.reset();
    } else {
      this.form.get('name')?.reset();
      this.form.get('description')?.reset();
      this.form.get('logo')?.reset();
      this.form.get('date_release')?.reset();
      this.form.get('date_revision')?.setValue('');
    }
    this.submitError.set(null);
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.hasError(error) && (ctrl.dirty || ctrl.touched));
  }

  get idPending(): boolean {
    return !!this.form.get('id')?.pending;
  }
}

