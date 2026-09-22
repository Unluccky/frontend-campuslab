import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isApi = [environment.apiBff, environment.apiCatalogo, environment.apiReservas]
    .some(base => req.url === base || req.url.startsWith(`${base}/`) || req.url.startsWith(`${base}?`));
  if (!isApi || req.url === `${environment.apiBff}/auth/login`) return next(req);
  const token = authService.getAccessToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
