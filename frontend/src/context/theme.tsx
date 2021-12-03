import React, { createContext, useContext, useState } from "react";

enum Theme {
  Dark = "dark",
  Light = "light",
  Default = "default",
}

const themes: Theme[] = [Theme.Dark, Theme.Light, Theme.Default];

export type ThemeContextType = {
  theme: Theme;
  themes: Theme[];
  handleSetTheme: (theme: Theme) => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  themes,
  theme: Theme.Default,
  handleSetTheme: (theme: Theme) => null,
});

export const ThemeProvider: React.FC = ({ children }) => {
  const [theme, setTheme] = useState(Theme.Dark);

  const state: ThemeContextType = {
    theme,
    themes,
    handleSetTheme: setTheme,
  };

  return (
    <ThemeContext.Provider value={state}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  return useContext(ThemeContext);
};
