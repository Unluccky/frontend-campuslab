import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { academicApiBase } from '../auth-config';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('leaves academic requests to MSAL without injecting Cognito services or tokens', () => {
    const req = new HttpRequest('GET', academicApiBase + '/me');
    const next = vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })));
    interceptor(req, next).subscribe();
    expect(next).toHaveBeenCalledWith(req);
    expect(req.headers.has('Authorization')).toBe(false);
  });
});
