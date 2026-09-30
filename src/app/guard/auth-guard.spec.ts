import {TestBed} from '@angular/core/testing';
import {provideRouter,Router,ActivatedRouteSnapshot,RouterStateSnapshot} from '@angular/router';
import {AuthService} from '../core/auth';
import {authGuard,roleGuard} from './auth-guard';
import {vi} from 'vitest';
describe('Protección Admin',()=>{
 const auth={hasValidToken:vi.fn(),hasRole:vi.fn()};
 beforeEach(()=>{TestBed.configureTestingModule({providers:[provideRouter([]),{provide:AuthService,useValue:auth}]});auth.hasValidToken.mockReturnValue(false);auth.hasRole.mockReturnValue(false);});
 const run=(guard:typeof authGuard)=>TestBed.runInInjectionContext(()=>guard({} as ActivatedRouteSnapshot,{url:'/admin'} as RouterStateSnapshot));
 it('redirige sin sesión o con sesión vencida',()=>{expect(TestBed.inject(Router).serializeUrl(run(authGuard) as any)).toBe('/login');});
 it('rechaza una cuenta autenticada sin Admin',()=>{auth.hasValidToken.mockReturnValue(true);expect(run(authGuard)).toBe(true);expect(TestBed.inject(Router).serializeUrl(run(roleGuard('ROLE_ADMIN')) as any)).toBe('/login');});
 it('permite Admin y pide exactamente ROLE_ADMIN',()=>{auth.hasValidToken.mockReturnValue(true);auth.hasRole.mockReturnValue(true);expect(run(authGuard)).toBe(true);expect(run(roleGuard('ROLE_ADMIN'))).toBe(true);expect(auth.hasRole).toHaveBeenCalledWith('ROLE_ADMIN');});
});
