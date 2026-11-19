# CampusLab Frontend

Aplicación Angular 22 para las experiencias de CampusLab. La interfaz académica usa Microsoft Entra ID con MSAL; el acceso externo conserva el flujo de autenticación Cognito a través del BFF. Las APIs se consumen por API Gateway y las vistas administrativas aplican guards en Angular, además de la autorización del backend.

## Funcionalidades y rutas

| Ruta | Uso |
|---|---|
| `/login` | Acceso académico con Microsoft o acceso administrativo con Cognito. |
| `/acceso-externo` | Registro/confirmación del usuario externo mediante Cognito. |
| `/cuenta` | Perfil y accesos rápidos; Técnico ve Estado y tickets en lugar de Mis reservas. |
| `/reservas` | Estudiante solicita y sigue reservas; Técnico/Admin gestiona estados y tickets en un apartado separado, sin formulario de nueva reserva. |
| `/cuenta/recursos` | Administración de recursos y stock para Admin. |
| `/cuenta/usuarios` | Consulta de cuentas, restringida a Admin. |
| `/cuenta/reportes` | Dashboard de reservas y Kafka embebido desde Grafana. |
| `/kafka/admin` | Consulta y administración de topics de laboratorio. |
| `/mensajeria/admin` | Administración de RabbitMQ para la identidad autorizada. |

La vista de reportes ocupa la pantalla y carga Grafana desde `http://localhost:3000`. Para verla localmente se necesita mantener abierto el túnel AWS Systems Manager al puerto 3000 de la instancia EP3. El dashboard y su configuración están en `CampusLab-Documentacion/infra/ep3/grafana`.

## Requisitos y ejecución

Instalar la versión de Node.js compatible con Angular 22 y npm indicada en `package.json`.

```powershell
npm ci
npm start
```

Abrir `http://localhost:4200`. El callback de MSAL está registrado para ese origen y puerto; no cambiar a `127.0.0.1` sin actualizar la configuración de la aplicación en Entra.

## Configuración

Los endpoints de API y la URL de Grafana se definen en `src/environments/environment.ts` y `environment.development.ts`. La configuración MSAL pública está en `src/app/auth-config.ts`; no se incluyen client secrets en Angular. Para acceder a APIs protegidas se requiere un token válido con el scope y rol correspondientes.

## Compilación

```powershell
npm run build
```

Las pruebas unitarias pueden ejecutarse con `npm test`. La compilación local de producción fue validada después de actualizar las vistas de reportes; la comprobación del flujo cloud con cuentas y roles debe realizarse aparte.

## Seguridad y límites

- Los guards mejoran la navegación, pero no reemplazan la autorización de API Gateway y Spring.
- No guardar claves AWS, contraseñas, tokens ni archivos `.env` en este repositorio.
- AWS Academy puede detener las instancias y cambiar sus IP públicas; al iniciar el laboratorio hay que actualizar las integraciones del Gateway.

Documentación, despliegue y evidencias: [CampusLab-Documentacion](https://github.com/Unluccky/CampusLab-Documentacion).
