import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, catchError, map, of } from 'rxjs';
import { ProductService } from '../services/product.service';

export function productIdAsyncValidator(
  productService: ProductService
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value || control.value.length < 3) return of(null);

    return productService.checkId(control.value).pipe(
      map((exists) => (exists ? { idExists: true } : null)),
      catchError(() => of(null))
    );
  };
}
