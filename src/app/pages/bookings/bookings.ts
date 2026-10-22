import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { academicApiBase } from '../../auth-config';
import { MicrosoftAuth } from '../../core/microsoft-auth';
interface Resource { id:number; nombre:string; laboratorio:string; stockDisponible:number; }
interface Booking { id: number; laboratorio: string; solicitante: string; fechaSolicitada: string; estado: string; }
interface Ticket { reservaId: number; laboratorio: string; estado: string; respuesta: string | null; }
@Component({
 selector: 'app-bookings', imports: [FormsModule, RouterLink],
 template: `
 <header class="topbar"><a class="brand" routerLink="/cuenta"><span class="brand-mark">C<span>·</span></span>CampusLab<small>ESPACIOS PARA APRENDER</small></a><nav aria-label="Navegación principal"><a routerLink="/cuenta" >Mi cuenta</a><a routerLink="/reservas" class="active">Reservas</a></nav><span class="workspace-label">Portal académico</span></header><main><div class="page-heading"><div><p class="eyebrow">LABORATORIOS Y EQUIPOS</p><h1>Reservas y preparación</h1>
 <p class="subtitle">Un espacio para tus ideas. Reserva y sigue cada paso de tu solicitud.</p></div><span class="badge">Gestión académica</span></div>
 @if(error()){<p role="alert" class="error">{{error()}}</p>}
 @if(notice()){<p role="status">{{notice()}}</p>}
 <section><div class="section-heading"><span class="step">01</span><div><h2>Nueva reserva</h2><p>Selecciona un recurso y completa los datos de tu visita.</p></div></div><form #form="ngForm" (ngSubmit)="create()">
 <label>Recurso<select name="recursoId" required [(ngModel)]="draft.recursoId" (ngModelChange)="selectResource()">@if(!resources().length){<option [ngValue]="1">{{busy() ? 'Cargando recursos…' : error() ? 'No se pudieron cargar los recursos' : 'Sin recursos disponibles'}}</option>}@for(r of resources();track r.id){<option [ngValue]="r.id">{{r.nombre}} · disponibles: {{r.stockDisponible}}</option>}</select></label>
 <label>Laboratorio<input name="laboratorio" maxlength="100" required [(ngModel)]="draft.laboratorio"></label>
 <label>Nombre del solicitante<input name="solicitante" maxlength="150" required [(ngModel)]="draft.solicitante"></label>
 <label>Correo de contacto<input name="email" type="email" email required maxlength="254" [(ngModel)]="draft.emailSolicitante"></label>
 <label>Fecha y hora<input name="fecha" type="datetime-local" required [(ngModel)]="draft.fechaSolicitada"></label>
 <button [disabled]="busy() || !form.valid">Solicitar reserva</button></form></section>
 <section><div class="section-heading spread"><div><h2>Reservas <span class="count">{{bookings().length}}</span></h2><p>Consulta el estado y descarga tus comprobantes.</p></div><button class="secondary" (click)="load()" [disabled]="busy()">{{busy() ? "Cargando…" : "↻ Actualizar"}}</button></div>
 @for(b of bookings();track b.id){<article><h3>#{{b.id}} · {{b.laboratorio}}</h3><p>{{b.solicitante}} · {{b.fechaSolicitada}}</p><strong class="badge">{{b.estado.replaceAll("_"," ")}}</strong>@if(b.estado==='EN_USO' || b.estado==='DEVUELTA'){<button (click)="download(b.id,'RETIRO')">Vale de retiro</button>}@if(b.estado==='DEVUELTA'){<button (click)="download(b.id,'DEVOLUCION')">Acta de devolución</button>}
 @if(operator()){@for(s of nextStates(b.estado);track s){<button (click)="change(b.id,s)" [disabled]="busy()">{{s}}</button>}}</article>}
 @empty{<div class="empty-state"><span>▦</span><h3>{{error() ? "Reservas no disponibles" : "Tu próxima experiencia empieza aquí"}}</h3><p>{{error() ? "No pudimos cargar la lista. Intenta actualizar en unos momentos." : "Cuando solicites una reserva, podrás seguir su estado en este espacio."}}</p></div>}</section>
 <section><h2>Tickets de preparación</h2><p>El ticket aparece después de que el técnico aprueba la reserva y se procesa la solicitud.</p>
 @for(t of tickets();track t.reservaId){<article><h3>Reserva #{{t.reservaId}} · {{t.laboratorio}}</h3><p>{{t.estado}}</p>
 @if(t.respuesta){<p>{{t.respuesta}}</p>}
 @if(operator() && t.estado==='PENDIENTE'){<label>Respuesta del técnico<textarea maxlength="2000" [(ngModel)]="answers[t.reservaId]"></textarea></label><button (click)="answer(t.reservaId)" [disabled]="busy() || !answers[t.reservaId]?.trim()">Responder</button>}</article>}
 @empty{<div class="empty-state"><span>☷</span><h3>{{error() ? "No pudimos cargar los tickets" : "Sin preparaciones pendientes"}}</h3><p>Las respuestas del equipo técnico aparecerán aquí.</p></div>}</section></main>`,
 styleUrls: ['../academic.css']
})
export class Bookings {
 private http=inject(HttpClient);private auth=inject(MicrosoftAuth);
 resources=signal<Resource[]>([]);bookings=signal<Booking[]>([]);tickets=signal<Ticket[]>([]);operator=signal(false);busy=signal(false);error=signal('');notice=signal('');
 answers:Record<number,string>={};
 draft={recursoId:1,laboratorio:'',solicitante:this.auth.account()?.name ?? '',emailSolicitante:this.auth.account()?.username ?? '',fechaSolicitada:''};
 constructor(){this.load();}
 load(){this.busy.set(true);this.error.set('');forkJoin({resources:this.http.get<Resource[]>(academicApiBase+'/recursos'),me:this.http.get<{roles:string[]}>(academicApiBase+'/me'),bookings:this.http.get<Booking[]>(academicApiBase+'/reservas'),tickets:this.http.get<Ticket[]>(academicApiBase+'/tickets')}).subscribe({next:r=>{this.resources.set(r.resources);if(r.resources.length && !r.resources.some(x=>x.id===this.draft.recursoId)){this.draft.recursoId=r.resources[0].id;}if(!this.draft.laboratorio)this.selectResource();this.operator.set(r.me.roles.some(x=>['ROLE_ADMIN','ROLE_OPERADOR'].includes(x)));this.bookings.set(r.bookings);this.tickets.set(r.tickets);this.busy.set(false);},error:e=>this.fail(e)});}
 create(){if(this.busy())return;this.busy.set(true);this.http.post(academicApiBase+'/reservas',this.draft).subscribe({next:()=>{this.notice.set('Reserva solicitada.');this.load();},error:e=>this.fail(e)});}
 change(id:number,state:string){if(this.busy())return;this.busy.set(true);this.http.patch(academicApiBase+'/reservas/'+id+'/estado',{nuevoEstado:state}).subscribe({next:()=>{this.notice.set('Estado actualizado. El ticket puede tardar unos segundos; pulsa Actualizar.');this.load();},error:e=>this.fail(e)});}
 answer(id:number){if(this.busy())return;this.busy.set(true);this.http.post(academicApiBase+'/tickets/'+id+'/respuestas',{respuesta:this.answers[id]}).subscribe({next:()=>{this.notice.set('Respuesta guardada.');this.load();},error:e=>this.fail(e)});}
 selectResource(){this.draft.laboratorio=this.resources().find(r=>r.id===this.draft.recursoId)?.laboratorio??'';}
 download(id:number,kind:string){this.http.get(academicApiBase+'/reservas/'+id+'/comprobantes/'+kind,{responseType:'blob'}).subscribe({next:blob=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='campuslab-'+id+'-'+kind+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},error:()=>this.error.set('El comprobante aún no está disponible. Espera unos segundos y vuelve a intentar.')});}
 nextStates(state:string):string[]{return ({SOLICITADA:['APROBADA','CANCELADA'],APROBADA:['EN_PREPARACION','CANCELADA'],EN_PREPARACION:['EN_USO','CANCELADA'],EN_USO:['DEVUELTA']} as Record<string,string[]>)[state]??[];}
 private fail(e:{status:number}){this.busy.set(false);this.error.set(e.status===403?'No tienes permiso para esta operación.':e.status===409?'El estado cambió. Actualiza la lista.':'No se pudo completar la operación. Revisa los datos y la conexión.');}
}
