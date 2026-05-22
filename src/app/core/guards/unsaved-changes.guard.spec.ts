import { TestBed } from '@angular/core/testing';
import { CanDeactivateComponent, unsavedChangesGuard } from './unsaved-changes.guard';

describe('unsavedChangesGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('debe devolver true cuando canDeactivate() es true', () => {
    const component: CanDeactivateComponent = { canDeactivate: () => true };
    const result = TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(component, null!, null!, null!)
    );
    expect(result).toBe(true);
  });

  it('debe devolver true cuando canDeactivate() es false y el usuario confirma', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const component: CanDeactivateComponent = { canDeactivate: () => false };
    const result = TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(component, null!, null!, null!)
    );
    expect(result).toBe(true);
    (window.confirm as jest.Mock).mockRestore();
  });

  it('debe devolver false cuando canDeactivate() es false y el usuario cancela', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    const component: CanDeactivateComponent = { canDeactivate: () => false };
    const result = TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(component, null!, null!, null!)
    );
    expect(result).toBe(false);
    (window.confirm as jest.Mock).mockRestore();
  });
});
