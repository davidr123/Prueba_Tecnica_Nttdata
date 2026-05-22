import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

const PRODUCTS: Product[] = [
  { id: '001', name: 'Cuenta de ahorro', description: 'Cuenta de ahorro con interés', logo: 'https://img.icons8.com/fluency/48/merchant-account.png', date_release: '2026-01-15', date_revision: '2027-01-15' },
  { id: '002', name: 'Tarjeta de crédito', description: 'Gestión de créditos empresariales', logo: 'https://img.icons8.com/fluency/48/merchant-account.png', date_release: '2026-06-01', date_revision: '2027-06-01' },
  { id: '003', name: 'Cuenta Corriente', description: 'Cuenta para transacciones diarias', logo: 'https://img.icons8.com/fluency/48/merchant-account.png', date_release: '2026-03-10', date_revision: '2027-03-10' },
];

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let productService: { getAll: jest.Mock };
  let router: { navigate: jest.Mock };

  beforeEach(async () => {
    productService = {
      getAll: jest.fn().mockReturnValue(of({ data: PRODUCTS })),
    };
    router = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        { provide: ProductService, useValue: productService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Existe el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Carga de datos', () => {
    it('Debe llamar al getAll() al inicializar', () => {
      expect(productService.getAll).toHaveBeenCalledTimes(1);
    });

    it('Debe mostrar los productos cargados', () => {
      expect(component.paginatedProducts().length).toBe(PRODUCTS.length);
    });

    it('Debe establecer el mensaje de error cuando la llamada a la API falla', () => {
      const errMsg = 'No se pudo conectar con el servidor.';
      productService.getAll.mockReturnValue(throwError(() => ({ userMessage: errMsg })));

      fixture = TestBed.createComponent(ProductListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.errorMessage()).toBe(errMsg);
    });


  });

  describe('Filtrado de búsqueda', () => {
    it('Debe filtrar por nombre del producto (insensible a mayúsculas)', () => {
      component.searchTerm.set('ahorro');
      expect(component.paginatedProducts().length).toBe(1);
      expect(component.paginatedProducts()[0].name).toBe('Cuenta de ahorro');
    });

    it('Debe filtrar por descripción del producto', () => {
      component.searchTerm.set('créditos');
      expect(component.paginatedProducts().length).toBe(1);
    });

    it('Debe devolver todos los productos cuando el término de búsqueda está vacío', () => {
      component.searchTerm.set('');
      expect(component.paginatedProducts().length).toBe(PRODUCTS.length);
    });

    it('Debe devolver una lista vacía cuando ningún producto coincide', () => {
      component.searchTerm.set('zzz-no-match-xyz');
      expect(component.paginatedProducts().length).toBe(0);
    });

    it('Debe actualizar totalResults basado en los productos filtrados', () => {
      component.searchTerm.set('Cuenta');
      expect(component.totalResults()).toBe(2);
    });
  });

  describe('Paginación', () => {
    it('Debe establecer el tamaño de página predeterminado en 5', () => {
      expect(component.pageSize()).toBe(5);
    });

    it('Debe exponer las opciones de tamaño de página [5, 10, 20]', () => {
      expect(component.pageSizes).toEqual([5, 10, 20]);
    });

    it('Debe limitar paginatedProducts al tamaño de página', () => {
      const manyProducts: Product[] = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
        name: `Producto ${i}`,
        description: `Desc ${i}`,
        logo: '',
        date_release: '2020-01-01',
        date_revision: '2021-01-01',
      }));
      productService.getAll.mockReturnValue(of({ data: manyProducts }));

      fixture = TestBed.createComponent(ProductListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.pageSize.set(5);
      expect(component.paginatedProducts().length).toBe(5);

      component.pageSize.set(10);
      expect(component.paginatedProducts().length).toBe(10);
    });
  });


  describe('Navegación', () => {
    it('goToAddProduct debe navegar a /products/add', () => {
      component.goToAddProduct();
      expect(router.navigate).toHaveBeenCalledWith(['/products/add']);
    });

    it('goToEditProduct debe navegar a /products/edit/:id', () => {
      component.goToEditProduct('123');
      expect(router.navigate).toHaveBeenCalledWith(['/products/edit', '123']);
    });

    it('closeMenu debe limpiar el menú activo', () => {
      component.activeMenuId.set('abc');
      component.closeMenu();
      expect(component.activeMenuId()).toBeNull();
    });

    it('toggleMenu debe abrir y cerrar el menú', () => {
      const mockEvent = { stopPropagation: jest.fn() } as unknown as Event;
      component.toggleMenu(mockEvent, 'abc');
      expect(component.activeMenuId()).toBe('abc');
      component.toggleMenu(mockEvent, 'abc');
      expect(component.activeMenuId()).toBeNull();
    });
  });



});
