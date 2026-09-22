import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RecursoService } from './recurso';
import { environment } from '../../environments/environment';

describe('RecursoService', () => {
  beforeEach(() => TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]}));
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('envía el recurso a la API configurada', () => {
    const dto = {nombre:'Microscopio',tipo:'EQUIPO',descripcion:'',laboratorio:'Lab 1',stockTotal:2};
    TestBed.inject(RecursoService).crear(dto).subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne(environment.apiCatalogo);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({...dto,id:1,stockDisponible:2,activo:true});
  });
});
