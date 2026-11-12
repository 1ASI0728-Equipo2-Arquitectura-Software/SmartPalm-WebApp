# SmartPalm Web App

Aplicación web Angular para la administración de cuentas, plantaciones y dispositivos IoT de SmartPalm, además del monitoreo de lecturas, salud de sectores, recomendaciones e intervenciones agronómicas.

La aplicación consume el API Gateway de la plataforma de microservicios. No contiene una API propia ni persiste datos de negocio; la autoridad para usuarios, roles, suscripciones, ownership, dispositivos y permisos permanece en el backend.

## Estado actual

### Funcionalidades implementadas

- Autenticación contra el backend real mediante `POST /api/v1/authentication/sign-in`.
- Persistencia de sesión por pestaña usando `sessionStorage`.
- Lectura del rol únicamente desde los claims del JWT.
- Detección de tokens expirados, limpieza de sesión y redirección mediante guards.
- Interceptor para enviar `Authorization: Bearer <JWT>` a las API protegidas.
- Internacionalización español/inglés mediante archivos JSON.
- Dashboard con KPIs, últimas lecturas, tendencias, gateways, salud del sector, recomendaciones e intervenciones.
- Monitoreo de gateways y dispositivos IoT obtenidos desde la API, sin MACs ni propietarios codificados en modo real.
- Visualización del contexto real del dispositivo: usuario, plantación, sector, gateway, estado activo y estado de provisión.
- Consulta de lecturas por dispositivo, gateway o sector.
- Consulta de salud del sector y estado de conectividad.
- Consulta y actualización de umbrales de sensores.
- Manejo visual de dispositivos sin datos, desconectados, inactivos, revocados o no provisionados.
- Dashboard y vistas de recomendaciones agronómicas.
- Creación, aprobación y publicación de recomendaciones según el rol autorizado.
- Consulta de intervenciones de campo por sector.
- Consulta del perfil y de la suscripción del usuario autenticado.

### Consola administrativa

La consola está protegida por `authGuard` y `adminGuard` y se encuentra bajo `/admin`.

Actualmente permite:

1. Crear y listar usuarios `PalmGrower` y `Agronomist`.
2. Consultar, crear y activar suscripciones.
3. Procesar el pago del plan y verificar que la suscripción quede en estado `Active`.
4. Crear una plantación asociada al `PalmGrower` mediante `palmGrowerId`.
5. Crear sectores antes de registrar el dispositivo, sin asignar MAC al sector.
6. Registrar un Edge Gateway con `ownerUserId`.
7. Registrar un dispositivo IoT con `ownerUserId`, `plantationId` y `sectorId`.
8. Mostrar `CloudKey` y `BootstrapKey` únicamente en memoria después de registrarlos.
9. Copiar temporalmente las credenciales para la preparación física y limpiarlas mediante confirmación.
10. Asociar opcionalmente un agrónomo a la plantación.
11. Eliminar usuarios mediante `DELETE` administrativo y consultar el estado de la operación.

El flujo de alta se detiene si falla la creación de la suscripción, plantación, sector, gateway o dispositivo IoT. La afiliación del agrónomo es opcional y se registra como advertencia si no puede completarse.

### Borrado administrativo

El Web App usa:

```text
DELETE /api/v1/admin/users/{userId}
GET    /api/v1/admin/users/deletion-operations/{operationId}
```

El polling se ejecuta desde un servicio raíz, por lo que continúa aunque el administrador cambie de ruta o se destruya `AdminUsersComponent`.

El resultado se muestra mediante una notificación global:

- fija en la esquina superior derecha;
- estados de éxito y error;
- botón accesible `X`;
- desvanecimiento alrededor de 4.5 segundos;
- ocultamiento completo a los 5 segundos;
- mensajes en español e inglés.

El borrado de los datos relacionados lo coordina el backend mediante eventos de integración. El cierre del toast no cancela la operación en el backend.

## Rutas principales de la aplicación

| Ruta | Funcionalidad | Acceso |
|---|---|---|
| `/auth/login` | Inicio de sesión de usuarios humanos | Público |
| `/auth/login/admin` | Inicio de sesión administrativo para demostraciones | Público, requiere rol después de autenticarse |
| `/dashboard` | Dashboard de monitoreo y operación agronómica | Usuario autenticado con rol de escritorio |
| `/monitoreo` | Gateways, dispositivos, lecturas, salud y umbrales | Usuario autenticado |
| `/recomendaciones` | Lista y detalle de recomendaciones | Usuario autenticado |
| `/recomendaciones/new` | Crear una recomendación | Agronomist |
| `/intervenciones` | Consultar intervenciones de campo | Usuario autenticado |
| `/profile` | Perfil del usuario | Usuario autenticado |
| `/subscription/plans` | Consulta de planes | Usuario autenticado |
| `/subscription/me` | Consulta de la suscripción actual | Usuario autenticado |
| `/admin` | Inicio de la consola administrativa | Administrator |
| `/admin/users` | Crear, listar y eliminar usuarios | Administrator |
| `/admin/growers` | Flujo guiado de alta de PalmGrower y dispositivos | Administrator |
| `/admin/access` | Gestión administrativa de acceso y planes | Administrator |
| `/admin/field` | Gestión administrativa de plantaciones y campo | Administrator |

