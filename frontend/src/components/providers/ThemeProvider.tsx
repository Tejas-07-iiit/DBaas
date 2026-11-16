"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import { tokenStorage } from "@/lib/auth/tokenStorage";

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const checkAuth = () => {
      const hasToken = !!tokenStorage.getAccessToken();
      setIsLoggedIn(hasToken);
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("dbaas_auth_change", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("dbaas_auth_change", checkAuth);
    };
  }, []);

  return (
    <NextThemesProvider
      attribute={["class", "data-theme"]}
      defaultTheme="dark"
      enableSystem={false}
      forcedTheme={mounted && !isLoggedIn ? "dark" : undefined}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  return useNextTheme();
}
