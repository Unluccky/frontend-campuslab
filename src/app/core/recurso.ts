import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Recurso {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  laboratorio: string;
  stockTotal: number;
  stockDisponible: number;
  activo: boolean;
  creadoEn: string;
}

export interface RecursoDto {
  nombre: string;
  tipo: string;
  descripcion: string;
  laboratorio: string;
  stockTotal: number;
}

@Injectable({ providedIn: 'root' })
export class RecursoService {
  private apiUrl = environment.apiCatalogo;

  constructor(private http: HttpClient) {}

  listar(): Observable<Recurso[]> {
    return this.http.get<Recurso[]>(this.apiUrl);
  }

  crear(dto: RecursoDto): Observable<Recurso> {
    return this.http.post<Recurso>(this.apiUrl, dto);
  }

  actualizar(id: number, dto: RecursoDto): Observable<Recurso> {
    return this.http.put<Recurso>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}