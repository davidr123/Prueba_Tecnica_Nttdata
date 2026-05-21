import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, Subject, map, catchError, of, takeUntil } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

function todayOrLaterValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const [year, month, day] = (control.value as string).split('-').map(Number);
  const selected = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected >= today ? null : { minDate: true };
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css',
})
export class ProductFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup;
  readonly editMode = signal(false);
  readonly loadingProduct = signal(false);
  submitting = false;
  loadError: string | null = null;
  submitError: string | null = null;

  get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const isEdit = !!id;
    this.editMode.set(isEdit);

    this.form = this.fb.group({
      id: [
        { value: id ?? '', disabled: isEdit },
        [Validators.required, Validators.minLength(3), Validators.maxLength(10)],
        isEdit ? [] : [this.idExistsValidator()],
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
      date_release: ['', [Validators.required, todayOrLaterValidator]],
      date_revision: [{ value: '', disabled: true }],
    });

    this.form
      .get('date_release')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((dateStr: string) => {
        if (dateStr) {
          const [y, m, d] = dateStr.split('-').map(Number);
          const revision = new Date(y + 1, m - 1, d);
          this.form
            .get('date_revision')!
            .setValue(revision.toISOString().split('T')[0]);
        } else {
          this.form.get('date_revision')!.setValue('');
        }
      });

    if (isEdit && id) {
      this.loadProduct(id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProduct(id: string): void {
    this.loadingProduct.set(true);
    this.productService.getById(id).subscribe({
      next: (product) => {
        this.form.patchValue({
          id: product.id,
          name: product.name,
          description: product.description,
          logo: product.logo,
          date_release: product.date_release,
        });
        this.loadingProduct.set(false);
      },
      error: (err) => {
        this.loadError = err.userMessage ?? 'No se pudo cargar el producto.';
        this.loadingProduct.set(false);
      },
    });
  }

  private idExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.length < 3) return of(null);
      return this.productService.checkId(control.value).pipe(
        map((exists) => (exists ? { idExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  onSubmit(): void {
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.submitError = null;

    const product: Product = this.form.getRawValue() as Product;
    const request$ = this.editMode()
      ? this.productService.update(product)
      : this.productService.create(product);

    request$.subscribe({
      next: () => this.router.navigate(['/products']),
      error: (err) => {
        this.submitError =
          err.userMessage ??
          (this.editMode()
            ? 'Error al actualizar el producto. Intente nuevamente.'
            : 'Error al crear el producto. Intente nuevamente.');
        this.submitting = false;
      },
    });
  }

  onReset(): void {
    this.form.reset();
    this.submitError = null;
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  isPending(field: string): boolean {
    return this.form.get(field)?.status === 'PENDING';
  }

  getError(field: string, error: string): boolean {
    return !!this.form.get(field)?.hasError(error);
  }
}

