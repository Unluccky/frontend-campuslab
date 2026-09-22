import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Recurso, RecursoService } from '../../core/recurso';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-admin-recursos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-recursos.html',
  styleUrl: './admin-recursos.css'
})
export class AdminRecursos implements OnInit {
  private recursoService = inject(RecursoService);
  private fb = inject(FormBuilder);
  authService = inject(AuthService);

  recursos: Recurso[] = [];
  isLoading = false;
  errorMessage = '';

  // si idEnEdicion tiene valor, el formulario esta en modo "editar" en vez de "crear"
  idEnEdicion: number | null = null;

  recursoForm = this.fb.group({
    nombre: ['', [Validators.required]],
    tipo: ['EQUIPO', [Validators.required]],
    descripcion: [''],
    laboratorio: ['', [Validators.required]],
    stockTotal: [1, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.cargarRecursos();
  }

  cargarRecursos(): void {
    this.isLoading = true;
    this.recursoService.listar().subscribe({
      next: (data) => {
        this.recursos = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el catálogo de recursos.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.recursoForm.invalid) {
      this.recursoForm.markAllAsTouched();
      return;
    }

    const dto = {
      nombre: this.recursoForm.value.nombre!,
      tipo: this.recursoForm.value.tipo!,
      descripcion: this.recursoForm.value.descripcion ?? '',
      laboratorio: this.recursoForm.value.laboratorio!,
      stockTotal: this.recursoForm.value.stockTotal!
    };

    const peticion = this.idEnEdicion
      ? this.recursoService.actualizar(this.idEnEdicion, dto)
      : this.recursoService.crear(dto);

    peticion.subscribe({
      next: () => {
        this.cancelarEdicion();
        this.cargarRecursos();
      },
      error: () => {
        this.errorMessage = 'Ocurrió un error al guardar el recurso.';
      }
    });
  }

  editar(recurso: Recurso): void {
    this.idEnEdicion = recurso.id;
    this.recursoForm.patchValue({
      nombre: recurso.nombre,
      tipo: recurso.tipo,
      descripcion: recurso.descripcion,
      laboratorio: recurso.laboratorio,
      stockTotal: recurso.stockTotal
    });
  }

  eliminar(id: number): void {
    if (!confirm('¿Seguro que quieres eliminar este recurso?')) return;

    this.recursoService.eliminar(id).subscribe({
      next: () => this.cargarRecursos(),
      error: () => (this.errorMessage = 'No se pudo eliminar el recurso.')
    });
  }

  cancelarEdicion(): void {
    this.idEnEdicion = null;
    this.recursoForm.reset({ tipo: 'EQUIPO', stockTotal: 1 });
  }

  logout(): void {
    this.authService.logout();
  }
}