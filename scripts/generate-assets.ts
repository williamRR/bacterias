#!/usr/bin/env tsx

/**
 * Generador de Assets para "Misión Espacial: S.O.S. Galaxia"
 *
 * Este script genera todas las imágenes necesarias para el juego usando Stable Horde
 * (https://stablehorde.net) - 100% GRATUITO e ilimitado (comunidad-powered).
 *
 * USO:
 *   npm run generate-assets              # Generar todos los assets
 *   npm run generate-assets -- --type cards # Generar solo cartas
 *   npm run generate-assets -- --type icons # Generar solo iconos
 *
 * CONFIGURACIÓN:
 *   Ya está configurada tu API key: gTeJMUzahIKkILoDsiHNQw
 *
 * MÁS INFO:
 *   - Web: https://stablehorde.net
 *   - Docs: https://stablehorde.net/api
 *   - Free tier: ILIMITADO (basado en kudos de comunidad)
 */

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURACIÓN - STABLE HORDE
// ============================================================================

const API_KEY = 'gTeJMUzahIKkILoDsiHNQw';
const API_BASE = 'https://stablehorde.net/api/v2';

const OUTPUT_DIR = path.join(__dirname, '../public/assets');

interface GenerationConfig {
  type: 'card' | 'icon' | 'background';
  name: string;
  prompt: string;
  negativePrompt?: string;
  style?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '3:4';
  count?: number;
}

// ============================================================================
// PROMPTS - Descripciones de las imágenes a generar
// ============================================================================

const CARD_BACKGROUNDS: GenerationConfig[] = [
  {
    type: 'card',
    name: 'system',
    prompt: 'cyberpunk spaceship system card background, holographic blue, circuit board patterns, glowing edges, futuristic UI, game card art, 4k, clean design',
    negativePrompt: 'text, letters, blurry, noise, watermark',
    aspectRatio: '3:4',
    count: 1
  },
  {
    type: 'card',
    name: 'sabotage',
    prompt: 'cyberpunk sabotage card background, holographic red, glitch effect, corruption patterns, danger warning aesthetics, futuristic UI, game card art, 4k',
    negativePrompt: 'text, letters, blurry, noise',
    aspectRatio: '3:4',
    count: 1
  },
  {
    type: 'card',
    name: 'medicine',
    prompt: 'cyberpunk medicine repair card background, holographic green, medical cross patterns, healing energy glow, futuristic UI, game card art, 4k',
    negativePrompt: 'text, letters, blurry, noise',
    aspectRatio: '3:4',
    count: 1
  },
  {
    type: 'card',
    name: 'action',
    prompt: 'cyberpunk action card background, holographic purple, lightning energy patterns, futuristic UI, game card art, 4k, dynamic composition',
    negativePrompt: 'text, letters, blurry, noise',
    aspectRatio: '3:4',
    count: 1
  },
  {
    type: 'card',
    name: 'multicolor',
    prompt: 'cyberpunk wild card background, rainbow holographic, spectrum gradient, prismatic refraction, futuristic UI, game card art, 4k',
    negativePrompt: 'text, letters, blurry, noise',
    aspectRatio: '3:4',
    count: 1
  }
];

const SYSTEM_ICONS: GenerationConfig[] = [
  {
    type: 'icon',
    name: 'motor-red',
    prompt: 'futuristic engine motor icon, red glowing, mechanical gear with flame, power symbol, isolated on transparent background, vector style, game UI icon, 512x512',
    negativePrompt: 'text, letters, complex background, realistic photo',
    aspectRatio: '1:1',
    count: 1
  },
  {
    type: 'icon',
    name: 'oxigeno-blue',
    prompt: 'futuristic oxygen life support icon, blue glowing, air bubbles with breathing mask, wind symbol, isolated on transparent background, vector style, game UI icon, 512x512',
    negativePrompt: 'text, letters, complex background',
    aspectRatio: '1:1',
    count: 1
  },
  {
    type: 'icon',
    name: 'navegacion-green',
    prompt: 'futuristic navigation compass icon, green glowing, radar screen with trajectory, coordinate grid, isolated on transparent background, vector style, game UI icon, 512x512',
    negativePrompt: 'text, letters, complex background',
    aspectRatio: '1:1',
    count: 1
  },
  {
    type: 'icon',
    name: 'escudos-yellow',
    prompt: 'futuristic energy shield icon, yellow glowing, hexagonal shield pattern, force field effect, isolated on transparent background, vector style, game UI icon, 512x512',
    negativePrompt: 'text, letters, complex background',
    aspectRatio: '1:1',
    count: 1
  },
  {
    type: 'icon',
    name: 'multicolor',
    prompt: 'futuristic operating system AI icon, rainbow holographic, CPU chip with rainbow circuit, digital brain, isolated on transparent background, vector style, game UI icon, 512x512',
    negativePrompt: 'text, letters, complex background',
    aspectRatio: '1:1',
    count: 1
  }
];

