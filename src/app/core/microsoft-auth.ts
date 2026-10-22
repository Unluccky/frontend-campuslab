import { Injectable, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { loginRequest } from '../auth-config';

@Injectable({ providedIn: 'root' })
export class MicrosoftAuth {
  private readonly msal = inject(MsalService);
  readonly account = signal<AccountInfo | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly ready = signal(false);

  async initialize(): Promise<void> {
    try {
      await this.msal.instance.initialize();
      const result = await this.msal.instance.handleRedirectPromise({ navigateToLoginRequestUrl: false });
      const account = result?.account ?? this.msal.instance.getActiveAccount();
      if (account) this.msal.instance.setActiveAccount(account);
      this.account.set(account ?? null);
      this.ready.set(true);
      if (result?.account) window.history.replaceState(null, '', '/cuenta');
    } catch {
      this.error.set('No se pudo completar el acceso con Microsoft. Vuelve a intentarlo.');
      // A failed redirect must not leave the authorization code in the URL.
      window.history.replaceState(null, '', '/login');
    }
  }

  async login(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      if (!this.ready()) await this.initialize();
      if (!this.ready()) return;
      await this.msal.instance.loginRedirect({ ...loginRequest, prompt: 'select_account' });
    } catch {
      this.error.set('No se pudo abrir el acceso de Microsoft. Inténtalo nuevamente.');
    } finally {
      this.busy.set(false);
    }
  }

  async logout(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.msal.instance.logoutRedirect({ account: this.account() });
    } catch {
      this.error.set('No se pudo cerrar la sesión de Microsoft. Inténtalo nuevamente.');
    } finally {
      this.busy.set(false);
    }
  }
}
