import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';

const grafanaDashboardUrl = environment.grafanaDashboardUrl;

@Component({
  imports: [RouterLink],
  template: `
    <header class="topbar">
      <a class="brand" routerLink="/cuenta" aria-label="Volver a CampusLab">
        <span class="brand-mark">C<span>·</span></span>
        <span class="brand-name">CampusLab<small>OBSERVABILIDAD · EXPERIENCIA 3</small></span>
      </a>
      <div class="topbar-actions">
        <span class="live"><i></i>En vivo</span>
        <a class="open-dashboard" [href]="grafanaLink" target="_blank" rel="noopener">Abrir dashboard ↗</a>
      </div>
    </header>
    <main class="report-page">
      <iframe title="CampusLab: reservas y flujo Kafka" [src]="grafanaUrl" loading="eager" referrerpolicy="no-referrer"></iframe>
    </main>`,
  styles: [`
    :host { display:block; min-height:100vh; color:#e5edf7; background:#071525; font-family:Inter,"Segoe UI",Arial,sans-serif; }
    .topbar { min-height:76px; box-sizing:border-box; padding:0 clamp(1rem,3vw,2.75rem); display:flex; align-items:center; justify-content:space-between; gap:1rem; background:#091827; border-bottom:1px solid #183047; }
    .brand { display:flex; align-items:center; gap:.85rem; color:#f3f7ff; text-decoration:none; }
    .brand-mark { display:grid; place-items:center; width:40px; height:40px; border-radius:50%; color:#071525; background:linear-gradient(135deg,#35dccb,#62a7ff); font-weight:850; font-size:1.25rem; }
    .brand-mark span { color:#665ff2; }
    .brand-name { display:grid; gap:.18rem; font-size:1.05rem; font-weight:750; letter-spacing:.01em; }
    .brand-name small { color:#8fa8c1; font-size:.64rem; font-weight:500; letter-spacing:.14em; }
    .topbar-actions { display:flex; align-items:center; gap:1.25rem; }
    .live { display:flex; align-items:center; gap:.5rem; color:#c5d6e8; font-size:.85rem; }
    .live i { width:9px; height:9px; border-radius:50%; background:#36d6a3; box-shadow:0 0 12px #36d6a388; }
    .open-dashboard { color:#7ddbd1; font-size:.86rem; text-decoration:none; }
    .open-dashboard:hover { color:#b5fff4; }
    .report-page { width:100%; box-sizing:border-box; padding:14px clamp(.5rem,1.8vw,1.5rem) 20px; }
    iframe { display:block; width:100%; height:calc(100vh - 110px); min-height:700px; border:1px solid #1b3550; border-radius:16px; background:#0b1727; box-shadow:0 18px 48px #020b1466; }
    @media(max-width:640px) {
      .topbar { min-height:68px; padding:0 .85rem; }
      .brand-mark { width:34px; height:34px; }
      .brand-name { font-size:.94rem; }
      .brand-name small { font-size:.52rem; letter-spacing:.1em; }
      .topbar-actions { gap:.75rem; }
      .live { font-size:.74rem; }
      .open-dashboard { font-size:.74rem; }
      .report-page { padding:.5rem; }
      iframe { height:calc(100vh - 84px); min-height:620px; border-radius:10px; }
    }
  `],
})
export class ReportDashboard {
  private readonly sanitizer = inject(DomSanitizer);
  readonly grafanaUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(grafanaDashboardUrl);
  readonly grafanaLink = grafanaDashboardUrl;
}