const BACKGROUNDS: GenerationConfig[] = [
  {
    type: 'background',
    name: 'main-menu',
    prompt: 'deep space view from spaceship cockpit window, nebula with purple and blue colors, distant stars, Earth visible, cinematic, 4k, photorealistic, subtle lighting',
    negativePrompt: 'text, UI, overlay, bright lights that distract',
    aspectRatio: '16:9',
    count: 1
  },
  {
    type: 'background',
    name: 'game-board',
    prompt: 'spaceship interior bridge dashboard view through window, starfield, subtle control panels on edges, dark moody lighting, sci-fi interior, 4k, cinematic',
    negativePrompt: 'text, UI elements, bright colors',
    aspectRatio: '16:9',
    count: 1
  },
  {
    type: 'background',
    name: 'victory',
    prompt: 'epic space scene with Earth and stars, celebration fireworks in space, golden warm lighting, triumphant atmosphere, 4k, cinematic, inspiring',
    negativePrompt: 'text, UI, dark moody',
    aspectRatio: '16:9',
    count: 1
  }
];

// ============================================================================
// FUNCIÓN PRINCIPAL DE GENERACIÓN - STABLE HORDE
// ============================================================================

interface HordeRequest {
  prompt: string;
  params: {
    sampler_name: string;
    cfg_scale: number;
    width: number;
    height: number;
    steps: number;
    karras: boolean;
    post_processing: string[];
  };
  models: string[];
  nsfw: boolean;
  censor_nsfw: boolean;
  r2: boolean;
}

interface HordeResponse {
  id: string;
  message?: string;
}

interface HordeCheckResponse {
  finished: number;
  processing: number;
  restarted: number;
  waiting: number;
  done: boolean;
  faulted: boolean;
  wait_time: number;
  queue_position: number;
  kudos: number;
  is_possible: boolean;
  generations?: Array<{ img: string }>;
}

