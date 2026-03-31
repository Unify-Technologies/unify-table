import { useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useRoute } from "../router";
import { useTheme } from "../providers/ThemeProvider";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { MobileDrawer } from "./MobileDrawer";
import { TableOfContents } from "./TableOfContents";

export function Shell({ children }: { children: React.ReactNode }) {
  const { path } = useRoute();
  const { dark } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isDemo = path === "/demo";
  const borderColor = dark ? "var(--color-dark-border)" : "var(--color-border)";
  const handleColor = dark ? "var(--color-dark-text-muted)" : "var(--color-text-muted)";
  const handleHoverBg = dark ? "var(--color-dark-surface-hover)" : "var(--color-surface-hover)";

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopNav />

      {/* Mobile hamburger - shown below TopNav on small screens */}
      {!isDemo && (
        <div
          className="flex items-center px-4 h-10 border-b lg:hidden flex-shrink-0"
          style={{
            borderColor,
            backgroundColor: dark ? "var(--color-dark-surface)" : "var(--color-surface)",
          }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 text-[13px] cursor-pointer"
            style={{
              color: dark ? "var(--color-dark-text-secondary)" : "var(--color-text-secondary)",
            }}
          >
            <Menu size={16} />
            Menu
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — collapsible on desktop, hidden on mobile */}
        <div
          className="hidden lg:block flex-shrink-0 overflow-y-auto overflow-x-hidden"
          style={{
            width: sidebarOpen ? 256 : 0,
            transition: "width 0.2s ease",
            borderRight: sidebarOpen ? `1px solid ${borderColor}` : "none",
          }}
        >
          <div className="w-64">
            <Sidebar />
          </div>
        </div>

        {/* Sidebar toggle handle — sits just outside the sidebar edge */}
        <div className="hidden lg:flex items-start flex-shrink-0" style={{ paddingTop: 12 }}>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex items-center justify-center w-6 h-6 rounded cursor-pointer"
            style={{ color: handleColor }}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = handleHoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
          </button>
        </div>

        {/* Content */}
        {isDemo ? (
          <div className="flex-1 min-h-0 min-w-0">{children}</div>
        ) : (
          <>
            <main
              id="doc-content"
              className="flex-1 overflow-y-auto py-8"
              style={{ '--sidebar-offset': `${(sidebarOpen ? 256 : 0) + 24}px` } as React.CSSProperties}
            >
              <div className="doc-content-inner max-w-[900px] mx-auto px-6 lg:px-12">{children}</div>
            </main>

            {/* Table of Contents - hidden on smaller screens */}
            <div
              className="hidden xl:block w-52 flex-shrink-0 overflow-y-auto"
              style={{ borderLeft: `1px solid ${borderColor}` }}
            >
              <TableOfContents />
            </div>
          </>
        )}
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
