/**
 * Utilitário para abrir janelas laterais controladas (Docked Mini-Browser).
 * Cria uma janela popup otimizada alinhada à direita da tela,
 * preservando a sessão de cookies do usuário (ex: login ativo na Gupy, LinkedIn, Catho).
 */

export interface SideBrowserOptions {
  width?: number;
  title?: string;
}

export function openSideBrowser(url: string, _title: string = "Portal de Vagas"): Window | null {
  if (!url) return null;

  let targetUrl = url.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  // Largura ideal de mini-browser (entre 520px e 640px)
  const screenWidth = window.screen.availWidth || window.screen.width || 1366;
  const screenHeight = window.screen.availHeight || window.screen.height || 768;

  const width = Math.min(640, Math.max(480, Math.round(screenWidth * 0.38)));
  const height = screenHeight;
  const left = Math.max(0, screenWidth - width);
  const top = 0;

  const windowFeatures = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "menubar=no",
    "toolbar=no",
    "location=yes",
    "status=no",
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");

  const popup = window.open(targetUrl, `CVCerto_Portal_${Date.now()}`, windowFeatures);
  if (popup) {
    try {
      popup.focus();
    } catch {
      // Ignora erro de foco cross-origin
    }
  }
  return popup;
}
