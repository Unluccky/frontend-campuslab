import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting,HttpTestingController} from '@angular/common/http/testing';
import {AdminUsuarios} from './admin-usuarios';
import {environment} from '../../../environments/environment';
describe('Administración de perfiles',()=>{
 beforeEach(()=>TestBed.configureTestingModule({imports:[AdminUsuarios],providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting()]}));
 afterEach(()=>TestBed.inject(HttpTestingController).verify());
 it('muestra datos recibidos de manera asíncrona',async()=>{const f=TestBed.createComponent(AdminUsuarios);f.detectChanges();TestBed.inject(HttpTestingController).expectOne(environment.apiUsuarios+'?page=0').flush({content:[{id:1,cognitoSub:'3438f418-d051-7057-babf-2ced5441a467',nombre:'Persona de prueba',email:'test@example.test',activo:true,version:0}],totalPages:1});await f.whenStable();expect(f.nativeElement.textContent).toContain('Persona de prueba');});
 it('no envía un perfil inválido',()=>{const f=TestBed.createComponent(AdminUsuarios);TestBed.inject(HttpTestingController).expectOne(environment.apiUsuarios+'?page=0').flush({content:[],totalPages:0});f.componentInstance.save();expect(f.componentInstance.form.touched).toBe(true);TestBed.inject(HttpTestingController).expectNone(r=>r.method==='POST');});
 it('conserva los datos y avisa de conflicto al guardar',()=>{const f=TestBed.createComponent(AdminUsuarios);const http=TestBed.inject(HttpTestingController);http.expectOne(environment.apiUsuarios+'?page=0').flush({content:[],totalPages:0});f.componentInstance.form.setValue({cognitoSub:'3438f418-d051-7057-babf-2ced5441a467',nombre:'Prueba',email:'test@example.test',activo:true});f.componentInstance.save();http.expectOne(environment.apiUsuarios).flush({}, {status:409,statusText:'Conflict'});expect(f.componentInstance.error).toContain('ya existe');expect(f.componentInstance.busy).toBe(false);expect(f.componentInstance.form.controls.nombre.value).toBe('Prueba');});
});
