import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Bookings } from './bookings';
import { MicrosoftAuth } from '../../core/microsoft-auth';
import { academicApiBase } from '../../auth-config';
describe('Bookings permissions',()=>{
 beforeEach(()=>TestBed.configureTestingModule({imports:[Bookings],providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([]),{provide:MicrosoftAuth,useValue:{account:()=>({name:'Estudiante',username:'student@example.test'})}}]}));
 afterEach(()=>TestBed.inject(HttpTestingController).verify());
 function screen(role:string){
  const fixture=TestBed.createComponent(Bookings);const http=TestBed.inject(HttpTestingController);
  http.expectOne(academicApiBase+'/recursos').flush([{id:1,nombre:'Equipo',laboratorio:'Lab A',stockDisponible:2}]);
  http.expectOne(academicApiBase+'/me').flush({roles:[role]});
  http.expectOne(academicApiBase+'/reservas').flush([{id:1,laboratorio:'Lab A',solicitante:'Estudiante',fechaSolicitada:'2026-10-20T10:00',estado:'SOLICITADA'}]);
  http.expectOne(academicApiBase+'/tickets').flush([]);fixture.detectChanges();return fixture;
 }
 it('does not offer approval controls to students',()=>{const fixture=screen('ROLE_ESTUDIANTE');expect(fixture.componentInstance.operator()).toBe(false);expect(fixture.nativeElement.textContent).not.toContain('APROBADA');});
 it('offers valid state transitions to operators',()=>{const fixture=screen('ROLE_OPERADOR');expect(fixture.componentInstance.operator()).toBe(true);expect(fixture.nativeElement.textContent).toContain('APROBADA');expect(fixture.componentInstance.nextStates('DEVUELTA')).toEqual([]);});
});
