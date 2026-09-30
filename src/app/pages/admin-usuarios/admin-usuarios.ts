import {Component,inject,ChangeDetectorRef} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {FormBuilder,ReactiveFormsModule,Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {environment} from '../../../environments/environment';
interface Usuario {id:number;cognitoSub:string;nombre:string;email:string;activo:boolean;version:number}
@Component({selector:'app-admin-usuarios',standalone:true,imports:[RouterLink,ReactiveFormsModule],templateUrl:'./admin-usuarios.html',styleUrl:'./admin-usuarios.css'})
export class AdminUsuarios {
 private cdr=inject(ChangeDetectorRef);private http=inject(HttpClient);private fb=inject(FormBuilder);
 usuarios:Usuario[]=[];error='';message='';editing:Usuario|null=null;busy=false;page=0;totalPages=0;
 form=this.fb.nonNullable.group({cognitoSub:['',[Validators.required,Validators.pattern(/^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$/)]],nombre:['',[Validators.required,Validators.maxLength(160)]],email:['',[Validators.required,Validators.email,Validators.maxLength(254)]],activo:[true]});
 constructor(){this.load();}
 load(){this.error='';this.http.get<{content:Usuario[];totalPages:number}>(environment.apiUsuarios+'?page='+this.page).subscribe({next:r=>{this.usuarios=r.content;this.totalPages=r.totalPages;this.cdr.markForCheck();},error:()=>{this.error='No fue posible cargar los usuarios. Comprueba tu sesión y vuelve a intentar.';this.cdr.markForCheck();}});}
 changePage(delta:number){this.page+=delta;this.load();}
 edit(u:Usuario){this.editing=u;this.form.setValue({cognitoSub:u.cognitoSub,nombre:u.nombre,email:u.email,activo:u.activo});this.form.controls.cognitoSub.disable();this.message='';}
 cancel(){this.editing=null;this.form.controls.cognitoSub.enable();this.form.reset({activo:true});}
 save(){if(this.form.invalid||this.busy){this.form.markAllAsTouched();return;}this.busy=true;this.error='';const v=this.form.getRawValue();const call=this.editing?this.http.put(environment.apiUsuarios+'/'+this.editing.id,{nombre:v.nombre.trim(),email:v.email.trim(),activo:v.activo,version:this.editing.version}):this.http.post(environment.apiUsuarios,{cognitoSub:v.cognitoSub,nombre:v.nombre.trim(),email:v.email.trim()});call.subscribe({next:()=>{this.busy=false;this.cancel();this.message='Perfil guardado.';this.load();},error:e=>{this.busy=false;this.cdr.markForCheck();this.error=e.status===409?'El correo o identificador ya existe, o el perfil cambió. Recarga y revisa los datos.':'No se pudo guardar el perfil. Revisa los campos e inténtalo de nuevo.';}});}
 deactivate(u:Usuario){if(!confirm('¿Desactivar el perfil de '+u.nombre+'? Su cuenta Cognito no se modifica.'))return;this.http.delete(environment.apiUsuarios+'/'+u.id).subscribe({next:()=>{this.message='Perfil desactivado.';this.load();},error:()=>{this.error='No se pudo desactivar el perfil.';this.cdr.markForCheck();}});}
}
