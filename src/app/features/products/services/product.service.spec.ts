import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProductService } from './product.service';
import { Product } from '../models/product.model';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

const product: Product = {
  id: '100',
  name: 'Cuenta de ahorro',
  description: 'transaccionalidad diaria',
  logo: 'https://example.com/logo.png',
  date_release: '2026-02-01',
  date_revision: '2027-02-01',
};

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('Instancia del servicio', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll()', () => {
    it('Obtener todos los productos', () => {
      const mockResponse = { data: [product] };
      service.getAll().subscribe(res => {
        expect(res.data.length).toBe(1);
        expect(res.data[0].id).toBe('100');
      });
      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getById()', () => {
    it('Obtener producto por id', () => {
      service.getById('100').subscribe(product => {
        expect(product.name).toBe('Cuenta de ahorro');
      });
      const req = httpMock.expectOne(`${BASE_URL}/100`);
      expect(req.request.method).toBe('GET');
      req.flush(product);
    });
  });

  describe('checkId()', () => {
    it('Verificar si el id ya existe', () => {
      service.checkId('100').subscribe(exists => {
        expect(exists).toBe(true);
      });
      const req = httpMock.expectOne(`${BASE_URL}/verification/100`);
      expect(req.request.method).toBe('GET');
      req.flush(true);
    });

    it('devuelve false si el id no existe', () => {
      service.checkId('new-id').subscribe(exists => {
        expect(exists).toBe(false);
      });
      const req = httpMock.expectOne(`${BASE_URL}/verification/new-id`);
      req.flush(false);
    });
  });


  it('Crear Producto tipo POST', () => {
    service.create(product).subscribe(res => {
      expect(res.message).toBe('Producto creado correctamente');
    });
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(product);
    req.flush({ message: 'Producto creado correctamente', data: product });
  });


  it('debería enviar PUT sin id en el body en update()', () => {

    const producto: Product = {
      id: '001',
      name: 'Editado',
      description: 'Desc editada',
      logo: 'logo.png',
      date_release: '2025-01-01',
      date_revision: '2026-01-01'
    };

    service.update(producto).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/001`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).not.toHaveProperty('id');
    expect(req.request.body.name).toBe('Editado');
    req.flush({ message: 'ok', data: producto });
  });


});
