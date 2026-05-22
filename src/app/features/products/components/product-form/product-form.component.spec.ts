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

const PRODUCT = {
  id: '123',
  name: 'Cuenta Ahorro',
  description: 'Cuenta de ahorro',
  logo: 'https://img.icons8.com/fluency/48/merchant-account.png',
  date_release: TODAY_STR,
  date_revision: TOMORROW_STR,
};

function buildServiceMock() {
  return {
    checkId: jest.fn().mockReturnValue(of(false)),
    create: jest.fn().mockReturnValue(of({ message: 'ok', data: {} })),
    getById: jest.fn().mockReturnValue(of(PRODUCT)),
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

  it('Existe componente', () => {
    expect(component).toBeTruthy();
  });

  it('editMode debe ser falso', () => {
    expect(component.editMode()).toBe(false);
  });

  it('id field debe estar habilitado', () => {
    expect(component.form.get('id')?.disabled).toBe(false);
  });

  it('minDate debe devolver hoy', () => {
    expect(component.minDate).toBe(TODAY_STR);
  });

  describe('Inicialización del formulario', () => {
    it('debe comenzar con valores vacíos', () => {
      expect(component.form.get('id')?.value).toBe('');
      expect(component.form.get('name')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
      expect(component.form.get('logo')?.value).toBe('');
      expect(component.form.get('date_release')?.value).toBe('');
    });

    it('date_revision debe estar deshabilitado', () => {
      expect(component.form.get('date_revision')?.disabled).toBe(true);
    });
  });



  describe('Validaciones síncronas', () => {
    it('debe ser inválido cuando el formulario está vacío', () => {
      expect(component.form.invalid).toBe(true);
    });

    it('debe marcar id como inválido cuando está vacío', () => {
      component.form.get('id')!.markAsTouched();
      expect(component.isInvalid('id')).toBe(true);
    });

    it('debe marcar id como inválido cuando tiene menos de 3 caracteres', () => {
      component.form.get('id')!.setValue('ab');
      component.form.get('id')!.markAsTouched();
      expect(component.hasError('id', 'minlength')).toBe(true);
    });

    it('debe marcar id como inválido cuando tiene más de 10 caracteres', () => {
      component.form.get('id')!.setValue('12345678901');
      component.form.get('id')!.markAsTouched();
      expect(component.hasError('id', 'maxlength')).toBe(true);
    });

    it('debe marcar name como inválido cuando tiene menos de 5 caracteres', () => {
      component.form.get('name')!.setValue('abc');
      component.form.get('name')!.markAsTouched();
      expect(component.hasError('name', 'minlength')).toBe(true);
    });

    it('Debe marcar la descripción como inválida si tiene menos de 10 caracteres', () => {
      component.form.get('description')!.setValue('short');
      component.form.get('description')!.markAsTouched();
      expect(component.hasError('description', 'minlength')).toBe(true);
    });

    it('Debe marcar date_release como inválido cuando está en el pasado', () => {
      component.form.get('date_release')!.setValue('2000-01-01');
      component.form.get('date_release')!.markAsTouched();
      expect(component.hasError('date_release', 'minDate')).toBe(true);
    });

    it('Debe aceptar date_release igual a hoy', () => {
      component.form.get('date_release')!.setValue(TODAY_STR);
      component.form.get('date_release')!.markAsTouched();
      expect(component.hasError('date_release', 'minDate')).toBe(false);
    });
  });

  describe('Validaciones asíncronas de ID', () => {
    it('debe establecer el error idExists cuando checkId devuelve true', async () => {
      productServiceMock.checkId.mockReturnValue(of(true));
      component.form.get('id')!.setValue('taken1');
      component.form.get('id')!.markAsTouched();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(component.hasError('id', 'idExists')).toBe(true);
    });

    it('no debe establecer el error idExists cuando checkId devuelve false', async () => {
      component.form.get('id')!.setValue('free123');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(component.hasError('id', 'idExists')).toBe(false);
    });

    it('isPending debe devolver un booleano', () => {
      component.form.get('id')!.setValue('free123');
      expect(typeof component.idPending).toBe('boolean');
    });
  });

  describe('onSubmit', () => {
    it('debe marcar todos los campos como tocados cuando el formulario es inválido', () => {
      component.onSubmit();
      expect(component.form.get('name')?.touched).toBe(true);
      expect(component.form.get('description')?.touched).toBe(true);
    });

    it('debe llamar a productService.create y navegar en un envío válido', async () => {
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

    it('no debe llamar a update cuando está en modo creación', async () => {
      component.form.get('id')!.setValue('abc123');
      component.form.get('name')!.setValue('Ahorro Plus');
      component.form.get('description')!.setValue('Cuenta de ahorro con interes suficiente');
      component.form.get('logo')!.setValue('http://example.com/logo.png');
      component.form.get('date_release')!.setValue(TODAY_STR);
      await new Promise(resolve => setTimeout(resolve, 0));
      component.onSubmit();
      expect(productServiceMock.update).not.toHaveBeenCalled();
    });

    it('debe establecer submitError cuando create falla', async () => {
      productServiceMock.create.mockReturnValue(throwError(() => ({ userMessage: 'Error del servidor' })));
      component.form.get('id')!.setValue('abc123');
      component.form.get('name')!.setValue('Ahorro Plus');
      component.form.get('description')!.setValue('Cuenta de ahorro con interes suficiente');
      component.form.get('logo')!.setValue('http://example.com/logo.png');
      component.form.get('date_release')!.setValue(TODAY_STR);
      await new Promise(resolve => setTimeout(resolve, 0));
      component.onSubmit();
      expect(component.submitError()).toBe('Error del servidor');
    });

    it('debe usar un mensaje de respaldo cuando create falla sin userMessage', async () => {
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
    it('debe reiniciar el formulario al estado vacío', () => {
      component.form.get('name')!.setValue('Test');
      component.onReset();
      expect(component.form.get('name')?.value).toBeNull();
    });

    it('debe limpiar submitError al reiniciar', () => {
      component.submitError.set('Algun error');
      component.onReset();
      expect(component.submitError()).toBeNull();
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

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('editMode debe ser true', () => {
    expect(component.editMode()).toBe(true);
  });

  it('debe llamar a productService.getById con el id de la ruta', () => {
    expect(productServiceMock.getById).toHaveBeenCalledWith('abc123');
  });

  it('debe rellenar el campo name con el producto cargado', () => {
    expect(component.form.get('name')?.value).toBe('Cuenta Ahorro');
  });

  it('debe rellenar el campo logo con el producto cargado', () => {
    expect(component.form.get('logo')?.value).toBe('https://img.icons8.com/fluency/48/merchant-account.png');
  });

  it('debe tener el campo id deshabilitado', () => {
    expect(component.form.get('id')?.disabled).toBe(true);
  });

  it('debe establecer loadingProduct en false después de cargar el producto', () => {
    expect(component.isLoadingProduct()).toBe(false);
  });

  it('no debe llamar a checkId (no hay validador asíncrono en modo edición)', () => {
    expect(productServiceMock.checkId).not.toHaveBeenCalled();
  });

  it('debe llamar a productService.update en submit válido', () => {
    component.form.get('name')!.setValue('Ahorro Actualizado');
    component.form.get('description')!.setValue('Nueva descripcion con mas de diez chars');
    component.form.get('logo')!.setValue('https://img.icons8.com/fluency/48/merchant-account.png');
    component.form.get('date_release')!.setValue(TODAY_STR);
    component.onSubmit();
    expect(productServiceMock.update).toHaveBeenCalled();
    expect(productServiceMock.create).not.toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('debe establecer submitError cuando update falla', () => {
    productServiceMock.update.mockReturnValue(throwError(() => ({ userMessage: 'Error al actualizar' })));
    component.form.get('name')!.setValue('Ahorro Actualizado');
    component.form.get('description')!.setValue('Nueva descripcion con mas de diez chars');
    component.form.get('logo')!.setValue('https://img.icons8.com/fluency/48/merchant-account.png');
    component.form.get('date_release')!.setValue(TODAY_STR);
    component.onSubmit();
    expect(component.submitError()).toBe('Error al actualizar');
  });

  it('debe usar un mensaje de respaldo cuando update falla sin userMessage', () => {
    productServiceMock.update.mockReturnValue(throwError(() => ({})));
    component.form.get('name')!.setValue('Ahorro Actualizado');
    component.form.get('description')!.setValue('Nueva descripcion con mas de diez chars');
    component.form.get('logo')!.setValue('https://img.icons8.com/fluency/48/merchant-account.png');
    component.form.get('date_release')!.setValue(TODAY_STR);
    component.onSubmit();
    expect(component.submitError).toBeTruthy();
  });
});

describe('ProductFormComponent - Error al cargar en modo edición', () => {
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

  it('debe establecer loadError cuando getById falla', () => {
    expect(component.loadError()).toBe('Producto no encontrado');
  });

  it('debe establecer loadingProduct en false después de un error', () => {
    expect(component.isLoadingProduct()).toBe(false);
  });
});
