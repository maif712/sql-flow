
import React, { createContext, useContext, useEffect, useState } from "react";
import { useThemeMode } from "@/hooks/use-theme-mode";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: "dark" | "light" | "system";
};

type ThemeProviderState = {
  theme: "dark" | "light" | "system";
  setTheme: (theme: "dark" | "light" | "system") => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  ...props
}: ThemeProviderProps) {
  const { mode, setMode } = useThemeMode();

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");
    
    if (mode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      
      root.classList.add(systemTheme);
      return;
    }
    
    root.classList.add(mode);
  }, [mode]);

  const value = {
    theme: mode,
    setTheme: setMode,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
