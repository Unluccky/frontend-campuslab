import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface LoginResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

interface IdTokenPayload {
  email: string;
  'cognito:groups'?: string[];
  sub: string;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly ID_TOKEN_KEY = 'idToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';

  // señal reactiva para saber si el usuario está logueado, usado en templates/guards
  isAuthenticated = signal<boolean>(this.hasValidToken());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBff}/auth/login`, { email, password })
      .pipe(
        tap((response) => {
          localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
          localStorage.setItem(this.ID_TOKEN_KEY, response.idToken);
          localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
          this.isAuthenticated.set(true);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.ID_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  hasValidToken(): boolean {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    if (!token) return false;

    const payload = this.decodeToken(token);
    if (!payload) return false;

    // exp viene en segundos, Date.now() en milisegundos
    return payload.exp * 1000 > Date.now();
  }

  private decodeToken(token: string): IdTokenPayload | null {
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(payloadJson);
    } catch {
      return null;
    }
  }

  hasRole(requiredRole: string): boolean {
    if (!this.hasValidToken()) return false;
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    if (!token) return false;

    const payload = this.decodeToken(token);
    const groups = payload?.['cognito:groups'] ?? [];
    return groups.includes(requiredRole);
  }
}
