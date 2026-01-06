const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

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
      page.waitForURL(/\/room\/[A-Z0-9]{6}/, { timeout: 10000 }),
      page.click('button:has-text("Crear Sala")')
    ]);

    await clickPromise;

    console.log('=== Sala creada exitosamente ===');
    const currentUrl = page.url();
    console.log('URL actual:', currentUrl);

    const roomId = currentUrl.match(/\/room\/([A-Z0-9]{6})/)?.[1];
    if (roomId) {
      console.log('ID de la sala:', roomId);

      // Esperar un poco para que el socket se conecte
      await page.waitForTimeout(3000);

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

      // Verificar si la página muestra "Uniéndose a la sala..." o los jugadores
      const pageContent = await page.content();
      if (pageContent.includes('Uniéndose a la sala')) {
        console.log('\n⚠️ La página sigue mostrando "Uniéndose a la sala..."');
        console.log('Esto sugiere que el socket no se conectó correctamente.');
      } else if (pageContent.includes('Jugadores')) {
        console.log('\n✅ La página muestra la lista de jugadores');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);

    const url = page.url();
    console.log('\n=== URL actual ===');
    console.log(url);
  } finally {
    await browser.close();
  }
})();
