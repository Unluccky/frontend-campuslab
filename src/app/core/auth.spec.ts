import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';
import { vi } from 'vitest';

const token = (exp: number, groups = ['ROLE_ADMIN']) =>
  `header.${btoa(JSON.stringify({ exp, 'cognito:groups': groups }))}.signature`;

describe('AuthService', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, String(value)),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    });
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]});
  });
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); vi.unstubAllGlobals(); });
  it('envía las credenciales al BFF y reconoce el rol del access token', () => {
    const auth = TestBed.inject(AuthService);
    auth.login('admin@example.test', 'test-only').subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne(`${environment.apiBff}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({email:'admin@example.test', password:'test-only'});
    req.flush({accessToken:token(Date.now()/1000+60),idToken:'unused',refreshToken:'test',expiresIn:60,tokenType:'Bearer'});
    expect(auth.hasValidToken()).toBe(true);
    expect(auth.hasRole('ROLE_ADMIN')).toBe(true);
  });
  it('rechaza una sesión vencida aunque la señal siga activa', () => {
    const auth=TestBed.inject(AuthService);
    auth.isAuthenticated.set(true);
    localStorage.setItem('accessToken',token(Date.now()/1000-1));
    expect(auth.hasValidToken()).toBe(false);
    expect(auth.hasRole('ROLE_ADMIN')).toBe(false);
  });
  it('rechaza tokens malformados y usuarios sin el rol administrador', () => {
    const auth=TestBed.inject(AuthService);
    localStorage.setItem('accessToken','invalid');
    expect(auth.hasValidToken()).toBe(false);
    localStorage.setItem('accessToken',token(Date.now()/1000+60,['ROLE_CLIENTE']));
    expect(auth.hasRole('ROLE_ADMIN')).toBe(false);
  });
});
