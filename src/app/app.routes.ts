import { AdminUsuarios } from './pages/admin-usuarios/admin-usuarios';
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { AdminRecursos } from './pages/admin-recursos/admin-recursos';
import { authGuard, roleGuard, externalOrMicrosoftGuard } from './guard/auth-guard';
import { MsalGuard } from '@azure/msal-angular';
import { Account } from './pages/account/account';
import { azureCatalogApi } from './auth-config';
import { CATALOG_API, RecursoService } from './core/recurso';
import { academicAdminGuard } from './guard/auth-guard';

export const routes: Routes = [
  {
    path: 'cuenta/usuarios',
    component: AdminUsuarios,
    canActivate: [MsalGuard, academicAdminGuard],
    data: { academic: true },
  },
  {
    path: 'cuenta/recursos',
    component: AdminRecursos,
    canActivate: [MsalGuard, academicAdminGuard],
    providers: [RecursoService, { provide: CATALOG_API, useValue: azureCatalogApi }],
  },
  { path: 'kafka/admin', loadComponent: () => import('./pages/kafka-admin').then(m => m.KafkaAdmin), canActivate: [MsalGuard, academicAdminGuard] },
  { path: 'cuenta/reportes', loadComponent: () => import('./pages/report-dashboard').then(m => m.ReportDashboard), canActivate: [MsalGuard, academicAdminGuard] },
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'acceso-externo', loadComponent: () => import('./pages/external-access').then(m => m.ExternalAccess) },
  { path: 'cuenta', component: Account, canActivate: [MsalGuard] },
  { path: 'reservas', loadComponent: () => import('./pages/bookings/bookings').then(m => m.Bookings), canActivate: [externalOrMicrosoftGuard] },
  { path: 'mensajeria/admin', loadComponent: () => import('./pages/bookings/messaging-admin').then(m => m.MessagingAdmin), canActivate: [MsalGuard] },
  {
    path: 'admin',
    component: AdminRecursos,
    canActivate: [authGuard, roleGuard('ROLE_ADMIN')]
  },
  { path: 'admin/usuarios', component: AdminUsuarios, canActivate: [authGuard, roleGuard('ROLE_ADMIN')] },
  { path: '**', redirectTo: '' }
];
