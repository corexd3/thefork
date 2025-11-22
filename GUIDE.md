# Hacienda Alakran - Guía de Instalación

Guía paso a paso para configurar y ejecutar el servicio de webhooks de Vapi para reservas de restaurante.

## Qué Hace Este Proyecto

Este servicio conecta **Vapi** (asistente telefónico con IA) con **TheFork** (plataforma de reservas) para:

1. **Verificar disponibilidad** - Cuando un cliente llama y pide una reserva, Vapi consulta este servicio para ver si la fecha/hora está disponible
2. **Crear reservas** - Cuando termina la llamada, este servicio crea automáticamente la reserva en TheFork

```
Llamada del Cliente → Vapi IA → Este Servicio → Widget de TheFork
```

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener:

- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **npm** - Viene incluido con Node.js
- **Cuenta de ngrok** - [Registro gratuito](https://ngrok.com/) (necesario para exponer tu servidor local)

Para verificar que Node.js está instalado:
```bash
node --version   # Debería mostrar v18.x.x o superior
npm --version    # Debería mostrar 9.x.x o superior
```

---

## Paso 1: Clonar e Instalar

```bash
# Navega a tu carpeta de proyectos
cd ~/Documents/projects

# Clona el repositorio (o copia la carpeta)
# cd alakran

# Instala las dependencias
npm install

# Instala los navegadores de Playwright (necesario para la automatización de TheFork)
npx playwright install chromium
```

---

## Paso 2: Configurar el Entorno

```bash
# Crea tu archivo de entorno
cp .env.example .env
```

Edita el archivo `.env`:
```env
PORT=3000
NODE_ENV=production

# Opcional: Añade un secreto de webhook para mayor seguridad
# WEBHOOK_SECRET=tu_secreto_aqui
```

---

## Paso 3: Iniciar el Servidor

### Modo Desarrollo (con recarga automática):
```bash
npm run dev
```

### Modo Producción:
```bash
npm run build
npm start
```

Deberías ver:
```
========================================
Hacienda Alakran Vapi Service
========================================
Server running on port 3000
Environment: production

Available endpoints:
- GET  http://localhost:3000/
- GET  http://localhost:3000/health
- POST http://localhost:3000/webhooks/check-availability
- POST http://localhost:3000/webhooks/reservation-complete
========================================
```

**¡Mantén esta terminal abierta!**

---

## Paso 4: Configurar ngrok (¡CRÍTICO!)

### ¿Por qué ngrok?

Tu servidor local (`localhost:3000`) solo es accesible desde tu computadora. Los servidores de Vapi están en internet y no pueden alcanzar tu máquina local. **ngrok crea una URL pública que hace un túnel hacia tu servidor local.**

```
Vapi Cloud → URL de ngrok → Tu localhost:3000
```

### Instalar ngrok

1. Ve a [ngrok.com](https://ngrok.com/) y crea una cuenta gratuita
2. Descarga ngrok para tu sistema operativo
3. Conecta tu cuenta:

```bash
# Obtén tu authtoken de: https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken TU_AUTH_TOKEN
```

### Iniciar ngrok

Abre una **segunda terminal** (mantén el servidor corriendo en la primera):

```bash
ngrok http 3000
```

Verás algo como:
```
Session Status                online
Account                       tu@email.com
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:3000
```

**Copia la URL HTTPS** (ej: `https://abc123xyz.ngrok-free.app`)

### Notas Importantes

- La URL de ngrok cambia cada vez que reinicias ngrok (a menos que tengas un plan de pago)
- Siempre usa la URL **HTTPS**, no HTTP
- Mantén ngrok corriendo mientras pruebas

---

## Paso 5: Configurar Vapi

### 5.1 Configurar las URLs de Webhook

En tu panel de Vapi, actualiza las URLs de webhook:

**Función de Verificar Disponibilidad:**
```
https://TU-URL-NGROK.ngrok-free.app/webhooks/check-availability
```

**Reporte de Fin de Llamada:**
```
https://TU-URL-NGROK.ngrok-free.app/webhooks/reservation-complete
```

### 5.2 Esquema de Datos Estructurados

Asegúrate de que tu asistente de Vapi tenga configurado este esquema de datos estructurados:

```json
{
  "reservation": {
    "date": "string (formato AAAA-MM-DD)",
    "time": "string (formato HH:MM)",
    "people": "number",
    "full_name": "string",
    "honorific": "string",
    "baby": "boolean",
    "allergies": "string",
    "special_requests": "string"
  }
}
```

**Importante:** La fecha DEBE estar en formato ISO (`2025-12-03`), no en texto español (`3 de diciembre`).

---

## Paso 6: Probar la Configuración

### Verificación Rápida de Salud

```bash
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{"status":"healthy","service":"Hacienda Alakran Vapi Service","timestamp":"..."}
```

### Probar vía ngrok

```bash
curl https://TU-URL-NGROK.ngrok-free.app/health
```

---

## Estructura del Proyecto

```
alakran/
├── src/
│   ├── index.ts                        # Servidor Express principal
│   ├── controllers/
│   │   ├── availabilityController.ts   # Maneja verificaciones de disponibilidad
│   │   └── reservationController.ts    # Maneja creación de reservas
│   ├── services/
│   │   └── theForkScraper.ts           # Automatización de Playwright para TheFork
│   ├── middleware/
│   │   ├── logger.ts                   # Registro de peticiones/respuestas
│   │   └── validator.ts                # Validación con esquemas Zod
│   ├── routes/
│   │   └── webhooks.ts                 # Definiciones de rutas
│   └── types/
│       └── vapi.ts                     # Tipos TypeScript y esquemas Zod
├── .env                                # Configuración de entorno
├── package.json
└── tsconfig.json
```

---

## Cómo Funciona

### Flujo 1: Verificar Disponibilidad

```
1. Cliente: "Quiero una reserva para 4 personas el 3 de diciembre"
2. Vapi IA llama: POST /webhooks/check-availability
3. Este servicio:
   - Abre el widget de TheFork en navegador sin interfaz
   - Selecciona la fecha y número de personas
   - Devuelve los horarios disponibles
4. Vapi IA: "Tenemos disponibilidad a las 13:30, 20:00, 21:00..."
```

### Flujo 2: Crear Reserva

```
1. El cliente confirma todos los detalles y termina la llamada
2. Vapi envía: POST /webhooks/reservation-complete
3. Este servicio:
   - Abre el widget de TheFork
   - Rellena todos los datos de la reserva
   - Envía la reserva
   - Devuelve número de confirmación
4. La reserva aparece en TheFork Manager
```

---

## Solución de Problemas

### "Connection refused" o "No se puede alcanzar el servidor"

- Asegúrate de que el servidor esté corriendo (`npm run dev` o `npm start`)
- Asegúrate de que ngrok esté corriendo (`ngrok http 3000`)
- Usa la URL HTTPS de ngrok en Vapi, no localhost

### Error "Date not available" (Fecha no disponible)

La fecha puede estar en formato incorrecto. Verifica:
- Vapi debe enviar `2025-12-03`, no `3 de diciembre`
- Actualiza el prompt de tu asistente en Vapi para forzar el formato ISO

### Error "Time not available" (Hora no disponible)

El horario solicitado no está disponible en TheFork. El mensaje de error mostrará los horarios disponibles.

### "Wrong year" (Año incorrecto - 2023/2024 en vez de 2025)

El servicio corrige esto automáticamente, pero verás una advertencia en los logs. Actualiza el prompt de Vapi para especificar el año correcto.

### El servidor no detecta los cambios

Si editas el código y los cambios no se reflejan:
```bash
# Detén el servidor (Ctrl+C) y reinícialo
npm run dev
```

---

## Comandos Comunes

```bash
# Iniciar servidor de desarrollo (con recarga automática)
npm run dev

# Iniciar túnel ngrok
ngrok http 3000

# Verificar salud del servidor
curl http://localhost:3000/health

# Compilar para producción
npm run build

# Iniciar servidor de producción
npm start
```

---

## Despliegue en Producción

Para producción, querrás una URL permanente en lugar de ngrok:

1. Despliega en una plataforma de hosting (Railway, Render, Heroku, AWS, etc.)
2. Actualiza las URLs de webhook en Vapi con tu dominio de producción
3. Configura `NODE_ENV=production` en las variables de entorno

---

## Soporte

- Revisa los logs primero en la consola del servidor
- Verifica que ngrok esté corriendo y la URL sea correcta
- Prueba los endpoints con curl antes de probar con Vapi
- Asegúrate de que el widget de TheFork sea accesible (el restaurante debe estar en TheFork)
