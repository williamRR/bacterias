# Guía de Despliegue - S.O.S. Galaxia

Esta guía explica cómo desplegar la aplicación en producción usando **Vercel** (frontend) y **Railway** (backend Socket.IO).

---

## Arquitectura de Despliegue

```
┌─────────────────┐         ┌─────────────────┐
│   Vercel        │────────▶│   Railway       │
│   (Frontend)    │  WS     │   (Backend)     │
│   Next.js 14    │         │   Socket.IO     │
└─────────────────┘         └─────────────────┘
```

- **Frontend**: Vercel (Next.js static export)
- **Backend**: Railway (Node.js + Socket.IO con WebSockets)

---

## Paso 1: Preparar el Repositorio

### 1.1 Crear el repositorio en GitHub

```bash
git init
git add .
git commit -m "Initial commit: S.O.S. Galaxia game"
git branch -M main
git remote add origin https://github.com/tu-usuario/bacterias.git
git push -u origin main
```

---

## Paso 2: Desplegar Backend en Railway

### 2.1 Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app/)
2. Regístrate con tu cuenta de GitHub
3. Autoriza Railway a acceder a tus repositorios

### 2.2 Crear nuevo proyecto en Railway

1. Click en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Selecciona tu repositorio `bacterias`
4. Railway detectará automáticamente que es un proyecto Node.js

### 2.3 Configurar el proyecto

Railway creará automáticamente:
- Un contenedor con tu servidor Socket.IO
- Una URL pública como: `https://bacterias-production.up.railway.app`

### 2.4 Configurar variables de entorno

En el panel de Railway, ve a **"Variables"** y agrega:

```bash
NODE_ENV=production
PORT=3012
HOSTNAME=0.0.0.0
```

**Importante**: No necesitas configurar `NEXT_PUBLIC_SOCKET_SERVER_URL` en Railway (eso es para Vercel).

### 2.5 Obtener la URL del backend

Una vez desplegado, Railway te mostrará una URL pública como:
```
https://bacterias-production.up.railway.app
```

**Copia esta URL**, la necesitarás para el siguiente paso.

---

## Paso 3: Desplegar Frontend en Vercel

### 3.1 Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com/)
2. Regístrate con tu cuenta de GitHub
3. Autoriza Vercel a acceder a tus repositorios

### 3.2 Importar proyecto en Vercel

1. Click en **"Add New..."** → **"Project"**
2. Selecciona tu repositorio `bacterias` de GitHub
3. Vercel detectará automáticamente que es un proyecto Next.js

### 3.3 Configurar variables de entorno en Vercel

Antes de hacer deploy, configura las variables de entorno:

1. En la página de configuración del proyecto, busca la sección **"Environment Variables"**
2. Agrega la siguiente variable:

```bash
NEXT_PUBLIC_SOCKET_SERVER_URL=https://bacterias-production.up.railway.app
```

**Reemplaza** la URL con la que te dio Railway.

### 3.4 Hacer deploy

1. Click en **"Deploy"**
2. Espera a que termine el build
3. Vercel te dará una URL como: `https://bacterias.vercel.app`

---

## Paso 4: Verificar el Despliegue

### 4.1 Verificar el backend

Visita el health check de Railway:
```
https://bacterias-production.up.railway.app/api/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-06T12:00:00.000Z"
}
```

### 4.2 Verificar el frontend

1. Visita tu URL de Vercel
2. Crea una sala
3. Abre otra pestaña y únete a la sala con el código
4. Verifica que ambos clientes se conecten y puedan jugar

---

## Actualizaciones Futuras

### Actualizar el Backend

Cada vez que hagas push a `main`:
- Railway detectará los cambios automáticamente
- Hará redeploy del servidor
- La URL se mantiene igual

### Actualizar el Frontend

Cada vez que hagas push a `main`:
- Vercel detectará los cambios automáticamente
- Hará rebuild y redeploy
- La URL se mantiene igual

---

## Configuración Local para Desarrollo

Para seguir desarrollando localmente mientras tienes el backend en Railway:

```bash
# Copia el archivo de ejemplo
cp .env.example .env.local

# Edita .env.local con la URL de Railway
NEXT_PUBLIC_SOCKET_SERVER_URL=https://bacterias-production-up.railway.app
```

Ahora cuando ejecutes `npm run dev`, tu frontend local se conectará al backend en Railway.

---

## Solución de Problemas

### Error: "Failed to fetch" o "Connection refused"

**Problema**: El frontend no puede conectarse al backend.

**Solución**:
1. Verifica que la variable `NEXT_PUBLIC_SOCKET_SERVER_URL` esté correcta en Vercel
2. Verifica que el backend esté corriendo en Railway (revisa los logs)
3. Asegúrate de que no haya firewalls bloqueando las conexiones WebSocket

### Error: "CORS policy"

**Problema**: Socket.IO bloqueado por CORS.

**Solución**: Agrega esto a tu `server.ts`:

```typescript
const io = new ServerIO(httpServer, {
  addTrailingSlash: false,
  cors: {
    origin: [
      'http://localhost:3000',
      'https://bacterias.vercel.app',
      process.env.VERCEL_URL
    ].filter(Boolean) as string[],
    credentials: true
  }
});
```

### Error: "Room not found"

**Problema**: Los clientes no están en la misma instancia del servidor.

**Solución**: Asegúrate de que ambos clientes se conecten al mismo backend. Verifica la URL del servidor en ambos clientes.

---

## Costos Estimados

### Railway
- **Free tier**: $5 USD/mes de crédito
- **Después**: ~$5-10 USD/mes para un servidor pequeño
- Escala automáticamente según la demanda

### Vercel
- **Hobby**: Gratis (con límites)
- **Pro**: $20 USD/mes
- Para este juego, el plan Hobby es suficiente

---

## Proxys Alternativos (Opcional)

Si prefieres no usar Railway, puedes considerar:

- **Fly.io**: Similar a Railway, también soporta WebSockets
- **Render.com**: Plan gratuito con WebSockets
- **Heroku**: No soporta WebSockets en el plan gratuito
- **DigitalOcean App Platform**: Soporta WebSockets

---

## Próximos Pasos

Una vez desplegado:

1. **Configurar dominio custom**: Conecta tu propio dominio en Vercel
2. **Monitoreo**: Configura alertas en Railway para cuando el servidor caiga
3. **Analytics**: Agrega Vercel Analytics o Google Analytics
4. **Testing**: Invita a amigos a probar el juego
5. **Mejoras**: Considera agregar persistencia con Redis para Railway
