import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function minDateTodayValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const [year, month, day] = (control.value as string).split('-').map(Number);
    const selected = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selected >= today ? null : { minDate: true };
  };
}