## Funcionalidades presentes pero deshabilitadas o no expuestas actualmente

El código contiene servicios y componentes para alertas, notificaciones, reportes, inspecciones y gestión general de plantaciones. En la configuración actual de desarrollo y producción estas capacidades tienen flags desactivados o no tienen una ruta principal conectada:

```ts
alerts: false,
reports: false,
inspections: false,
notifications: false,
plantationsApi: false,
```

La creación de plantaciones para la demostración administrativa sí está habilitada mediante `/admin/growers` y `AdminApiService.createPlantation`. La activación de las vistas generales de plantaciones, alertas, notificaciones, reportes e inspecciones requiere validar primero los contratos y permisos del backend actual.

El registro público y la recuperación/restablecimiento de contraseña no están disponibles en el backend actual. El alta de cuentas se realiza desde la consola administrativa.

## Configuración

### Desarrollo con backend real

La configuración de desarrollo se encuentra en [`src/environments/environment.ts`](src/environments/environment.ts):

```ts
apiUrl: 'http://localhost:5100/api/v1',
dataSource: 'real',
demoAuth: false,
```

El Web App espera que el API Gateway esté disponible en `http://localhost:5100`.

### Producción

La configuración de producción se encuentra en [`src/environments/environment.prod.ts`](src/environments/environment.prod.ts) , sin embargo, el Web App no se ha desplegado en un ambiente de producción real. La URL del API Gateway debe ajustarse según la infraestructura de despliegue para los microservicios.

### Scripts disponibles

```bash
npm install
npm run start:real
npm run start:mock
npm run build
npm test
```

`start:real` ejecuta únicamente Angular contra el backend configurado. `start:mock` conserva el script histórico que inicia Angular junto con `../../smartpalm-mock-api/server.js`; debe utilizarse solamente si esa carpeta de mock existe y es compatible con los contratos actuales.

Para iniciar el servidor de desarrollo directamente:

```bash
ng serve
```

Después, abrir `http://localhost:4200/`.

## Estructura relevante del código

```text
src/app/
├── platform-admin/                    # Consola y operaciones administrativas
│   ├── application/                   # Workflows administrativos, incluido borrado
│   ├── infrastructure/               # AdminApiService y contratos REST
│   └── presentation/                 # Vistas /admin
├── features/iot-device-management/   # Contexto, gateways, dispositivos y monitoreo
├── crop-monitoring-dashboard/         # Dashboard y KPIs
├── subscription-and-user-management/  # Login, perfil, planes y suscripciones
├── agronomic-recommendation/          # Recomendaciones y reportes
├── field-technical-management/        # Plantaciones, inspecciones e intervenciones
├── alert-and-notification/            # Alertas y notificaciones
├── shared/infrastructure/             # Auth, interceptor, lecturas y toast global
├── shared/presentation/                # Shell, navbar, sidebar y componentes globales
└── i18n/                              # Servicio, pipe y resolución de idioma
```

Archivos importantes para el flujo administrativo y de monitoreo:

- [`src/app/platform-admin/infrastructure/admin-api.service.ts`](src/app/platform-admin/infrastructure/admin-api.service.ts)
- [`src/app/platform-admin/presentation/views/admin-growers/admin-growers.component.ts`](src/app/platform-admin/presentation/views/admin-growers/admin-growers.component.ts)
- [`src/app/platform-admin/presentation/views/admin-users/admin-users.component.ts`](src/app/platform-admin/presentation/views/admin-users/admin-users.component.ts)
- [`src/app/platform-admin/application/admin-user-deletion.service.ts`](src/app/platform-admin/application/admin-user-deletion.service.ts)
- [`src/app/features/iot-device-management/infrastructure/iot-device-context.service.ts`](src/app/features/iot-device-management/infrastructure/iot-device-context.service.ts)
- [`src/app/features/iot-device-management/infrastructure/edge-gateway-api.service.ts`](src/app/features/iot-device-management/infrastructure/edge-gateway-api.service.ts)
- [`src/app/shared/infrastructure/sensor-reading.service.ts`](src/app/shared/infrastructure/sensor-reading.service.ts)
- [`src/app/features/iot-device-management/presentation/monitoring-hub/monitoring-hub.component.ts`](src/app/features/iot-device-management/presentation/monitoring-hub/monitoring-hub.component.ts)
- [`src/app/shared/infrastructure/auth.service.ts`](src/app/shared/infrastructure/auth.service.ts)
- [`src/app/shared/infrastructure/global-toast.service.ts`](src/app/shared/infrastructure/global-toast.service.ts)
- [`src/app/shared/presentation/global-toast/global-toast.component.ts`](src/app/shared/presentation/global-toast/global-toast.component.ts)
- [`src/app/app.routes.ts`](src/app/app.routes.ts)
- [`src/assets/i18n/es.json`](src/assets/i18n/es.json) y [`src/assets/i18n/en.json`](src/assets/i18n/en.json)

