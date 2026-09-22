import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  errorMessage = '';
  isLoading = false;

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe({
      next: () => {
        this.isLoading = false;
        if (!this.authService.hasRole('ROLE_ADMIN')) {
          this.authService.logout();
          this.errorMessage = 'Esta sección requiere una cuenta administradora.';
          return;
        }
        this.router.navigate(['/admin']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.status === 401
          ? 'Email o contraseña incorrectos.'
          : error.status === 0
            ? 'No se pudo conectar con el servidor. Comprueba que el BFF esté iniciado.'
            : 'El servicio de inicio de sesión no está disponible. Revisa la consola del BFF.';
      }
    });
  }
}
