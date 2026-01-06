# Generador de Assets - Misión Espacial: S.O.S. Galaxia

Script para generar automáticamente todas las imágenes del juego usando **Stable Horde** - 100% GRATUITO e ilimitado.

## ¿Qué es Stable Horde?

**Stable Horde** es un servicio de generación de imágenes con IA completamente gratuito y respaldado por la comunidad.

- ✅ **100% GRATIS** - Sin límites de imágenes
- ✅ **Sin tarjeta de crédito** - Registro con OAuth (Discord/Google)
- ✅ **Modelos de calidad** - Stable Diffusion, SDXL, Cyberpunk, etc.
- ✅ **Comunidad-powered** - Workers voluntarios around the world

**Web**: https://stablehorde.net | **API Docs**: https://stablehorde.net/api

## Configuración Inicial

### La API Key ya está configurada

El script ya tiene tu API key configurada: `gTeJMUzahIKkILoDsiHNQw`

No necesitas hacer nada más, solo ejecutar el script.

### (Opcional) Usar tu propia API Key

Si prefieres usar tu propia cuenta:

1. Ve a https://stablehorde.net/register
2. Regístrate con Discord o Google (segundos, sin aprobación)
3. Copia tu API key desde tu perfil
4. Edita `scripts/generate-assets.ts` y cambia la línea:
   ```typescript
   const API_KEY = 'TU_PROPIA_API_KEY';
   ```

## Uso

### Generar TODOS los assets (recomendado)
```bash
npm run generate-assets
```

Esto generará:
- **5 fondos de cartas** (system, sabotage, medicine, action, multicolor)
- **5 iconos de sistemas** (motor, oxígeno, navegación, escudos, multicolor)
- **3 fondos de pantalla** (main-menu, game-board, victory)

### Generar solo un tipo específico
```bash
npm run generate-assets:cards        # Solo fondos de cartas
npm run generate-assets:icons        # Solo iconos de sistemas
npm run generate-assets:backgrounds  # Solo fondos de pantalla
```

## Tiempos de Espera

Las imágenes toman entre **10-60 segundos** cada una (dependiendo de la cola de la comunidad).

Verás un indicador de progreso:
```
🎨 Generando: system...
   📤 Enviando a Stable Horde...
   🎟️  Request ID: abc123...
   ⏳ Esperando... (pos: 5, wait: 15s)
   ✅ Generación completada (24s)
   📥 Descargando imagen...
✅ Guardado: public/assets/cards/system.png
```

## Archivos Generados

```
public/assets/
├── cards/           # Fondos para cartas (5 PNG)
│   ├── system.png
│   ├── sabotage.png
│   ├── medicine.png
│   ├── action.png
│   └── multicolor.png
├── icons/           # Iconos de sistemas (5 PNG)
│   ├── motor-red.png
│   ├── oxigeno-blue.png
│   ├── navegacion-green.png
│   ├── escudos-yellow.png
│   └── multicolor.png
└── backgrounds/     # Fondos de pantalla (3 PNG)
    ├── main-menu.png
    ├── game-board.png
    └── victory.png
```

## Personalización

### Editar los Prompts

Abre `scripts/generate-assets.ts` y busca las constantes:

```typescript
const CARD_BACKGROUNDS: GenerationConfig[] = [
  {
    type: 'card',
    name: 'system',
    prompt: 'cyberpunk spaceship system card background...', // ← Edita esto
    // ...
  }
];
```

### Estilos Alternativos

**Retrò Wave:**
```
'synthwave 80s retro grid, pink and cyan, neon aesthetic, vaporwave, synthwave sun'
```

**Pixel Art:**
```
'pixel art 16-bit style, retro game aesthetic, limited color palette, clean sprites'
```

**Minimalista:**
```
'minimalist flat design, clean simple shapes, solid colors, modern UI, vector style'
```

**Realista:**
```
'photorealistic spaceship interior, cinematic lighting, movie prop, 4k, highly detailed'
```

## Solución de Problemas

### "Queue position no avanza"
- Stable Horde depende de workers volunteers
- Si la cola está larga, intenta otra hora
- También puedes contribuir con workers para tener prioridad

### "Generación fallida"
- El prompt puede ser muy complejo
- Simplifica el prompt o intenta con menos detalles
- Verifica que tu API key sea válida

### "Las imágenes son muy lentas"
- Normal en horas pico (muchos usuarios)
- Usa horarios menos concurridos (madrugada UTC)
- Considera correr tus propios workers para prioridad

## Ventajas de Stable Horde

| Característica | Stable Horde | Otros Servicios |
|---------------|--------------|-----------------|
| **Precio** | 100% GRATIS | $10-50/mes |
| **Límite** | Ilimitado | 50-150/día |
| **Tarjeta** | No requerida | Sí requerida |
| **Calidad** | SDXL, Cyberpunk, etc | Varía |
| **Setup** | Segundos | Días de aprobación |

## Créditos y Links

- **Stable Horde**: https://stablehorde.net
- **Discord**: https://discord.gg/stablehorde
- **GitHub**: https://github.com/Stability-AI/StableHorde
- **Modelos disponibles**: Stable Diffusion, SDXL, Deliberate, Cyberpunk LoRAs, etc.

## Integración en el Juego

Una vez generadas, usa las imágenes así:

```typescript
import systemCard from '/assets/cards/system.png';
import motorIcon from '/assets/icons/motor-red.png';

<Image src={systemCard} alt="Sistema" className="card-background" />
<Image src={motorIcon} alt="Motor" className="system-icon" />
```
