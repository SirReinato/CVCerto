/**
 * Utilitário para abrir janelas laterais controladas (Docked Mini-Browser).
 * Cria uma janela popup otimizada alinhada à direita da tela,
 * preservando a sessão de cookies do usuário (ex: login ativo na Gupy, LinkedIn, Catho).
 */

export interface SideBrowserOptions {
  width?: number;
  title?: string;
}

/**
 * Valida que uma URL utiliza exclusivamente os protocolos seguros http: ou https:.
 */
export function isSafeHttpUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function openSideBrowser(url: string, title: string = "Portal de Vagas"): Window | null {
  void title;
  if (!url) return null;

  const trimmed = url.trim();
  const hasExplicitScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed);

  if (hasExplicitScheme && !isSafeHttpUrl(trimmed)) {
    return null;
  }

  const targetUrl = hasExplicitScheme ? trimmed : `https://${trimmed}`;
  if (!isSafeHttpUrl(targetUrl)) {
    return null;
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
