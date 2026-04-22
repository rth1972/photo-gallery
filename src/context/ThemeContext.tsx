"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme;
    if (stored) {
      applyTheme(stored);
      setThemeState(stored);
    } else {
      applyTheme("light");
    }
  }, []);

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    let resolved = t;
    
    if (t === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    
    root.setAttribute("data-theme", resolved);
  }

  useEffect(() => {
    if (!theme) return;

    applyTheme(theme);
    localStorage.setItem("theme", theme);

    if (theme === "system") {
      const handler = () => applyTheme("system");
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}