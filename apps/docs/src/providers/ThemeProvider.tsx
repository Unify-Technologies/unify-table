import { createContext, useContext, useCallback, useSyncExternalStore, type ReactNode } from "react";

interface ThemeContextValue {
  dark: boolean;
  setDark: (fn: boolean | ((prev: boolean) => boolean)) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  dark: true,
  setDark: () => {},
});

// Keep theme state outside React so DOM class is always in sync
let _dark = true;
let _listeners: Array<() => void> = [];
function _notify() { for (const l of _listeners) l(); }

function getDark() { return _dark; }
function subscribe(cb: () => void) {
  _listeners.push(cb);
  return () => { _listeners = _listeners.filter((l) => l !== cb); };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const dark = useSyncExternalStore(subscribe, getDark, () => true);

  const setDark = useCallback((fn: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof fn === "function" ? fn(_dark) : fn;
    if (next === _dark) return;
    _dark = next;
    // Update DOM synchronously before React re-renders children
    document.documentElement.classList.toggle("dark", next);
    _notify();
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Initialize DOM class on load
if (typeof document !== "undefined") {
  document.documentElement.classList.toggle("dark", _dark);
}

export function useTheme() {
  return useContext(ThemeContext);
}
