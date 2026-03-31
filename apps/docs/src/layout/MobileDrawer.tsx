import { useEffect } from "react";
import { X } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";
import { Sidebar } from "./Sidebar";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const { dark } = useTheme();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop — covers everything */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: dark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className="relative w-72 max-w-[80vw] h-full flex flex-col shadow-2xl"
        style={{
          backgroundColor: dark ? "var(--color-dark-surface)" : "var(--color-surface)",
        }}
      >
        <div className="flex items-center justify-between px-4 h-14 flex-shrink-0">
          <span
            className="font-semibold text-sm"
            style={{ color: dark ? "var(--color-dark-text)" : "var(--color-text)" }}
          >
            Navigation
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center cursor-pointer"
            style={{
              color: dark ? "var(--color-dark-text-secondary)" : "var(--color-text-secondary)",
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto" onClick={onClose}>
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
