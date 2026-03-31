import { createContext, useContext, useCallback, useSyncExternalStore, type ReactNode } from "react";

interface RouteContext {
  path: string;
  navigate: (to: string) => void;
}

const RouterCtx = createContext<RouteContext>({ path: "/", navigate: () => {} });

function getHashPath() {
  const hash = window.location.hash.slice(1);
  return hash || "/";
}

function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

export function Router({ children }: { children: ReactNode }) {
  const path = useSyncExternalStore(subscribe, getHashPath, () => "/");
  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);
  return <RouterCtx.Provider value={{ path, navigate }}>{children}</RouterCtx.Provider>;
}

export function useRoute() {
  return useContext(RouterCtx);
}

export function Link({
  to,
  children,
  className,
  style,
  onClick,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const { navigate } = useRoute();
  return (
    <a
      href={`#${to}`}
      className={className}
      style={style}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
        onClick?.();
        const el = document.getElementById("doc-content");
        if (el) el.scrollTop = 0;
        else window.scrollTo(0, 0);
      }}
    >
      {children}
    </a>
  );
}

export function Route({ path, component: Component }: { path: string; component: React.ComponentType }) {
  const { path: current } = useRoute();
  if (matchPath(path, current)) return <Component />;
  return null;
}

function matchPath(pattern: string, path: string): boolean {
  if (pattern === path) return true;
  // Support /plugins/:name style patterns
  const patternParts = pattern.split("/");
  const pathParts = path.split("/");
  if (patternParts.length !== pathParts.length) return false;
  return patternParts.every((part, i) => part.startsWith(":") || part === pathParts[i]);
}

export function useParams(): Record<string, string> {
  const { path } = useRoute();
  return { path };
}
