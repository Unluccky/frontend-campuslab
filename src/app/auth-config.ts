import { BrowserCacheLocation, Configuration } from '@azure/msal-browser';

export const apiScope = 'api://feba3b3c-7f62-4750-b179-8b2eb402f6ab/access-all';
export const loginRequest = { scopes: [apiScope] };
export const msalConfig: Configuration = {
  auth: {
    clientId: '1eb98820-862c-45ec-9de2-c37ba699e362',
    authority: 'https://login.microsoftonline.com/c98282a6-2da3-4791-98c0-dcf952c6454b',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200',
  },
  cache: { cacheLocation: BrowserCacheLocation.SessionStorage },
};

// Academic requests pass through API Gateway and the Azure-protected BFF.
export const academicApiBase = 'https://pludtc2ix3.execute-api.us-east-1.amazonaws.com/api/bff/academic';
export const azureProtectedResources = new Map<string, string[]>([
  [academicApiBase + '/*', [apiScope]],
]);
