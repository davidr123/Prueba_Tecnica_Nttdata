import { CanDeactivateFn } from '@angular/router';

export interface CanDeactivateComponent {
  canDeactivate(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<CanDeactivateComponent> = (component) => {
  if (component.canDeactivate()) {
    return true;
  }
  return confirm('Tienes cambios sin guardar. ¿Seguro que quieres salir?');
};
