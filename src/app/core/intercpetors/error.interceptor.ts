import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';



export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let userMessage = 'Ha ocurrido un error inesperado. Intente nuevamente.';

      if (error.status === 0) {
        userMessage = 'No se pudo conectar con el servidor. Verifique su conexión.';
      } else if (error.status === 404) {
        userMessage = 'El recurso solicitado no fue encontrado.';
      } else if (error.status === 400) {
        userMessage = error.error?.message ?? 'Solicitud inválida.';
      } else if (error.status >= 500) {
        userMessage = 'Error interno del servidor. Intente más tarde.';
      }

      return throwError(() => ({ ...error, userMessage }));
    })
  );
};



