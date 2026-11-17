/**
 * ClimaTrack Service Worker Registration (CSP-Safe External Module)
 */
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Registro no bloqueante: degradación silenciosa si el contexto no soporta SW
    });
  });
}
