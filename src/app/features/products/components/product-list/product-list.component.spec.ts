import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Ahorro Plus', description: 'Cuenta de ahorro con interés', logo: 'http://example.com/logo1.png', date_release: '2020-01-15', date_revision: '2021-01-15' },
  { id: '2', name: 'Kárdex Empresarial', description: 'Gestión de créditos empresariales', logo: 'http://example.com/logo2.png', date_release: '2019-06-01', date_revision: '2020-06-01' },
  { id: '3', name: 'Cuenta Corriente', description: 'Cuenta para transacciones diarias', logo: 'http://example.com/logo3.png', date_release: '2021-03-10', date_revision: '2022-03-10' },
];

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let productServiceMock: { getAll: jest.Mock };

  beforeEach(async () => {
    productServiceMock = {
      getAll: jest.fn().mockReturnValue(of({ data: MOCK_PRODUCTS })),
    };

    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        { provide: ProductService, useValue: productServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Data loading', () => {
    it('should call productService.getAll on init', () => {
      expect(productServiceMock.getAll).toHaveBeenCalledTimes(1);
    });

    it('should display loaded products', () => {
      expect(component.displayedProducts().length).toBe(MOCK_PRODUCTS.length);
    });

    it('should set error message when API call fails', () => {
      const errMsg = 'No se pudo conectar con el servidor.';
      productServiceMock.getAll.mockReturnValue(throwError(() => ({ userMessage: errMsg })));

      fixture = TestBed.createComponent(ProductListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.error()).toBe(errMsg);
    });

    it('should use fallback error message when userMessage is absent', () => {
      productServiceMock.getAll.mockReturnValue(throwError(() => ({})));

      fixture = TestBed.createComponent(ProductListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.error()).toBeTruthy();
    });
  });

  describe('Search filtering', () => {
    it('should filter by product name (case-insensitive)', () => {
      component.searchTerm.set('ahorro');
      expect(component.displayedProducts().length).toBe(1);
      expect(component.displayedProducts()[0].name).toBe('Ahorro Plus');
    });

    it('should filter by product description', () => {
      component.searchTerm.set('créditos');
      expect(component.displayedProducts().length).toBe(1);
    });

    it('should return all products when search term is empty', () => {
      component.searchTerm.set('');
      expect(component.displayedProducts().length).toBe(MOCK_PRODUCTS.length);
    });

    it('should return empty list when no products match', () => {
      component.searchTerm.set('zzz-no-match-xyz');
      expect(component.displayedProducts().length).toBe(0);
    });

    it('should update totalResults based on filtered products', () => {
      component.searchTerm.set('Cuenta');
      expect(component.totalResults()).toBe(1);
    });
  });

  describe('Pagination', () => {
    it('should default page size to 5', () => {
      expect(component.pageSize()).toBe(5);
    });

    it('should expose pageSizeOptions [5, 10, 20]', () => {
      expect(component.pageSizeOptions).toEqual([5, 10, 20]);
    });

    it('should limit displayedProducts to pageSize', () => {
      const manyProducts: Product[] = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
        name: `Producto ${i}`,
        description: `Desc ${i}`,
        logo: '',
        date_release: '2020-01-01',
        date_revision: '2021-01-01',
      }));
      productServiceMock.getAll.mockReturnValue(of({ data: manyProducts }));

      fixture = TestBed.createComponent(ProductListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.pageSize.set(5);
      expect(component.displayedProducts().length).toBe(5);

      component.pageSize.set(10);
      expect(component.displayedProducts().length).toBe(10);
    });
  });

  describe('Logo / Avatar helpers', () => {
    it('getInitial should return the first letter uppercased', () => {
      expect(component.getInitial('ahorro')).toBe('A');
      expect(component.getInitial('kárdex')).toBe('K');
    });

    it('getAvatarColor should return a valid hex color', () => {
      const color = component.getAvatarColor('Ahorro Plus');
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('getAvatarColor should be deterministic for the same name', () => {
      expect(component.getAvatarColor('Test')).toBe(component.getAvatarColor('Test'));
    });

    it('onLogoError should mark a product as errored', () => {
      component.onLogoError('1');
      expect(component.hasLogoError('1')).toBe(true);
    });

    it('hasLogoError should return false for products without errors', () => {
      expect(component.hasLogoError('99')).toBe(false);
    });

    it('onLogoError should not affect other products', () => {
      component.onLogoError('1');
      expect(component.hasLogoError('2')).toBe(false);
    });
  });
});


describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Rendering', () => {
    it('should show empty message when products list is empty', () => {
      fixture.componentRef.setInput('products', []);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.empty')?.textContent).toContain('No hay productos registrados');
    });

    it('should show loading message when loading is true', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.loading')?.textContent).toContain('Cargando');
    });

    it('should render a row for each product', () => {
      fixture.componentRef.setInput('products', MOCK_PRODUCTS);
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(MOCK_PRODUCTS.length);
    });

    it('should display product name in the table', () => {
      fixture.componentRef.setInput('products', MOCK_PRODUCTS);
      fixture.detectChanges();

      const firstRow: HTMLElement = fixture.nativeElement.querySelector('tbody tr');
      expect(firstRow.textContent).toContain('Producto A');
    });
  });

});
