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
