import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { MSAL_INSTANCE, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG, MsalService, MsalGuard, MsalBroadcastService, MsalInterceptor } from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { azureProtectedResources, loginRequest, msalConfig } from './auth-config';
import { MicrosoftAuth } from './core/microsoft-auth';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]), withInterceptorsFromDi()),
    { provide: MSAL_INSTANCE, useFactory: () => new PublicClientApplication(msalConfig) },
    { provide: MSAL_GUARD_CONFIG, useValue: { interactionType: InteractionType.Redirect, authRequest: loginRequest, loginFailedRoute: '/login' } },
    { provide: MSAL_INTERCEPTOR_CONFIG, useValue: { interactionType: InteractionType.Redirect, protectedResourceMap: azureProtectedResources } },
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    MsalService, MsalGuard, MsalBroadcastService,
    provideAppInitializer(() => inject(MicrosoftAuth).initialize()),
  ]
};
