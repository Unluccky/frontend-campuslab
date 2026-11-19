import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/auth';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { academicApiBase } from '../auth-config';
import { MicrosoftAuth } from '../core/microsoft-auth';

export const externalOrMicrosoftGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (inject(AuthService).hasValidToken() || inject(MicrosoftAuth).account()) return true;
  return router.createUrlTree(['/login']);
};

export const academicAdminGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(HttpClient).get<{ roles: string[] }>(academicApiBase + '/me').pipe(
    map(({ roles }) => roles.includes('ROLE_ADMIN') || router.createUrlTree(['/cuenta'])),
    catchError(() => of(router.createUrlTree(['/cuenta']))),
  );
};

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasValidToken()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const roleGuard = (requiredRole: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasRole(requiredRole)) {
      return true;
    }

    return router.createUrlTree(['/login']);
  };
};
