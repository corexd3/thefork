# Hacienda Alakran - Servicio de Webhooks Vapi

Servicio Node.js/TypeScript para gestionar webhooks de Vapi para el sistema de reservas del restaurante Hacienda Alakran.

## Descripción General

Este servicio proporciona dos endpoints de webhook que se integran con Vapi para reservas telefónicas automatizadas:

1. **Webhook de Verificar Disponibilidad** - Se llama durante las conversaciones para verificar la disponibilidad del restaurante
2. **Webhook de Reserva Completada** - Se llama cuando una conversación de reserva termina exitosamente

## Características

- TypeScript para seguridad de tipos
- Validación de esquemas Zod para payloads de webhook
- Registro de peticiones/respuestas para depuración
- Autenticación opcional con secreto de webhook
- Endpoint de verificación de salud
- Integración con TheFork mediante Playwright

## Requisitos Previos

- Node.js 18+
- npm o yarn
- Cuenta de ngrok (para desarrollo/pruebas)

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Instalar navegador de Playwright:
```bash
npx playwright install chromium
```

3. Crear archivo de entorno:
```bash
cp .env.example .env
```

4. Configurar tu archivo `.env`:
```env
PORT=3000
NODE_ENV=production

# Opcional: Para seguridad de webhook (recomendado para producción)
WEBHOOK_SECRET=tu_secreto_aqui
```

## Ejecutar el Servicio

### Modo desarrollo (con recarga automática):
```bash
npm run dev
```

### Modo producción:
```bash
npm run build
npm start
```

El servicio iniciará en `http://localhost:3000` (o el PORT configurado).

## Exponer el Servicio con ngrok

**¡localhost:3000 NO es accesible desde internet!**

Los servidores de Vapi no pueden alcanzar tu máquina local. Debes exponer tu servicio usando ngrok:

```bash
# Terminal 1: Inicia tu servicio
npm run dev

# Terminal 2: Inicia ngrok
ngrok http 3000
```

Copia la URL HTTPS (ej: `https://abc123.ngrok-free.app`) y úsala en Vapi.

Para instrucciones detalladas, consulta [GUIDE.md](GUIDE.md).

## Endpoints de API

### Verificación de Salud
```
GET /health
```

Devuelve el estado de salud del servicio.

### Webhook de Verificar Disponibilidad
```
POST /webhooks/check-availability
```

Llamado por Vapi cuando se invoca la función `checkAvailabilityALAKRAN` durante una conversación.

**Cuerpo de Petición (formato tool-calls):**
```json
{
  "message": {
    "type": "tool-calls",
    "toolCalls": [{
      "id": "call-id",
      "type": "function",
      "function": {
        "name": "checkAvailabilityALAKRAN",
        "arguments": {
          "date": "2025-12-03",
          "people": 4
        }
      }
    }]
  }
}
```

**Respuesta:**
```json
{
  "results": [{
    "toolCallId": "call-id",
    "result": "Tenemos disponibilidad para 4 personas el 2025-12-03. Horarios disponibles: 13:30, 20:00, 21:00..."
  }]
}
```

### Webhook de Reserva Completada
```
POST /webhooks/reservation-complete
```

Llamado por Vapi al final de una conversación de reserva exitosa con datos estructurados.

**Cuerpo de Petición:**
```json
{
  "message": {
    "type": "end-of-call-report",
    "call": {
      "customer": {
        "number": "+34612345678"
      }
    },
    "analysis": {
      "structuredData": {
        "reservation": {
          "date": "2025-12-03",
          "time": "20:00",
          "people": 4,
          "full_name": "Juan Pérez",
          "honorific": "Sr.",
          "baby": false,
          "allergies": "gluten",
          "special_requests": "mesa junto a la ventana"
        }
      }
    }
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Reservation confirmed successfully",
  "data": {
    "reservationId": "ABC123",
    "customer": "Sr. Juan Pérez",
    "dateTime": "2025-12-03 at 20:00",
    "guestCount": 4,
    "status": "confirmed"
  }
}
```

## Configuración de Vapi

### Configuración de Herramienta de Función (Verificar Disponibilidad)

En tu panel de Vapi, configura la herramienta de función:

**URL del Servidor:**
```
https://tu-url-ngrok.ngrok-free.app/webhooks/check-availability
```

**Esquema de Función:**
```json
{
  "name": "checkAvailabilityALAKRAN",
  "description": "Verifica la disponibilidad del restaurante para una fecha y número de comensales específicos",
  "parameters": {
    "type": "object",
    "properties": {
      "date": {
        "description": "La fecha de la reserva en formato AAAA-MM-DD. Ejemplo: 2025-12-03",
        "type": "string"
      },
      "people": {
        "description": "Número de personas que asistirán a la reserva",
        "type": "number"
      }
    },
    "required": ["date", "people"]
  }
}
```

### Configuración de Reporte de Fin de Llamada (Reserva Completada)

En la configuración de tu asistente de Vapi, configura los datos estructurados:

**URL del Servidor:**
```
https://tu-url-ngrok.ngrok-free.app/webhooks/reservation-complete
```

**Esquema de Datos Estructurados:**
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

## Estructura del Proyecto

```
alakran/
├── src/
│   ├── index.ts                        # Configuración de Express
│   ├── controllers/
│   │   ├── availabilityController.ts   # Lógica de verificar disponibilidad
│   │   └── reservationController.ts    # Lógica de completar reserva
│   ├── services/
│   │   └── theForkScraper.ts           # Automatización de TheFork con Playwright
│   ├── middleware/
│   │   ├── logger.ts                   # Registro de peticiones/respuestas
│   │   └── validator.ts                # Validación de peticiones y autenticación
│   ├── routes/
│   │   └── webhooks.ts                 # Definiciones de rutas de webhook
│   └── types/
│       └── vapi.ts                     # Tipos TypeScript y esquemas Zod
├── .env.example                        # Plantilla de variables de entorno
├── .gitignore
├── package.json
├── tsconfig.json
├── GUIDE.md                            # Guía detallada de instalación
└── README.md
```

## Seguridad

- El servicio incluye autenticación opcional con secreto de webhook
- Configura `WEBHOOK_SECRET` en tu archivo `.env`
- Vapi necesitará enviar este secreto en el header `X-Webhook-Secret` o como token Bearer

## Registro de Logs

Todas las peticiones y respuestas de webhook se registran en la consola para propósitos de depuración. Revisa los logs para verificar:
- Formato de datos de webhook entrantes
- Resultados de validación
- Respuestas de la API de TheFork

## Despliegue en Producción

Para despliegue en producción:

1. Compilar el código TypeScript:
```bash
npm run build
```

2. Configurar variables de entorno de producción

3. Desplegar en tu plataforma de hosting preferida (AWS, Heroku, Railway, etc.)

4. Actualizar las URLs de webhook en Vapi para apuntar a tu dominio de producción

5. Asegurar que tu servidor sea accesible desde los servidores de Vapi

## Documentación

- [GUIDE.md](GUIDE.md) - Guía detallada paso a paso para principiantes

## Licencia

MIT
