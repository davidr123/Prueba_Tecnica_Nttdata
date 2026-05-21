import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProductFormComponent } from './product-form.component';
import { ProductService } from '../../services/product.service';

const TODAY = new Date();
const TODAY_STR = TODAY.toISOString().split('T')[0];
const TOMORROW = new Date(TODAY);
TOMORROW.setDate(TODAY.getDate() + 1);
const TOMORROW_STR = TOMORROW.toISOString().split('T')[0];

const MOCK_PRODUCT = {
  id: 'abc123',
  name: 'Ahorro Plus',
  description: 'Cuenta de ahorro con interes suficiente',
  logo: 'http://example.com/logo.png',
  date_release: TODAY_STR,
  date_revision: TOMORROW_STR,
};

function buildServiceMock() {
  return {
    checkId: jest.fn().mockReturnValue(of(false)),
    create: jest.fn().mockReturnValue(of({ message: 'ok', data: {} })),
    getById: jest.fn().mockReturnValue(of(MOCK_PRODUCT)),
    update: jest.fn().mockReturnValue(of({ message: 'ok', data: {} })),
  };
}

describe('ProductFormComponent - Create mode', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let productServiceMock: ReturnType<typeof buildServiceMock>;
  let routerMock: { navigate: jest.Mock };

  beforeEach(async () => {
    productServiceMock = buildServiceMock();
    routerMock = { navigate: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      providers: [
        { provide: ProductService, useValue: productServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('editMode should be false', () => {
    expect(component.editMode()).toBe(false);
  });

  it('id field should be enabled', () => {
    expect(component.form.get('id')?.disabled).toBe(false);
  });

  it('minDate should return today', () => {
    expect(component.minDate).toBe(TODAY_STR);
  });

  describe('Form initialization', () => {
    it('should start with empty values', () => {
      expect(component.form.get('id')?.value).toBe('');
      expect(component.form.get('name')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
      expect(component.form.get('logo')?.value).toBe('');
      expect(component.form.get('date_release')?.value).toBe('');
    });

    it('should have date_revision disabled', () => {
      expect(component.form.get('date_revision')?.disabled).toBe(true);
    });
  });

  describe('date_revision auto-calculation', () => {
    it('should set date_revision to 1 year after date_release', () => {
      component.form.get('date_release')!.setValue('2025-03-15');
      expect(component.form.get('date_revision')!.value).toBe('2026-03-15');
    });

    it('should clear date_revision when date_release is cleared', () => {
      component.form.get('date_release')!.setValue('2025-01-01');
      component.form.get('date_release')!.setValue('');
      expect(component.form.get('date_revision')!.value).toBe('');
    });
  });

  describe('Sync validations', () => {
    it('should be invalid when form is empty', () => {
      expect(component.form.invalid).toBe(true);
    });

    it('should mark id invalid when empty', () => {
      component.form.get('id')!.markAsTouched();
      expect(component.isInvalid('id')).toBe(true);
    });

    it('should mark id invalid when shorter than 3 chars', () => {
      component.form.get('id')!.setValue('ab');
      component.form.get('id')!.markAsTouched();
      expect(component.getError('id', 'minlength')).toBe(true);
    });

    it('should mark id invalid when longer than 10 chars', () => {
      component.form.get('id')!.setValue('12345678901');
      component.form.get('id')!.markAsTouched();
      expect(component.getError('id', 'maxlength')).toBe(true);
    });

    it('should mark name invalid when shorter than 5 chars', () => {
      component.form.get('name')!.setValue('abc');
      component.form.get('name')!.markAsTouched();
      expect(component.getError('name', 'minlength')).toBe(true);
    });

    it('should mark description invalid when shorter than 10 chars', () => {
      component.form.get('description')!.setValue('short');
      component.form.get('description')!.markAsTouched();
      expect(component.getError('description', 'minlength')).toBe(true);
    });

    it('should mark date_release invalid when in the past', () => {
      component.form.get('date_release')!.setValue('2000-01-01');
      component.form.get('date_release')!.markAsTouched();
      expect(component.getError('date_release', 'minDate')).toBe(true);
    });

    it('should accept date_release equal to today', () => {
      component.form.get('date_release')!.setValue(TODAY_STR);
      component.form.get('date_release')!.markAsTouched();
      expect(component.getError('date_release', 'minDate')).toBe(false);
    });
  });

  describe('Async ID validation', () => {
    it('should set idExists error when checkId returns true', async () => {
      productServiceMock.checkId.mockReturnValue(of(true));
      component.form.get('id')!.setValue('taken1');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(component.getError('id', 'idExists')).toBe(true);
    });

    it('should not set idExists error when checkId returns false', async () => {
      component.form.get('id')!.setValue('free123');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(component.getError('id', 'idExists')).toBe(false);
    });

    it('isPending should return a boolean', () => {
      component.form.get('id')!.setValue('free123');
      expect(typeof component.isPending('id')).toBe('boolean');
    });
  });

  describe('onSubmit', () => {
    it('should mark all fields touched when form is invalid', () => {
      component.onSubmit();
      expect(component.form.get('name')?.touched).toBe(true);
      expect(component.form.get('description')?.touched).toBe(true);
    });

    it('should call productService.create and navigate on valid submit', async () => {
      component.form.get('id')!.setValue('abc123');
      component.form.get('name')!.setValue('Ahorro Plus');
      component.form.get('description')!.setValue('Cuenta de ahorro con interes suficiente');
      component.form.get('logo')!.setValue('http://example.com/logo.png');
      component.form.get('date_release')!.setValue(TODAY_STR);
      await new Promise(resolve => setTimeout(resolve, 0));
      component.onSubmit();
      expect(productServiceMock.create).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/products']);
    });

    it('should NOT call update when in create mode', async () => {
      component.form.get('id')!.setValue('abc123');
      component.form.get('name')!.setValue('Ahorro Plus');
      component.form.get('description')!.setValue('Cuenta de ahorro con interes suficiente');
      component.form.get('logo')!.setValue('http://example.com/logo.png');
      component.form.get('date_release')!.setValue(TODAY_STR);
      await new Promise(resolve => setTimeout(resolve, 0));
      component.onSubmit();
      expect(productServiceMock.update).not.toHaveBeenCalled();
    });

    it('should set submitError when create fails', async () => {
      productServiceMock.create.mockReturnValue(throwError(() => ({ userMessage: 'Error del servidor' })));
      component.form.get('id')!.setValue('abc123');
      component.form.get('name')!.setValue('Ahorro Plus');
      component.form.get('description')!.setValue('Cuenta de ahorro con interes suficiente');
      component.form.get('logo')!.setValue('http://example.com/logo.png');
      component.form.get('date_release')!.setValue(TODAY_STR);
      await new Promise(resolve => setTimeout(resolve, 0));
      component.onSubmit();
      expect(component.submitError).toBe('Error del servidor');
    });

    it('should use fallback message when create fails without userMessage', async () => {
      productServiceMock.create.mockReturnValue(throwError(() => ({})));
      component.form.get('id')!.setValue('abc123');
      component.form.get('name')!.setValue('Ahorro Plus');
      component.form.get('description')!.setValue('Cuenta de ahorro con interes suficiente');
      component.form.get('logo')!.setValue('http://example.com/logo.png');
      component.form.get('date_release')!.setValue(TODAY_STR);
      await new Promise(resolve => setTimeout(resolve, 0));
      component.onSubmit();
      expect(component.submitError).toBeTruthy();
    });
  });

  describe('onReset', () => {
    it('should reset the form to empty state', () => {
      component.form.get('name')!.setValue('Test');
      component.onReset();
      expect(component.form.get('name')?.value).toBeNull();
    });

    it('should clear submitError on reset', () => {
      component.submitError = 'Algun error';
      component.onReset();
      expect(component.submitError).toBeNull();
    });
  });

  describe('isInvalid / getError helpers', () => {
    it('should return false when field is valid and touched', () => {
      component.form.get('name')!.setValue('Nombre valido largo');
      component.form.get('name')!.markAsTouched();
      expect(component.isInvalid('name')).toBe(false);
    });

    it('should return false when field is invalid but not touched', () => {
      expect(component.isInvalid('name')).toBe(false);
    });

    it('should return true when field is invalid and touched', () => {
      component.form.get('name')!.markAsTouched();
      expect(component.isInvalid('name')).toBe(true);
    });

    it('getError should return false for non-existing error', () => {
      expect(component.getError('name', 'nonExistentError')).toBe(false);
    });
  });
});

describe('ProductFormComponent - Edit mode', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let productServiceMock: ReturnType<typeof buildServiceMock>;
  let routerMock: { navigate: jest.Mock };

  beforeEach(async () => {
    productServiceMock = buildServiceMock();
    routerMock = { navigate: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      providers: [
        { provide: ProductService, useValue: productServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'abc123' } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('editMode should be true', () => {
    expect(component.editMode()).toBe(true);
  });

  it('should call productService.getById with the route id', () => {
    expect(productServiceMock.getById).toHaveBeenCalledWith('abc123');
  });

  it('should pre-fill name field with loaded product', () => {
    expect(component.form.get('name')?.value).toBe('Ahorro Plus');
  });

  it('should pre-fill logo field with loaded product', () => {
    expect(component.form.get('logo')?.value).toBe('http://example.com/logo.png');
  });

  it('should have id field disabled', () => {
    expect(component.form.get('id')?.disabled).toBe(true);
  });

  it('should set loadingProduct to false after product loads', () => {
    expect(component.loadingProduct()).toBe(false);
  });

  it('should not call checkId (no async validator in edit mode)', () => {
    expect(productServiceMock.checkId).not.toHaveBeenCalled();
  });

  it('should call productService.update on valid submit', () => {
    component.form.get('name')!.setValue('Ahorro Actualizado');
    component.form.get('description')!.setValue('Nueva descripcion con mas de diez chars');
    component.form.get('logo')!.setValue('http://example.com/logo.png');
    component.form.get('date_release')!.setValue(TODAY_STR);
    component.onSubmit();
    expect(productServiceMock.update).toHaveBeenCalled();
    expect(productServiceMock.create).not.toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should set submitError when update fails', () => {
    productServiceMock.update.mockReturnValue(throwError(() => ({ userMessage: 'Error al actualizar' })));
    component.form.get('name')!.setValue('Ahorro Actualizado');
    component.form.get('description')!.setValue('Nueva descripcion con mas de diez chars');
    component.form.get('logo')!.setValue('http://example.com/logo.png');
    component.form.get('date_release')!.setValue(TODAY_STR);
    component.onSubmit();
    expect(component.submitError).toBe('Error al actualizar');
  });

  it('should use fallback message when update fails without userMessage', () => {
    productServiceMock.update.mockReturnValue(throwError(() => ({})));
    component.form.get('name')!.setValue('Ahorro Actualizado');
    component.form.get('description')!.setValue('Nueva descripcion con mas de diez chars');
    component.form.get('logo')!.setValue('http://example.com/logo.png');
    component.form.get('date_release')!.setValue(TODAY_STR);
    component.onSubmit();
    expect(component.submitError).toBeTruthy();
  });
});

describe('ProductFormComponent - Edit mode load error', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let productServiceMock: ReturnType<typeof buildServiceMock>;

  beforeEach(async () => {
    productServiceMock = buildServiceMock();
    productServiceMock.getById.mockReturnValue(
      throwError(() => ({ userMessage: 'Producto no encontrado' }))
    );
    await TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      providers: [
        { provide: ProductService, useValue: productServiceMock },
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'bad-id' } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set loadError when getById fails', () => {
    expect(component.loadError).toBe('Producto no encontrado');
  });

  it('should set loadingProduct to false after error', () => {
    expect(component.loadingProduct()).toBe(false);
  });
});
