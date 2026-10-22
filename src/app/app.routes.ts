import { AdminUsuarios } from './pages/admin-usuarios/admin-usuarios';
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { AdminRecursos } from './pages/admin-recursos/admin-recursos';
import { authGuard, roleGuard } from './guard/auth-guard';
import { MsalGuard } from '@azure/msal-angular';
import { Account } from './pages/account/account';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'cuenta', component: Account, canActivate: [MsalGuard] },
  { path: 'reservas', loadComponent: () => import('./pages/bookings/bookings').then(m => m.Bookings), canActivate: [MsalGuard] },
  { path: 'mensajeria/admin', loadComponent: () => import('./pages/bookings/messaging-admin').then(m => m.MessagingAdmin), canActivate: [MsalGuard] },
  {
    path: 'admin',
    component: AdminRecursos,
    canActivate: [authGuard, roleGuard('ROLE_ADMIN')]
  },
  { path: 'admin/usuarios', component: AdminUsuarios, canActivate: [authGuard, roleGuard('ROLE_ADMIN')] },
  { path: '**', redirectTo: '' }
];
