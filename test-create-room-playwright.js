const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs de consola
  page.on('console', msg => {
    console.log('CONSOLE:', msg.text());
  });

  try {
    console.log('=== Navegando a la página de crear sala ===');
    await page.goto('http://localhost:3002/create-room', { waitUntil: 'networkidle' });

    console.log('=== Ingresando nombre de jugador ===');
    await page.fill('input[placeholder="Ingresa tu nombre"]', 'TestPlayer');

    console.log('=== Haciendo clic en Crear Sala ===');
    const clickPromise = Promise.all([
      page.waitForURL(/\/room\/[A-Z0-9]{6}/),
      page.click('button:has-text("Crear Sala")')
    ]);

    const result = await Promise.race([
      clickPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]);

    console.log('=== Sala creada exitosamente ===');
    const currentUrl = page.url();
    console.log('URL actual:', currentUrl);

    const roomId = currentUrl.match(/\/room\/([A-Z0-9]{6})/)?.[1];
    if (roomId) {
      console.log('ID de la sala:', roomId);

      // Verificar que el socket está conectado
      const socketState = await page.evaluate(() => {
        const socket = window.io;
        return {
          connected: socket?.connected || false,
          id: socket?.id || null,
          rooms: socket ? Object.keys(socket.rooms) : []
        };
      });

      console.log('Estado del socket:', JSON.stringify(socketState, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);

    // Capturar el estado actual de la página para debugging
    const pageContent = await page.content();
    console.log('\n=== Contenido de la página ===');
    console.log(pageContent.substring(0, 500));

    const pageTitle = await page.title();
    console.log('\n=== Título de la página ===');
    console.log(pageTitle);

    const url = page.url();
    console.log('\n=== URL actual ===');
    console.log(url);
  } finally {
    await browser.close();
  }
})();
