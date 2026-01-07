export function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;
  }

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port || '3012';
  return `${protocol}//${hostname}:${port}`;
}

export function getPlayerName(): string {
  let name = localStorage.getItem('playerName');

  if (!name) {
    name = prompt(`Ingresa tu nombre, explorador espacial:`);
    if (!name) {
      throw new Error('Necesitas identificarte para la misión');
    }
    localStorage.setItem('playerName', name);
  }

  return name;
}

export function getBrowserId(): string {
  let browserId = localStorage.getItem('browserId');

  if (!browserId) {
    browserId = 'browser_' + Math.random().toString(36).substring(2, 15) + Date.now();
    localStorage.setItem('browserId', browserId);
  }

  return browserId;
}
