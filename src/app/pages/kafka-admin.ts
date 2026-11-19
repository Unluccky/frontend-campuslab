import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { kafkaAdminApi } from '../auth-config';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  imports: [RouterLink, FormsModule],
  template: `
    <header class="topbar">
      <a class="brand" routerLink="/cuenta"><span class="brand-mark">C<span>·</span></span>CampusLab<small>ESPACIOS PARA APRENDER</small></a>
      <nav aria-label="Navegación principal"><a routerLink="/cuenta">Mi cuenta</a></nav>
    </header>
    <main class="kafka-page">
      <section class="hero">
        <p class="eyebrow">MENSAJERÍA / ADMINISTRACIÓN</p>
        <h1>Administración de Kafka</h1>
        <p>Administra los topics que reciben los eventos de CampusLab.</p>
      </section>
      <section class="inventory" aria-labelledby="topics-title" [attr.aria-busy]="loading()">
        <div class="inventory-header">
          <div>
            <h2 id="topics-title">Topics del clúster</h2>
            <p>Crear, ajustar retención y eliminar topics de laboratorio</p>
          </div>
          <button (click)="load()" [disabled]="busy()">{{ busy() ? 'Procesando…' : 'Actualizar lista' }}</button>
        </div>
        <form class="topic-form" (ngSubmit)="create()">
          <label for="topic-name">Nuevo topic (prefijo lab.)</label>
          <div class="form-row"><input id="topic-name" name="topicName" [(ngModel)]="newTopic" required pattern="lab\\.[a-zA-Z0-9._-]{1,120}" placeholder="lab.demo"/><button type="submit" [disabled]="busy()">Crear topic</button></div>
        </form>
        <p class="feedback" [class.failure]="failed()" role="status">{{ status() || 'Pulsa Consultar topics para cargar el inventario.' }}</p>
        @if (topics().length) {
          <ul aria-label="Topics encontrados">
            @for (topic of topics(); track topic) {
              <li><span class="topic-icon" aria-hidden="true">≋</span><code>{{ topic }}</code>
                <label class="retention">Retención (horas)<input type="number" min="1" [ngModel]="retentionHours()[topic] ?? 168" (ngModelChange)="setRetention(topic, $event)" [name]="'retention-' + topic"/></label>
                <button class="secondary" (click)="updateRetention(topic)" [disabled]="busy()">Guardar</button>
                <button class="danger" (click)="remove(topic)" [disabled]="busy() || !topic.startsWith('lab.')">Eliminar</button>
              </li>
            }
          </ul>
        }
      </section>
    </main>
  `,
  styleUrls: ['./academic.css'],
  styles: [`
    .kafka-page { max-width: 72rem; margin-inline: auto; }
    .hero { padding: clamp(1.5rem, 5vw, 3rem); border-radius: 1.25rem; background: linear-gradient(120deg, #102e3a, #176759); color: #fff; }
    .hero .eyebrow { color: #a8e7d6; }
    .hero h1 { color: inherit; margin: .5rem 0; }
    .hero p:last-child { margin: 0; color: #e1f3ee; }
    .inventory { margin-top: 1.5rem; padding: clamp(1rem, 4vw, 2rem); border: 1px solid #d5e2e8; border-radius: 1.25rem; background: #fff; }
    .inventory-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
    .inventory-header h2, .inventory-header p { margin: 0; }
    .inventory-header p { margin-top: .35rem; color: #496474; }
    .feedback { padding: .85rem 1rem; border-radius: .65rem; background: #edf5f6; color: #254c59; }
    .feedback.failure { background: #fff0ed; color: #8a3027; }
    .topic-form { display: grid; gap: .5rem; margin: 1.5rem 0; }
    .form-row { display: flex; flex-wrap: wrap; gap: .75rem; }
    input { border: 1px solid #b9ccd3; border-radius: .55rem; padding: .65rem .8rem; font: inherit; }
    .form-row input { flex: 1; min-width: 14rem; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { display: flex; flex-wrap: wrap; align-items: center; gap: .8rem; padding: .7rem 0; border-bottom: 1px solid #e1eaef; }
    li:last-child { border-bottom: 0; }
    code { overflow-wrap: anywhere; }
    .topic-icon { padding: .3rem .55rem; border-radius: .5rem; background: #e1f1eb; color: #146355; }
    .retention { display: inline-flex; align-items: center; gap: .45rem; margin-left: auto; color: #496474; }
    .retention input { width: 5rem; }
    .secondary { background: #eaf2f3; color: #173f49; }
    .danger { background: #fff0ed; color: #8a3027; }
    button { border: 0; border-radius: .55rem; padding: .65rem .85rem; font: inherit; cursor: pointer; }
    button:disabled { opacity: .55; cursor: wait; }
  `],
})
export class KafkaAdmin {
  private readonly http = inject(HttpClient);
  readonly topics = signal<string[]>([]);
  readonly status = signal('');
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly failed = signal(false);
  newTopic = '';
  readonly retentionHours = signal<Record<string, number>>({});

