# Actualización: siguiente experiencia

Rama feature/siguiente-experiencia. Incluye las mejoras solicitadas después de EA1; ver CampusLab-Documentacion/infra/siguiente/README.md. Catálogo, reservas y usuarios usan RDS en AWS. El frontend incorpora /admin/usuarios, guard probado y Login Admin renovado. El BFF conserva el login con Cognito y requiere credenciales temporales vigentes. La documentación EA1 que sigue describe la entrega anterior.

# CampusLab Frontend

Cliente Angular 22 de CampusLab para la EA1 de Iniciando Cloud Native I (Duoc UC). TypeScript, formularios reactivos y CSS propio; sin SSR ni Tailwind.

## Pantallas

- **Home:** presentación, ilustración SVG local de laboratorio y acceso al login.
- **Login:** autenticación real contra Cognito a través del BFF local; enlaces visuales de registro y recuperación de contraseña.
- **Admin:** CRUD de recursos, indicadores calculados del catálogo, búsqueda, filtro por tipo, mensajes de validación y diseño adaptable a móvil.

La ruta `/admin` comprueba vigencia del token y grupo `ROLE_ADMIN`. El interceptor envía el access token solo a las APIs configuradas y omite el endpoint de login. La seguridad efectiva se valida también en API Gateway y catalog.

## Ejecutar

Instalar Node.js compatible con Angular 22 y npm; la versión usada por el proyecto figura en `package.json`.

```powershell
npm ci
npm start
```

Abrir `http://localhost:4200`. El BFF debe ejecutarse en el puerto 8081 con sus variables temporales de AWS Academy para iniciar sesión.

## Configuración actual

Editar `src/environments/environment.ts` y `environment.development.ts` si cambian los endpoints:

| Servicio | URL |
|---|---|
| Login BFF local | http://localhost:8081/api/bff |
| Catálogo AWS | https://pludtc2ix3.execute-api.us-east-1.amazonaws.com/api/catalogo |
| Reservas local | http://localhost:8083/api/reservas |

El catálogo AWS requiere EC2 encendida y el Learner Lab disponible. Angular y BFF permanecen locales. La interfaz de reservas no está implementada. Para usar catálogo local, cambiar `apiCatalogo` a `http://localhost:8082/api/catalogo` en ambos archivos de entorno.

## Validación

```powershell
npm run build
npm test -- --watch=false --include=src/app/pages/admin-recursos/admin-recursos.spec.ts --include=src/app/core/auth.spec.ts --include=src/app/core/recurso.spec.ts
```

Compilación aprobada y nueve pruebas específicas aprobadas. No se afirma que la suite completa de pruebas generadas por Angular esté validada. Home y Admin se revisaron visualmente en escritorio y a 390 px, sin desbordamiento horizontal. En Admin la revisión visual automatizada utiliza datos simulados; el login real y la creación de un recurso cloud se verificaron por separado.

Los enlaces de registro y recuperación son visuales en EA1; aún no realizan esas operaciones. No incluir credenciales AWS ni contraseñas en el frontend.

[Diagramas, despliegue y evidencias](https://github.com/Unluccky/CampusLab-Documentacion)
# Acceso académico Microsoft (Experiencia 2)

Angular integra `@azure/msal-angular` 6.2.3 y `@azure/msal-browser` 5.25.1.
Ejecutar `npm ci` y `npm start`; abrir **http://localhost:4200/login** y seleccionar
**Iniciar sesión con Microsoft**. Usar la cuenta académica del tenant CampusLab.
El callback y el retorno de logout son `http://localhost:4200`, registrados como SPA.
Para este flujo usar localhost, no 127.0.0.1 ni otro puerto.

La configuración pública está en `src/app/auth-config.ts`: client ID del frontend,
tenant de CampusLab y scope `access-all` del backend. No se utilizan client secrets.
MSAL gestiona Authorization Code + PKCE y guarda su caché en sessionStorage.
`provideAppInitializer` inicializa MSAL y procesa la respuesta antes del router.
En MSAL Browser 5, `navigateToLoginRequestUrl` se pasa a `handleRedirectPromise`.

La ruta `/cuenta` está protegida con MsalGuard; muestra nombre y correo y permite
cerrar sesión en Microsoft. No muestra tokens ni asigna roles administrativos.
El acceso Cognito permanece bajo **Acceso de administración existente** en `/login`.
Ambas sesiones son independientes: cerrar Microsoft no cierra Cognito y viceversa.

**Límite de esta etapa:** las APIs desplegadas todavía utilizan Cognito.
El código local de BFF, catálogo y reservas admite Azure con `AZURE_ENABLED=true`;
valida firma, issuer, audience, tenant, cliente autorizado, scope y expiración.
El mapa `azureProtectedResources` incluye únicamente
`http://localhost:8081/api/bff/academic/*`. El interceptor Cognito omite ese prefijo.
La pantalla `/cuenta` consulta `/academic/me` para comprobar acceso al BFF y mostrar
los roles reconocidos. Esta comprobación requiere el BFF local activo con Azure.
La asignación de administración exige rol explícito o un OID configurado en backend.
Un login académico exitoso no concede acceso al catálogo de administración existente.

Verificación del 16/10/2026: login académico real con retorno a `/cuenta`, cierre de
sesión confirmado por Microsoft y 23 pruebas automatizadas aprobadas. Build de
producción exitoso con advertencia de tamaño inicial (~664 kB frente a 500 kB).
Las pruebas unitarias cubren retorno de login, error del callback, scope y logout;
no sustituyen la prueba pendiente de API con un access token académico real.

Referencia: https://learn.microsoft.com/en-us/entra/msal/javascript/angular/initialization

## Reservas y tickets académicos

Ruta `/reservas`, accesible desde `/cuenta`, protegida con MsalGuard. Solicita reservas,
lista reservas y tickets y ofrece transiciones/respuestas al técnico o Admin. El servidor
comprueba además roles y propiedad; ocultar botones no es la autorización efectiva.
Utiliza `/api/bff/academic/reservas` y `/api/bff/academic/tickets`, incluidos en el mapa MSAL.
El BFF reenvía a bookings (`campuslab.bookings.url`, por defecto localhost:8083).
Activar Azure en ambos servicios y Rabbit en bookings para procesamiento asíncrono.

Estado local: formulario usa el identificador de recurso; selector de catálogo y
coordinación de stock pendientes. El enlace real con Azure/Gateway/EC2 aún debe probarse.
