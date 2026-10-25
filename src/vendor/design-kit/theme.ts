export type ThemeScheme = "dark" | "light";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        colorScheme?: string;
        onEvent?: (event: string, cb: () => void) => void;
      };
    };
  }
}

export function detectScheme(): ThemeScheme {
  const app = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
  if (app?.colorScheme === "light") return "light";
  if (app?.colorScheme === "dark") return "dark";
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

/** Apply Telegram / system color scheme to document root (data-tg-theme). */
export function applyTelegramTheme(root: HTMLElement = document.documentElement): ThemeScheme {
  const scheme = detectScheme();
  root.setAttribute("data-tg-theme", scheme);
  const app = window.Telegram?.WebApp;
  if (app?.onEvent) {
    app.onEvent("themeChanged", () => {
      root.setAttribute("data-tg-theme", detectScheme());
    });
  }
  return scheme;
}
