import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth';

@Component({
  selector: 'app-external-access',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="shell"><a class="brand" routerLink="/">Campus<span>Lab</span></a>
      <section class="card"><p class="eyebrow">CUENTA DE ESTUDIANTE</p>
        @if (step() === 'register') {
          <h1>Crear cuenta</h1><p>Regístrate con tu correo. Te enviaremos un código para confirmar la cuenta.</p>
          <form (ngSubmit)="register()" #registration="ngForm">
            <label for="email">Correo electrónico</label><input id="email" name="email" type="email" [(ngModel)]="email" required email autocomplete="email">
            <label for="password">Contraseña</label><input id="password" name="password" type="password" [(ngModel)]="password" required minlength="8" autocomplete="new-password">
            <small>Debe incluir mayúscula, minúscula, número y símbolo.</small>
            <label for="passwordConfirm">Repite la contraseña</label><input id="passwordConfirm" name="passwordConfirm" type="password" [(ngModel)]="passwordConfirm" required autocomplete="new-password">
            @if (error()) { <p class="error" role="alert">{{error()}}</p> }
            <button [disabled]="busy() || !registration.valid">{{busy() ? 'Creando cuenta…' : 'Crear cuenta'}}</button>
          </form>
          <p class="switch">¿Ya tienes cuenta? <button class="link" (click)="step.set('login')">Inicia sesión</button></p>
        } @else if (step() === 'confirm') {
          <h1>Confirma tu correo</h1><p>Ingresa el código enviado a <strong>{{email}}</strong>.</p>
          <form (ngSubmit)="confirm()" #confirmation="ngForm">
            <label for="code">Código de verificación</label><input id="code" name="code" inputmode="numeric" autocomplete="one-time-code" [(ngModel)]="code" required minlength="6" maxlength="8">
            @if (error()) { <p class="error" role="alert">{{error()}}</p> }
            <button [disabled]="busy() || !confirmation.valid">{{busy() ? 'Verificando…' : 'Confirmar correo'}}</button>
          </form>
          <p class="switch"><button class="link" (click)="step.set('register')">Volver</button></p>
        } @else {
          <h1>Ingresar</h1><p>Accede a tus reservas con tu cuenta de estudiante.</p>
          <form (ngSubmit)="login()" #loginForm="ngForm">
            <label for="loginEmail">Correo electrónico</label><input id="loginEmail" name="loginEmail" type="email" [(ngModel)]="email" required email autocomplete="username">
            <label for="loginPassword">Contraseña</label><input id="loginPassword" name="loginPassword" type="password" [(ngModel)]="password" required autocomplete="current-password">
            @if (error()) { <p class="error" role="alert">{{error()}}</p> }
            <button [disabled]="busy() || !loginForm.valid">{{busy() ? 'Ingresando…' : 'Ingresar'}}</button>
          </form>
          <p class="switch">¿Primera vez? <button class="link" (click)="step.set('register')">Crear cuenta</button></p>
        }
      </section><p class="back"><a routerLink="/login">Volver al acceso académico</a></p>
    </main>`,
  styles: [`
    :host{display:block;min-height:100vh;background:#f3f7f8;color:#17343b;font:16px/1.5 Inter,system-ui,sans-serif}.shell{max-width:480px;margin:auto;padding:4rem 1.25rem}.brand{font-weight:800;font-size:1.5rem;color:#17343b;text-decoration:none}.brand span{color:#0e8a76}.card{background:white;border:1px solid #d9e6e8;border-radius:1rem;padding:2rem;margin-top:2rem;box-shadow:0 16px 40px #17343b0d}.eyebrow{letter-spacing:.12em;font-size:.75rem;font-weight:700;color:#0e8a76}h1{margin:.35rem 0;font-size:2rem}p{color:#5b7378}form{display:grid;gap:.65rem;margin-top:1.5rem}label{font-weight:650;margin-top:.35rem}input{font:inherit;padding:.8rem .9rem;border:1px solid #b8cbce;border-radius:.55rem}input:focus{outline:3px solid #0e8a7628;border-color:#0e8a76}small{color:#637b80}button{border:0;border-radius:.55rem;background:#0e8a76;color:white;font:inherit;font-weight:700;padding:.85rem 1rem;cursor:pointer;margin-top:.6rem}button:disabled{opacity:.55;cursor:wait}.link{background:none;color:#087a6a;padding:0;margin:0;text-decoration:underline}.switch,.back{text-align:center;margin-top:1.25rem}.error{color:#a03232;background:#fff0ed;padding:.7rem;border-radius:.5rem}.back a{color:#315a60}
  `]
})
export class ExternalAccess {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly step = signal<'register' | 'confirm' | 'login'>('register');
  readonly busy = signal(false);
  readonly error = signal('');
  email = '';
  password = '';
  passwordConfirm = '';
  code = '';

  register(): void {
    this.error.set('');
    if (this.password !== this.passwordConfirm) { this.error.set('Las contraseñas no coinciden.'); return; }
    this.busy.set(true);
    this.auth.register(this.email.trim(), this.password).subscribe({
      next: response => { this.busy.set(false); this.error.set(''); this.step.set('confirm'); },
      error: error => { this.busy.set(false); this.error.set(error.error?.detail || error.error?.message || 'No se pudo crear la cuenta. Revisa el correo y la política de contraseña.'); }
    });
  }

  confirm(): void {
    this.error.set(''); this.busy.set(true);
    this.auth.confirmRegistration(this.email.trim(), this.code.trim()).subscribe({
      next: () => { this.busy.set(false); this.step.set('login'); this.password = ''; this.code = ''; },
      error: error => { this.busy.set(false); this.error.set(error.error?.detail || error.error?.message || 'No se pudo confirmar el correo. Revisa el código.'); }
    });
  }

  login(): void {
    this.error.set(''); this.busy.set(true);
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => { this.busy.set(false); void this.router.navigate(['/reservas']); },
      error: error => { this.busy.set(false); this.error.set(error.status === 401 ? 'Correo o contraseña incorrectos.' : error.error?.detail || error.error?.message || 'No se pudo iniciar sesión.'); }
    });
  }
}
