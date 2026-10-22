import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { academicApiBase } from '../../auth-config';
import { RouterLink } from '@angular/router';
import { MicrosoftAuth } from '../../core/microsoft-auth';

@Component({
  selector: 'app-account',
  imports: [RouterLink],
  template: `
    <header class="topbar"><a class="brand" routerLink="/cuenta"><span class="brand-mark">C<span>·</span></span>CampusLab<small>ESPACIOS PARA APRENDER</small></a><nav aria-label="Navegación principal"><a routerLink="/cuenta" class="active">Mi cuenta</a><a routerLink="/reservas" >Reservas</a></nav><span class="workspace-label">Portal académico</span></header><main>
      <div class="page-heading"><div><p class="eyebrow">TU ESPACIO ACADÉMICO</p><h1>Todo comienza aquí.</h1><p class="subtitle">Organiza tus reservas y accede a las herramientas de CampusLab.</p></div><span class="badge">Cuenta Microsoft</span></div>
      <section class="profile-card">
        <div class="avatar">{{ initials() }}</div><div class="profile-info"><p class="eyebrow">BIENVENIDO A CAMPUSLAB</p><h2>{{ auth.account()?.name || 'Estudiante' }}</h2><p>{{ auth.account()?.username }}</p><div class="badges">@for(role of displayRoles(); track role){<span class="badge">{{role}}</span>}</div></div>
        <div class="session"><span class="status-dot"></span> Sesión activa</div>
      </section>
      <div class="quick-grid"><a class="quick-card" routerLink="/reservas"><span class="tile-icon">↗</span><h2>Mis reservas</h2><p>Solicita un espacio o equipo y sigue su preparación.</p><span class="card-link">Ver reservas <span>→</span></span></a>
      @if(roles().includes('ROLE_ADMIN')){<a class="quick-card" routerLink="/mensajeria/admin"><span class="tile-icon">≋</span><h2>Mensajería</h2><p>Gestiona colas, exchanges y enlaces del laboratorio.</p><span class="card-link">Abrir administración <span>→</span></span></a>}</div>
      <section class="access-panel"><div><h2>Acceso y seguridad</h2><p role="status">{{ apiStatus() || 'Verifica los permisos de tu cuenta académica.' }}</p></div><button class="secondary" (click)="checkApi()" [disabled]="checking()">{{checking() ? 'Verificando…' : 'Verificar acceso'}}</button></section>
      <div class="logout-row"><p>Tu cuenta está conectada mediante Microsoft.</p>
        @if (auth.error()) { <p role="alert">{{ auth.error() }}</p> }
        <button class="text-button" (click)="auth.logout()" [disabled]="auth.busy()">Cerrar sesión de Microsoft</button>
      </div>
    </main>`,
  styleUrls: ['../academic.css'],
})
export class Account {
  readonly auth = inject(MicrosoftAuth);
  private readonly http = inject(HttpClient);
  readonly checking = signal(false);
  readonly apiStatus = signal('');
  readonly roles = signal<string[]>([]);
  constructor() { this.checkApi(); }
  initials(): string { return (this.auth.account()?.name || 'CL').split(' ').filter(Boolean).slice(0,2).map(n=>n[0]).join(''); }
  displayRoles(): string[] { const labels: Record<string,string> = {ROLE_ADMIN:'Administrador',ROLE_OPERADOR:'Técnico',ROLE_ESTUDIANTE:'Estudiante',ROLE_AUDITOR:'Auditor'}; return this.roles().filter(r=>labels[r]).map(r=>labels[r]); }
  checkApi(): void {
    if (this.checking()) return;
    this.checking.set(true);
    this.apiStatus.set('Comprobando permisos…');
    this.http.get<{ roles: string[] }>(academicApiBase + '/me').subscribe({
      next: result => { this.roles.set(result.roles); this.apiStatus.set('Identidad y permisos verificados por el servidor.'); this.checking.set(false); },
      error: () => { this.roles.set([]); this.apiStatus.set('No pudimos comprobar tus permisos. Inténtalo de nuevo más tarde.'); this.checking.set(false); },
    });
  }
}