async function generateImage(config: GenerationConfig): Promise<Buffer> {
  // Determinar tamaño según aspect ratio (deben ser múltiplos de 64)
  // 16:9 = 832x448, 9:16 = 448x832, 3:4 = 512x704, 1:1 = 512x512
  const dimensions = config.aspectRatio === '1:1' ? [512, 512] :
                     config.aspectRatio === '16:9' ? [832, 448] :
                     config.aspectRatio === '9:16' ? [448, 832] :
                     config.aspectRatio === '3:4' ? [512, 704] : [512, 512];

  const [width, height] = dimensions;

  // Elegir modelo según el tipo de asset
  const model = config.type === 'icon'
    ? ['Deliberate_V3']  // Mejor para iconos/clean
    : ['vladmandic/sdxl_cyberpunk', 'Deliberate_V3'];  // Cyberpunk para cartas/fondos

  const requestBody: HordeRequest = {
    prompt: config.prompt,
    params: {
      sampler_name: 'k_euler_a',
      cfg_scale: 7,
      width,
      height,
      steps: 30,
      karras: true,
      post_processing: ['GFPGAN']  // Mejora la calidad facial
    },
    models: model,
    nsfw: false,
    censor_nsfw: false,
    r2: true  // Usar almacenamiento R2 para URLs
  };

  console.log(`   📤 Enviando a Stable Horde...`);

  // 1. Enviar solicitud de generación
  const submitResponse = await fetch(`${API_BASE}/generate/async`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY
    },
    body: JSON.stringify(requestBody)
  });

  const submitData: HordeResponse = await submitResponse.json();

  if (!submitData.id) {
    throw new Error(`Error enviando solicitud: ${JSON.stringify(submitData)}`);
  }

  const requestId = submitData.id;
  console.log(`   🎟️  Request ID: ${requestId}`);

  // 2. Poll hasta que esté listo
  let attempts = 0;
  const maxAttempts = 600; // 20 minutos máximo (600 * 2s)

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2s

    const checkResponse = await fetch(`${API_BASE}/generate/check/${requestId}`);
    const checkData: HordeCheckResponse = await checkResponse.json();

    attempts++;

    if (checkData.done) {
      console.log(`   ✅ Generación completada (${attempts * 2}s)`);
      break;
    } else if (checkData.faulted) {
      throw new Error(`Generación fallida para ${config.name}`);
    } else if (attempts > 10 && !checkData.is_possible) {
      // Después de 20 segundos, si aún no es posible, tirar error
      throw new Error(`Generación expirada para ${config.name}: no hay workers disponibles`);
    } else {
      const pos = checkData.queue_position;
      const wait = checkData.wait_time;
      const state = checkData.processing > 0 ? 'Procesando' :
                    checkData.waiting > 0 ? 'En cola' :
                    checkData.finished > 0 ? 'Finalizando' : 'Esperando';
      console.log(`   ⏳ ${state}... (pos: ${pos}, espera: ~${wait}s, intento: ${attempts}/${maxAttempts})`);
    }
  }

  // 3. Obtener el resultado
  const resultResponse = await fetch(`${API_BASE}/generate/check/${requestId}`);
  const resultData: HordeCheckResponse = await resultResponse.json();

  if (!resultData.generations || !resultData.generations[0]) {
    throw new Error(`No se recibió imagen para ${config.name}`);
  }

  const imageUrl = resultData.generations[0].img;
  console.log(`   📥 Descargando imagen...`);

  // 4. Descargar la imagen
  const imageResponse = await fetch(imageUrl);
  const arrayBuffer = await imageResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return buffer;
}

async function saveAsset(config: GenerationConfig, index: number = 0): Promise<string> {
  console.log(`🎨 Generando: ${config.name}...`);

  try {
    const imageBuffer = await generateImage(config);

    const subDir = config.type === 'card' ? 'cards' :
                   config.type === 'icon' ? 'icons' : 'backgrounds';

    const dir = path.join(OUTPUT_DIR, subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filename = `${config.name}${index > 0 ? `-${index}` : ''}.png`;
    const filepath = path.join(dir, filename);

    fs.writeFileSync(filepath, imageBuffer);
    console.log(`✅ Guardado: ${filepath}`);

    return filepath;
  } catch (error) {
    console.error(`❌ Error generando ${config.name}:`, error);
    throw error;
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const typeFilter = args.find(arg => arg.startsWith('--type='))?.split('=')[1];

  console.log('🚀 Iniciando generación de assets para "Misión Espacial: S.O.S. Galaxia"\n');

  let totalGenerated = 0;

  // Generar fondos de cartas
  if (!typeFilter || typeFilter === 'cards') {
    console.log('\n📦 Generando fondos de cartas...');
    for (const config of CARD_BACKGROUNDS) {
      await saveAsset(config);
      totalGenerated++;
      // Delay para no exceder rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Generar iconos
  if (!typeFilter || typeFilter === 'icons') {
    console.log('\n🎯 Generando iconos de sistemas...');
    for (const config of SYSTEM_ICONS) {
      await saveAsset(config);
      totalGenerated++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Generar fondos
  if (!typeFilter || typeFilter === 'backgrounds') {
    console.log('\n🖼️  Generando fondos de pantalla...');
    for (const config of BACKGROUNDS) {
      await saveAsset(config);
      totalGenerated++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n✨ Generación completada! ${totalGenerated} assets creados.`);
  console.log(`📁 Ubicación: ${OUTPUT_DIR}`);
}

// ============================================================================
// EJECUCIÓN
// ============================================================================

main().catch(console.error);
