import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminRecursos } from './admin-recursos';
import { RecursoService } from '../../core/recurso';
import { AuthService } from '../../core/auth';
import { provideRouter } from '@angular/router';

const recurso = {
  id: 123,
  nombre: 'Prueba EA1',
  tipo: 'EQUIPO',
  descripcion: '',
  laboratorio: 'Lab prueba',
  stockTotal: 3,
  stockDisponible: 3,
  activo: true,
  creadoEn: '',
};

describe('AdminRecursos CRUD', () => {
  let component: AdminRecursos;
  let fixture: ComponentFixture<AdminRecursos>;
  let api: {
    listar: ReturnType<typeof vi.fn>;
    crear: ReturnType<typeof vi.fn>;
    actualizar: ReturnType<typeof vi.fn>;
    eliminar: ReturnType<typeof vi.fn>;
  };
  beforeEach(async () => {
    api = {
      listar: vi.fn(() => of([recurso])),
      crear: vi.fn(() => of(recurso)),
      actualizar: vi.fn(() => of(recurso)),
      eliminar: vi.fn(() => of(undefined)),
    };
    await TestBed.configureTestingModule({
      imports: [AdminRecursos],
      providers: [
        provideRouter([]),
        { provide: RecursoService, useValue: api },
        { provide: AuthService, useValue: { logout: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AdminRecursos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });
  afterEach(() => vi.unstubAllGlobals());
  it('crea y recarga la lista; editar usa el id y luego limpia el formulario', () => {
    component.recursoForm.patchValue(recurso);
    component.onSubmit();
    expect(api.crear).toHaveBeenCalledWith({
      nombre: 'Prueba EA1',
      tipo: 'EQUIPO',
      descripcion: '',
      laboratorio: 'Lab prueba',
      stockTotal: 3,
    });
    component.editar(recurso);
    component.recursoForm.patchValue({ stockTotal: 5 });
    component.onSubmit();
    expect(api.actualizar).toHaveBeenCalledWith(123, expect.objectContaining({ stockTotal: 5 }));
    expect(component.idEnEdicion).toBeNull();
    expect(api.listar).toHaveBeenCalledTimes(3);
  });
  it('elimina solo con confirmación y recarga el catálogo', () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);
    component.eliminar(123);
    expect(api.eliminar).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    component.editar(recurso);
    component.eliminar(123);
    expect(api.eliminar).toHaveBeenCalledWith(123);
    expect(api.listar).toHaveBeenCalledTimes(2);
    expect(component.idEnEdicion).toBeNull();
  });
  it('rechaza nombres vacíos y stock fraccionario antes de enviar', () => {
    component.recursoForm.patchValue({ ...recurso, nombre: ' ', stockTotal: 1.5 });
    component.onSubmit();
    expect(api.crear).not.toHaveBeenCalled();
    expect(component.errorMessage).not.toBe('');
  });
  it('evita doble envío mientras la creación está pendiente', () => {
    const response = new Subject();
    api.crear.mockReturnValue(response);
    component.recursoForm.patchValue(recurso);
    component.onSubmit();
    component.onSubmit();
    expect(api.crear).toHaveBeenCalledTimes(1);
    expect(component.isSaving).toBe(true);
    response.next(recurso);
    response.complete();
    expect(component.isSaving).toBe(false);
  });
  it('muestra un conflicto de stock sin perder la edición', () => {
    api.actualizar.mockReturnValue(
      throwError(() => ({ status: 409, error: { mensaje: 'Hay equipos ocupados' } })),
    );
    component.editar(recurso);
    component.onSubmit();
    expect(component.errorMessage).toBe('Hay equipos ocupados');
    expect(component.idEnEdicion).toBe(123);
    expect(component.isSaving).toBe(false);
  });
});
