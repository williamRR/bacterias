const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Ir a la sala
  await page.goto('http://192.168.1.93:3001/room/S5D6DF');

  // Esperar a que cargue
  await page.waitForTimeout(3000);

  // Capturar logs de consola
  page.on('console', msg => {
    console.log('CONSOLE:', msg.text());
  });

  // Capturar errores de red
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('HTTP Error:', response.url(), response.status());
    }
  });

  // Inspeccionar el estado de React
  const stateInfo = await page.evaluate(() => {
    const gameState = document.querySelector('[data-game-state]');
    return {
      hasGameState: !!gameState,
      innerHTML: document.body.innerHTML.substring(0, 2000),
      playerCount: document.querySelectorAll('[data-player]').length,
      cardCount: document.querySelectorAll('[data-card]').length,
      hasHand: document.querySelector('[data-hand]') !== null,
    };
  });

  console.log('State Info:', JSON.stringify(stateInfo, null, 2));

  // Ver mensajes de socket
  const socketInfo = await page.evaluate(() => {
    return new Promise((resolve) => {
      const socket = window.io;
      if (socket) {
        resolve({
          connected: socket.connected,
          id: socket.id,
          rooms: Object.keys(socket.rooms)
        });
      } else {
        resolve({ connected: false, message: 'No socket found' });
      }
    });
  });

  console.log('Socket Info:', JSON.stringify(socketInfo, null, 2));

  // Esperar un poco más para ver si hay cambios
  await page.waitForTimeout(5000);

  // Hacer una captura de pantalla
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  console.log('Screenshot saved to debug-screenshot.png');

  await browser.close();
})();