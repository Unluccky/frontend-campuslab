import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { academicApiBase } from '../../auth-config';
import { MicrosoftAuth } from '../../core/microsoft-auth';
import { AuthService } from '../../core/auth';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';
interface Resource { id:number; nombre:string; laboratorio:string; stockDisponible:number; }
interface Booking { id: number; laboratorio: string; solicitante: string; fechaSolicitada: string; estado: string; }
interface Ticket { reservaId: number; laboratorio: string; estado: string; respuesta: string | null; }
type BookingDateFilter = 'all' | 'today' | 'past' | 'upcoming';
type TicketStatusFilter = 'all' | 'PENDIENTE' | 'RESPONDIDO';
@Component({
 selector: 'app-bookings', imports: [DatePipe, FormsModule, RouterLink, NgTemplateOutlet],
 template: `
 <header class="topbar"><a class="brand" [routerLink]="isCognitoSession() ? '/reservas' : '/cuenta'"><span class="brand-mark">C<span>·</span></span>CampusLab<small>ESPACIOS PARA APRENDER</small></a><nav aria-label="Navegación principal">@if(!isCognitoSession()){<a routerLink="/cuenta">Mi cuenta</a>}<a routerLink="/reservas" class="active">Reservas</a></nav><span class="workspace-label">Portal académico</span></header><main><div class="page-heading"><div><p class="eyebrow">LABORATORIOS Y EQUIPOS</p><h1>Reservas y preparación</h1>
 <p class="subtitle">{{ operator() ? 'Revisa las solicitudes y coordina la preparación de los laboratorios.' : 'Solicita un recurso y sigue el progreso de tus reservas.' }}</p></div><span class="badge">{{ roleLabel() }}</span></div>
 @if(error()){<p role="alert" class="error">{{error()}}</p>}
 @if(notice()){<p role="status">{{notice()}}</p>}
 <section><div class="section-heading"><span class="step">01</span><div><h2>Nueva reserva</h2><p>Selecciona un recurso y completa los datos de tu visita.</p></div></div><form #form="ngForm" (ngSubmit)="create()">
 <label>Recurso<select name="recursoId" required [(ngModel)]="draft.recursoId" (ngModelChange)="selectResource()">@if(!resources().length){<option [ngValue]="1">{{busy() ? 'Cargando recursos…' : error() ? 'No se pudieron cargar los recursos' : 'Sin recursos disponibles'}}</option>}@for(r of resources();track r.id){<option [ngValue]="r.id">{{r.nombre}} · disponibles: {{r.stockDisponible}}</option>}</select></label>
 <label>Laboratorio<input name="laboratorio" readonly required [ngModel]="draft.laboratorio"><small>Asignado al recurso seleccionado.</small></label>
 <label>Nombre del solicitante<input name="solicitante" maxlength="150" required [(ngModel)]="draft.solicitante"></label>
 <label>Correo de contacto<input name="email" type="email" email required maxlength="254" [(ngModel)]="draft.emailSolicitante"></label>
 <label>Fecha y hora<input name="fecha" type="datetime-local" required [(ngModel)]="draft.fechaSolicitada"></label>
 <button [disabled]="busy() || !form.valid">Solicitar reserva</button></form></section>
 <section><div class="section-heading spread"><div><h2>{{operator() ? 'Reservas del laboratorio' : 'Mis reservas'}} <span class="count">{{filteredBookings().length}}</span></h2><p>{{operator() ? 'Revisa el estado de cada solicitud y registra el siguiente paso.' : 'Consulta el estado y descarga tus comprobantes.'}}</p></div><div class="booking-list-actions"><label class="date-filter">Filtrar por fecha<select name="bookingDateFilter" [ngModel]="bookingDateFilter()" (ngModelChange)="bookingDateFilter.set($event)"><option value="all">Todas</option><option value="today">Hoy</option><option value="past">Días anteriores</option><option value="upcoming">Próximas</option></select></label><button class="secondary" (click)="load()" [disabled]="busy()">{{busy() ? "Cargando…" : "↻ Actualizar"}}</button></div></div>
 @for(b of filteredBookings();track b.id){<article class="booking-card">
 <div class="booking-header"><div><p class="eyebrow">RESERVA #{{b.id}}</p><h3>{{b.laboratorio}}</h3><p>{{b.solicitante}} · {{b.fechaSolicitada | date:'dd/MM/yyyy HH:mm'}}</p></div><strong class="badge booking-state" [attr.data-state]="b.estado">{{b.estado.replaceAll("_"," ")}}</strong></div>
 @if(b.estado==='EN_USO' || b.estado==='DEVUELTA'){<div class="booking-actions"><button class="secondary" (click)="download(b.id,'RETIRO')">Vale de retiro</button>@if(b.estado==='DEVUELTA'){<button class="secondary" (click)="download(b.id,'DEVOLUCION')">Acta de devolución</button>}</div>}
 </article>}
 @empty{<div class="empty-state"><span>▦</span><h3>{{error() ? "Reservas no disponibles" : bookings().length ? "No hay reservas para este filtro" : "Tu próxima experiencia empieza aquí"}}</h3><p>{{error() ? "No pudimos cargar la lista. Intenta actualizar en unos momentos." : bookings().length ? "Prueba con otro período o selecciona Todas." : "Cuando solicites una reserva, podrás seguir su estado en este espacio."}}</p></div>}</section>
 @if(operator()){
 <section class="technician-workspace"><div class="section-heading"><span class="step">02</span><div><h2>Estado y tickets</h2><p>Gestiona el avance de las reservas y responde los tickets de preparación desde un espacio separado.</p></div></div><div class="technician-grid"><div class="technician-panel"><h3>Cambiar estado de reservas <span class="count">{{bookingsToManage().length}}</span></h3><p>Solo aparecen las reservas que tienen una transición disponible.</p>
 @for(b of bookingsToManage();track b.id){<article class="booking-card"><div class="booking-header"><div><p class="eyebrow">RESERVA #{{b.id}}</p><h3>{{b.laboratorio}}</h3><p>{{b.solicitante}} · {{b.fechaSolicitada | date:'dd/MM/yyyy HH:mm'}}</p></div><strong class="badge booking-state" [attr.data-state]="b.estado">{{b.estado.replaceAll("_"," ")}}</strong></div><div class="booking-actions" role="group" [attr.aria-label]="'Cambiar estado de la reserva ' + b.id">@for(s of nextStates(b.estado);track s){<button [class.cancel-action]="s==='CANCELADA'" (click)="change(b.id,s)" [disabled]="busy()">{{actionLabel(s)}}</button>}</div></article>}
 @empty{<div class="empty-state"><h3>No hay reservas por actualizar</h3><p>Las reservas visibles no tienen una transición pendiente.</p></div>}</div><ng-container *ngTemplateOutlet="ticketPanel"></ng-container></div></section>
 }@else{<section><ng-container *ngTemplateOutlet="ticketPanel"></ng-container></section>}
 <ng-template #ticketPanel><div class="technician-panel ticket-panel"><div class="section-heading spread"><div><h2>Tickets de preparación <span class="count">{{filteredTickets().length}}</span></h2><p>El ticket aparece después de que el técnico aprueba la reserva y se procesa la solicitud.</p></div><label class="date-filter">Filtrar por estado<select name="ticketStatusFilter" [ngModel]="ticketStatusFilter()" (ngModelChange)="ticketStatusFilter.set($event)"><option value="all">Todos</option><option value="PENDIENTE">Pendientes</option><option value="RESPONDIDO">Respondidos</option></select></label></div>
 @for(t of filteredTickets();track t.reservaId){<article class="ticket-card"><div class="booking-header"><div><h3>Reserva #{{t.reservaId}} · {{t.laboratorio}}</h3><p>Estado del ticket</p></div><strong class="badge" [attr.data-ticket-state]="t.estado">{{t.estado}}</strong></div>
 @if(t.respuesta){<p>{{t.respuesta}}</p>}
 @if(operator() && t.estado==='PENDIENTE'){<label>Respuesta del técnico<textarea maxlength="2000" [(ngModel)]="answers[t.reservaId]"></textarea></label><button (click)="answer(t.reservaId)" [disabled]="busy() || !answers[t.reservaId]?.trim()">Responder</button>}</article>}
 @empty{<div class="empty-state"><span>☷</span><h3>{{error() ? "No pudimos cargar los tickets" : tickets().length ? "No hay tickets con este estado" : "Sin preparaciones pendientes"}}</h3><p>{{error() ? "No pudimos cargar los tickets" : tickets().length ? "Prueba con otro estado o selecciona Todos." : "Las respuestas del equipo técnico aparecerán aquí."}}</p></div>}</div></ng-template></main>`,
 styleUrls: ['../academic.css'],
 styles: [`
   .booking-card { padding: 1rem 1.25rem; border: 1px solid #d8e5e9; border-radius: .9rem; margin: .75rem 0; background: #fbfdfe; }
   .booking-header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: .75rem; }
   .booking-header h3 { margin: .25rem 0; }
   .booking-header p { margin: 0; }
   .booking-state[data-state="SOLICITADA"], .booking-state[data-state="EN_PREPARACION"] { background: #fff3d8; color: #73500b; }
   .booking-state[data-state="CANCELADA"] { background: #fbeae7; color: #883129; }
   .booking-actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .85rem; }
   .cancel-action { background: #fff1ee; color: #883129; border: 1px solid #ebc1bb; }
   .booking-list-actions { display:flex; align-items:end; gap:.75rem; flex-wrap:wrap; }
   .date-filter { display:grid; gap:.3rem; color:#51677d; font-size:.82rem; font-weight:600; }
   .date-filter select { min-width:10rem; padding:.65rem .8rem; border:1px solid #cbdbe2; border-radius:.65rem; background:#fff; color:#17334a; font:inherit; }
   .technician-workspace { background:#f7fafc; }
   .technician-workspace > .section-heading { margin-bottom:1rem; }
   .technician-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:1rem; align-items:start; }
   .technician-panel { min-width:0; padding:1rem; border:1px solid #d8e5e9; border-radius:.9rem; background:#fff; }
   .technician-panel > h3 { margin-top:0; }
   .ticket-card { padding:.9rem; border:1px solid #d8e5e9; border-radius:.75rem; margin:.75rem 0; background:#fbfdfe; }
   .ticket-card [data-ticket-state="PENDIENTE"] { background:#fff3d8; color:#73500b; }
   .ticket-card [data-ticket-state="RESPONDIDO"] { background:#e8f7ef; color:#176b48; }
   .ticket-card textarea { display:block; width:100%; min-height:5rem; box-sizing:border-box; margin:.5rem 0; }
   @media(max-width:900px) { .technician-grid { grid-template-columns:1fr; } }
   @media(max-width:640px) { .booking-list-actions { width:100%; align-items:stretch; } .date-filter { flex:1; } .date-filter select { width:100%; } }
 `]
})
export class Bookings {
 private http=inject(HttpClient);private auth=inject(MicrosoftAuth);private cognito=inject(AuthService);
 resources=signal<Resource[]>([]);bookings=signal<Booking[]>([]);tickets=signal<Ticket[]>([]);operator=signal(false);busy=signal(false);error=signal('');notice=signal('');
 bookingDateFilter=signal<BookingDateFilter>('all');
 ticketStatusFilter=signal<TicketStatusFilter>('all');
 answers:Record<number,string>={};
 roleLabel=signal('Portal académico');
 actionLabel(state:string):string {
   return ({APROBADA:'Aprobar reserva', EN_PREPARACION:'Iniciar preparación', EN_USO:'Registrar retiro', DEVUELTA:'Registrar devolución', CANCELADA:'Cancelar reserva'} as Record<string,string>)[state] ?? state;
 }
 draft={recursoId:1,laboratorio:'',solicitante:this.auth.account()?.name ?? '',emailSolicitante:this.auth.account()?.username ?? '',fechaSolicitada:''};
 constructor(){this.load();}
 filteredBookings():Booking[]{
   const filter=this.bookingDateFilter();
   if(filter==='all')return this.bookings();
   const today=new Date();today.setHours(0,0,0,0);
   return this.bookings().filter(booking=>{
     const requestedAt=new Date(booking.fechaSolicitada);
     if(Number.isNaN(requestedAt.getTime()))return false;
     const bookingDay=new Date(requestedAt.getFullYear(),requestedAt.getMonth(),requestedAt.getDate());
     if(filter==='today')return bookingDay.getTime()===today.getTime();
     if(filter==='past')return bookingDay.getTime()<today.getTime();
     return bookingDay.getTime()>today.getTime();
   });
 }
 filteredTickets():Ticket[]{
   const filter=this.ticketStatusFilter();
   return filter==='all'?this.tickets():this.tickets().filter(ticket=>ticket.estado===filter);
 }
 bookingsToManage():Booking[]{return this.filteredBookings().filter(booking=>this.nextStates(booking.estado).length>0);}
 isCognitoSession():boolean{return this.cognito.hasValidToken();}
 private get isCognito():boolean{return this.isCognitoSession();}
 private get resourcesUrl():string{return this.isCognito?environment.apiCatalogo:academicApiBase+'/recursos';}
 private get reservationsUrl():string{return this.isCognito?environment.apiReservas:academicApiBase+'/reservas';}
 private get ticketsUrl():string{return this.isCognito?environment.apiReservas.replace(/\/api\/reservas\/?$/,'')+'/api/tickets':academicApiBase+'/tickets';}
 load(){this.busy.set(true);this.error.set('');forkJoin({resources:this.http.get<Resource[]>(this.resourcesUrl),me:this.isCognito?of({roles:['ROLE_ESTUDIANTE']}):this.http.get<{roles:string[]}>(academicApiBase+'/me'),bookings:this.http.get<Booking[]>(this.reservationsUrl),tickets:this.isCognito?of([] as Ticket[]):this.http.get<Ticket[]>(this.ticketsUrl)}).subscribe({next:r=>{this.resources.set(r.resources);if(r.resources.length && !r.resources.some(x=>x.id===this.draft.recursoId)){this.draft.recursoId=r.resources[0].id;}if(!this.draft.laboratorio)this.selectResource();this.roleLabel.set(r.me.roles.includes('ROLE_ADMIN') ? 'Administrador' : r.me.roles.includes('ROLE_OPERADOR') ? 'Técnico' : 'Estudiante');this.operator.set(r.me.roles.some(x=>['ROLE_ADMIN','ROLE_OPERADOR'].includes(x)));this.bookings.set(r.bookings);this.tickets.set(r.tickets);this.busy.set(false);},error:e=>this.fail(e)});}
 create(){if(this.busy())return;this.selectResource();this.busy.set(true);this.http.post(this.reservationsUrl,this.draft).subscribe({next:()=>{this.notice.set('Reserva solicitada.');this.load();},error:e=>this.fail(e)});}
 change(id:number,state:string){if(this.busy())return;this.busy.set(true);this.http.patch(this.reservationsUrl+'/'+id+'/estado',{nuevoEstado:state}).subscribe({next:()=>{this.notice.set('Estado actualizado. El ticket puede tardar unos segundos; pulsa Actualizar.');this.load();},error:e=>this.fail(e)});}
 answer(id:number){if(this.busy())return;this.busy.set(true);this.http.post(this.ticketsUrl+'/'+id+'/respuestas',{respuesta:this.answers[id]}).subscribe({next:()=>{this.notice.set('Respuesta guardada.');this.load();},error:e=>this.fail(e)});}
 selectResource(){this.draft.laboratorio=this.resources().find(r=>r.id===this.draft.recursoId)?.laboratorio??'';}
 download(id:number,kind:string){this.http.get(this.reservationsUrl+'/'+id+'/comprobantes/'+kind,{responseType:'blob'}).subscribe({next:blob=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='campuslab-'+id+'-'+kind+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},error:()=>this.error.set('El comprobante aún no está disponible. Espera unos segundos y vuelve a intentar.')});}
 nextStates(state:string):string[]{return ({SOLICITADA:['APROBADA','CANCELADA'],APROBADA:['EN_PREPARACION','CANCELADA'],EN_PREPARACION:['EN_USO','CANCELADA'],EN_USO:['DEVUELTA']} as Record<string,string[]>)[state]??[];}
 private fail(e:{status:number}){this.busy.set(false);this.error.set(e.status===403?'No tienes permiso para esta operación.':e.status===409?'El estado cambió. Actualiza la lista.':'No se pudo completar la operación. Revisa los datos y la conexión.');}
}