  load(): void {
    if (this.busy()) return;
    this.loading.set(true);
    this.busy.set(true);
    this.failed.set(false);
    this.topics.set([]);
    this.status.set('Consultando…');
    this.http.get<string[]>(kafkaAdminApi).subscribe({
      next: topics => {
        this.topics.set(topics);
        this.loading.set(false);
        this.busy.set(false);
        this.status.set(topics.length ? `Topics encontrados: ${topics.length}` : 'El clúster no tiene topics para mostrar.');
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.busy.set(false);
        this.failed.set(true);
        this.status.set(error.status === 403 ? 'Tu cuenta no tiene permiso de administrador.'
          : error.status === 401 ? 'Reportería no aceptó la sesión.'
          : 'No se pudo consultar Kafka.');
      },
    });
  }

  create(): void {
    const name = this.newTopic.trim();
    if (this.busy() || !/^lab\.[a-zA-Z0-9._-]{1,120}$/.test(name)) return;
    this.runMutation(() => this.http.post(`${kafkaAdminApi}/${encodeURIComponent(name)}`, null), `Topic ${name} creado.`);
  }

  setRetention(topic: string, hours: number): void {
    this.retentionHours.update(values => ({ ...values, [topic]: hours }));
  }

  updateRetention(topic: string): void {
    const hours = this.retentionHours()[topic] ?? 168;
    if (!Number.isFinite(hours) || hours < 1) {
      this.failed.set(true); this.status.set('La retención debe ser de al menos 1 hora.'); return;
    }
    const milliseconds = Math.round(hours * 60 * 60 * 1000);
    this.runMutation(() => this.http.patch(`${kafkaAdminApi}/${encodeURIComponent(topic)}/retention?milliseconds=${milliseconds}`, null), `Retención de ${topic} actualizada.`);
  }

  remove(topic: string): void {
    if (!topic.startsWith('lab.') || !confirm(`¿Eliminar el topic ${topic}? Esta acción borra el topic del clúster.`)) return;
    this.runMutation(() => this.http.delete(`${kafkaAdminApi}/${encodeURIComponent(topic)}`), `Topic ${topic} eliminado.`);
  }

  private runMutation(request: () => Observable<unknown>, success: string): void {
    this.busy.set(true); this.failed.set(false); this.status.set('Guardando cambios…');
    request().subscribe({
      next: () => { this.busy.set(false); this.status.set(success); this.newTopic = ''; this.load(); },
      error: (error: HttpErrorResponse) => {
        this.busy.set(false); this.failed.set(true);
        this.status.set(error.status === 403 ? 'Tu cuenta no tiene permiso de administrador.' : error.status === 401 ? 'Reportería no aceptó la sesión.' : error.error?.detail || error.error?.message || 'No se pudo modificar el topic.');
      },
    });
  }
}
