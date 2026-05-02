import { createContext, useContext, useEffect, useState } from "react";

type Theme = "blue" | "black";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "blue",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("blue");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("pp-theme")) as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("blue", "black", "light", "dark");
    root.classList.add(theme);
    localStorage.setItem("pp-theme", theme);

    // Update PWA Meta Tags
    const themeColor = theme === "black" ? "#000000" : "#0f172a";
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", themeColor);

    let metaApple = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (metaApple) {
      metaApple.setAttribute("content", theme === "black" ? "black" : "black-translucent");
    }
  }, [theme]);

  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme((t) => (t === "blue" ? "black" : "blue")) }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);