## Endpoints consumidos

El Web App utiliza principalmente estas familias de endpoints del API Gateway:

```text
POST   /api/v1/authentication/sign-in

GET    /api/v1/admin/users
POST   /api/v1/admin/users
DELETE /api/v1/admin/users/{userId}
GET    /api/v1/admin/users/deletion-operations/{operationId}

POST   /api/v1/admin/subscriptions
POST   /api/v1/admin/subscriptions/users/{userId}/payments

POST   /api/v1/plantations
POST   /api/v1/admin/plantations/{plantationId}/sectors
POST   /api/v1/admin/edge-gateways
POST   /api/v1/admin/edge-gateways/{gatewayMac}/iot-devices

GET    /api/v1/edge-gateways
GET    /api/v1/edge-gateways/{gatewayMac}/devices
GET    /api/v1/devices/{deviceMac}/sensor-readings
GET    /api/v1/sectors/{sectorId}/sensor-readings
GET    /api/v1/edge-gateways/{gatewayMac}/sensor-readings
GET    /api/v1/sectors/{sectorId}/health
GET    /api/v1/devices/{deviceMac}/thresholds
PATCH  /api/v1/devices/{deviceMac}/thresholds

GET/POST /api/v1/recommendations
GET/POST /api/v1/interventions
GET      /api/v1/subscriptions
```

El backend sigue siendo la autoridad para autorización, ownership, estado de suscripción y validación de los identificadores recibidos.

## Seguridad y manejo de credenciales

- JWT se utiliza únicamente para usuarios humanos y administradores.
- CloudKey y BootstrapKey se muestran una sola vez en la consola administrativa.
- Las credenciales de registro no deben guardarse en `localStorage`, `sessionStorage`, logs ni en el repositorio.
- El Web App mantiene las credenciales de alta únicamente en memoria mientras se prepara físicamente el gateway y el sensor.
- La API key operativa del sensor no se configura en el Web App ni se escribe en el código del firmware; se genera durante el enrolamiento y se guarda en NVS.
- Un `403` del backend se presenta como falta de permisos cuando aplica, no como un error genérico.

## Verificación realizada

Validaciones recientes del Web App:

```bash
npx ng build --configuration development
npx ng test --no-watch --no-progress
```

El build de desarrollo fue exitoso. También pasan las pruebas específicas del servicio de toast, del componente global, del workflow de borrado y del componente raíz.

La suite completa todavía requiere trabajo: se observaron fallos en pruebas existentes de internacionalización, configuración de `LOCALE_ID` y otros componentes no relacionados directamente con el toast. Estos fallos deben resolverse o documentarse antes de considerar la validación global completamente cerrada.

## Pendientes principales

1. Ejecutar una prueba E2E con el backend y el Gateway levantados.
2. Confirmar que el flujo administrativo completo active la suscripción antes de crear y registrar los recursos.
3. Verificar físicamente el enrolamiento del sensor, la persistencia en NVS y la transmisión de lecturas.
4. Confirmar que las lecturas visibles conservan usuario, plantación, sector, gateway y dispositivo correctos.
5. Probar bootstrap incorrecto, bootstrap reutilizado, dispositivo revocado, plan inactivo, relaciones inválidas y respuesta `403`.
6. Resolver los fallos restantes de la suite completa del Web App.
7. Validar la compatibilidad del Mobile App con los mismos contratos antes de habilitar nuevas vistas compartidas.
8. Activar alertas, notificaciones, reportes, inspecciones y plantaciones generales solo después de validar sus endpoints y permisos del backend.
9. Revisar las credenciales de desarrollo y configurar valores específicos por ambiente antes de publicar.

## Flujo recomendado de demostración

1. Levantar el backend y el API Gateway.
2. Ejecutar el Web App con `npm run start:real`.
3. Iniciar sesión como Administrator en `/auth/login/admin`.
4. Crear o seleccionar un PalmGrower en `/admin/growers`.
5. Activar su plan y confirmar el estado `Active`.
6. Crear plantación y sector.
7. Registrar el gateway y guardar temporalmente su CloudKey.
8. Registrar el IoT, guardar temporalmente su BootstrapKey y configurar el sensor.
9. Iniciar Edge API, Edge Node y sensor.
10. Confirmar la provisión única y la transmisión de lecturas.
11. Consultar `/dashboard` o `/monitoreo` y comprobar la propiedad real de los datos.
12. Ejecutar, si corresponde, el borrado administrativo desde `/admin/users` y verificar el toast y la eliminación distribuida.
