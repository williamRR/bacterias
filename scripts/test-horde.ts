#!/usr/bin/env tsx

// Test simple de Stable Horde API

const API_KEY = 'gTeJMUzahIKkILoDsiHNQw';
const API_BASE = 'https://stablehorde.net/api/v2';

async function test() {
  console.log('🧪 Testeando Stable Horde API...\n');

  // 1. Enviar solicitud
  const requestBody = {
    prompt: 'a simple red circle on white background',
    params: {
      sampler_name: 'k_euler_a',
      cfg_scale: 7,
      width: 512,
      height: 512,
      steps: 20,
      karras: true,
      post_processing: []
    },
    models: ['Deliberate_V3'],
    nsfw: false,
    censor_nsfw: false,
    r2: true
  };

  console.log('📤 Enviando solicitud...');
  const submitResponse = await fetch(`${API_BASE}/generate/async`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY
    },
    body: JSON.stringify(requestBody)
  });

  const submitData = await submitResponse.json();
  console.log('Respuesta:', JSON.stringify(submitData, null, 2));

  if (!submitData.id) {
    console.error('❌ Error: No se recibió ID');
    return;
  }

  const requestId = submitData.id;
  console.log(`\n✅ Request ID: ${requestId}`);
  console.log('⏳ Esperando que se genere...\n');

  // 2. Poll con logs visibles
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3s

    const checkResponse = await fetch(`${API_BASE}/generate/check/${requestId}`);
    const checkData = await checkResponse.json();

    attempts++;

    console.log(`[${attempts}/${maxAttempts}]`);
    console.log('  Campos:', Object.keys(checkData).join(', '));
    console.log('  Status:', checkData.processing || checkData.queue || checkData.done || 'unknown');
    console.log('  Data:', JSON.stringify(checkData).substring(0, 200) + '...');

    if (checkData.done || checkData.generations?.[0]) {
      console.log('\n✅ Generación completada!');
      console.log('Resultado:', JSON.stringify(checkData, null, 2));
      break;
    } else {
      const pos = checkData.queue_position ?? 0;
      const wait = checkData.wait_time ?? 0;
      console.log(`   Cola: ${pos} | Espera: ~${wait}s`);
    }

    if (attempts >= maxAttempts) {
      console.log('\n⏱️ Tiempo límite alcanzado');
      console.log('Última respuesta:', JSON.stringify(checkData, null, 2));
    }
  }
}

test().catch(console.error);
