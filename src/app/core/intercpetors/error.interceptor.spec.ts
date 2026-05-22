import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpInterceptor: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpInterceptor = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpInterceptor.verify());

  it('debe establecer userMessage para status 0 (sin conexión)', (done) => {
    http.get('/test').subscribe({
      error: (err) => {
        expect(err.userMessage).toBe('No se pudo conectar con el servidor. Verifique su conexión.');
        done();
      },
    });
    httpInterceptor.expectOne('/test').error(new ProgressEvent('error'), { status: 0 });
  });

  it('debe establecer userMessage para status 404', (done) => {
    http.get('/test').subscribe({
      error: (err) => {
        expect(err.userMessage).toBe('El recurso solicitado no fue encontrado.');
        done();
      },
    });
    httpInterceptor.expectOne('/test').flush('not found', { status: 404, statusText: 'Not Found' });
  });

  it('debe establecer userMessage para status 400 con error.message', (done) => {
    http.get('/test').subscribe({
      error: (err) => {
        expect(err.userMessage).toBe('ID no permitido');
        done();
      },
    });
    httpInterceptor.expectOne('/test').flush({ message: 'ID no permitido' }, { status: 400, statusText: 'Bad Request' });
  });

  it('debe establecer userMessage de respaldo para status 400 sin error.message', (done) => {
    http.get('/test').subscribe({
      error: (err) => {
        expect(err.userMessage).toBe('Solicitud inválida.');
        done();
      },
    });
    httpInterceptor.expectOne('/test').flush({}, { status: 400, statusText: 'Bad Request' });
  });

  it('debe establecer userMessage para status 500', (done) => {
    http.get('/test').subscribe({
      error: (err) => {
        expect(err.userMessage).toBe('Error interno del servidor. Intente más tarde.');
        done();
      },
    });
    httpInterceptor.expectOne('/test').flush('server error', { status: 500, statusText: 'Internal Server Error' });
  });

  it('debe establecer userMessage genérico para otros códigos de estado', (done) => {
    http.get('/test').subscribe({
      error: (err) => {
        expect(err.userMessage).toBe('Ha ocurrido un error inesperado. Intente nuevamente.');
        done();
      },
    });
    httpInterceptor.expectOne('/test').flush('forbidden', { status: 403, statusText: 'Forbidden' });
  });
});
