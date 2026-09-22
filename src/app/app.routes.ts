import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { AdminRecursos } from './pages/admin-recursos/admin-recursos';
import { authGuard, roleGuard } from './guard/auth-guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  {
    path: 'admin',
    component: AdminRecursos,
    canActivate: [authGuard, roleGuard('ROLE_ADMIN')]
  },
  { path: '**', redirectTo: '' }
];''