import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Recurso, RecursoService } from '../../core/recurso';
import { AuthService } from '../../core/auth';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-recursos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-recursos.html',
  styleUrl: './admin-recursos.css',
})
export class AdminRecursos implements OnInit {
  private recursoService = inject(RecursoService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('nombreInput') nombreInput?: ElementRef<HTMLInputElement>;
  authService = inject(AuthService);

  recursos: Recurso[] = [];
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  typeFilter = '';

  get recursosFiltrados(): Recurso[] {
    const normalizar = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const search = normalizar(this.searchTerm.trim());
    return this.recursos.filter(
      (recurso) =>
        (!this.typeFilter || recurso.tipo === this.typeFilter) &&
        normalizar(`${recurso.nombre} ${recurso.laboratorio}`).includes(search),
    );
  }

  get unidadesDisponibles(): number {
    return this.recursos.reduce((total, recurso) => total + recurso.stockDisponible, 0);
  }

  get laboratorios(): number {
    return new Set(this.recursos.map((recurso) => recurso.laboratorio.trim().toLowerCase())).size;
  }

  disponibilidad(recurso: Recurso): number {
    return recurso.stockTotal > 0
      ? Math.min(100, Math.max(0, (recurso.stockDisponible / recurso.stockTotal) * 100))
      : 0;
  }

  nuevoRecurso(): void {
    if (this.isSaving) return;
    this.cancelarEdicion();
    this.nombreInput?.nativeElement.focus();
  }

  // si idEnEdicion tiene valor, el formulario esta en modo "editar" en vez de "crear"
  idEnEdicion: number | null = null;

  recursoForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    tipo: ['EQUIPO', [Validators.required, Validators.pattern(/^(EQUIPO|INSUMO)$/)]],
    descripcion: ['', [Validators.maxLength(500)]],
    laboratorio: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    stockTotal: [
      1,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(2147483647),
        Validators.pattern(/^\d+$/),
      ],
    ],
  });

  ngOnInit(): void {
    this.cargarRecursos();
  }

  cargarRecursos(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.recursoService.listar().subscribe({
      next: (data) => {
        this.recursos = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el catálogo de recursos.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSubmit(): void {
    if (this.isSaving) return;
    if (this.recursoForm.invalid) {
      this.recursoForm.markAllAsTouched();
      this.errorMessage =
        'Completa nombre y laboratorio, selecciona un tipo válido y usa un stock entero no negativo. Revisa los límites de caracteres.';
      return;
    }

    const dto = {
      nombre: this.recursoForm.value.nombre!.trim(),
      tipo: this.recursoForm.value.tipo!,
      descripcion: this.recursoForm.value.descripcion ?? '',
      laboratorio: this.recursoForm.value.laboratorio!.trim(),
      stockTotal: this.recursoForm.value.stockTotal!,
    };

    const peticion = this.idEnEdicion
      ? this.recursoService.actualizar(this.idEnEdicion, dto)
      : this.recursoService.crear(dto);

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const editando = this.idEnEdicion !== null;
    peticion
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.cancelarEdicion();
          this.successMessage = editando
            ? 'Cambios guardados. El recurso está actualizado.'
            : 'Recurso creado correctamente.';
          this.cargarRecursos();
        },
        error: (error) => {
          this.errorMessage =
            error.error?.mensaje ??
            (error.error?.errores
              ? Object.values(error.error.errores).join(' ')
              : 'Ocurrió un error al guardar el recurso.');
        },
      });
  }

  editar(recurso: Recurso): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.idEnEdicion = recurso.id;
    this.recursoForm.patchValue({
      nombre: recurso.nombre,
      tipo: recurso.tipo,
      descripcion: recurso.descripcion,
      laboratorio: recurso.laboratorio,
      stockTotal: recurso.stockTotal,
    });
    this.nombreInput?.nativeElement.focus();
  }

  eliminar(id: number): void {
    if (this.isSaving) return;
    if (!confirm('¿Seguro que quieres eliminar este recurso?')) return;

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.recursoService
      .eliminar(id)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          if (this.idEnEdicion === id) this.cancelarEdicion();
          this.successMessage = 'Recurso eliminado del catálogo.';
          this.cargarRecursos();
        },
        error: () => (this.errorMessage = 'No se pudo eliminar el recurso.'),
      });
  }

  cancelarEdicion(): void {
    this.errorMessage = '';
    this.idEnEdicion = null;
    this.recursoForm.reset({ tipo: 'EQUIPO', stockTotal: 1 });
  }

  logout(): void {
    this.authService.logout();
  }
}
