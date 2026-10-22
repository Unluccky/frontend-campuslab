import { TestBed } from '@angular/core/testing';
import { MsalService } from '@azure/msal-angular';
import { MicrosoftAuth } from './microsoft-auth';
import { apiScope } from '../auth-config';

describe('Microsoft academic authentication', () => {
  function setup(result: unknown = null) {
    const instance = {
      initialize: vi.fn().mockResolvedValue(undefined),
      handleRedirectPromise: vi.fn().mockResolvedValue(result),
      getActiveAccount: vi.fn().mockReturnValue(null),
      setActiveAccount: vi.fn(),
      loginRedirect: vi.fn().mockResolvedValue(undefined),
      logoutRedirect: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({ providers: [{ provide: MsalService, useValue: { instance } }] });
    return { auth: TestBed.inject(MicrosoftAuth), instance };
  }
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('restores the returned account and routes to the academic area without assigning admin rights', async () => {
    const account = { username: 'academic@example.edu', name: 'Academic' };
    const { auth, instance } = setup({ account });
    await auth.initialize();
    expect(instance.setActiveAccount).toHaveBeenCalledWith(account);
    expect(auth.account()).toEqual(account);
    expect(window.location.pathname).toBe('/cuenta');
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('handles a rejected redirect without blocking rendering or exposing the code', async () => {
    const { auth, instance } = setup();
    instance.handleRedirectPromise.mockRejectedValue(new Error('rejected'));
    await expect(auth.initialize()).resolves.toBeUndefined();
    expect(auth.account()).toBeNull();
    expect(auth.error()).toContain('No se pudo');
    expect(window.location.pathname).toBe('/login');
  });

  it('requests the CampusLab API scope and logs out the active Microsoft account', async () => {
    const account = { username: 'academic@example.edu' };
    const { auth, instance } = setup({ account });
    await auth.initialize();
    await auth.login();
    expect(instance.loginRedirect).toHaveBeenCalledWith({ scopes: [apiScope], prompt: 'select_account' });
    await auth.logout();
    expect(instance.logoutRedirect).toHaveBeenCalledWith({ account });
  });
});
