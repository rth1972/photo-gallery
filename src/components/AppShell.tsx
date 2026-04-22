"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Images, Folder, Heart, Archive, MapPin, Trash2,
  Settings, LogOut, Sun, Moon, Upload, Menu, X,
  Search, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import clsx from "clsx";

// ─── Google Photos pinwheel logo ──────────────────────────────────────────────
export function PixelBoxLogo({ size = 28 }: { size?: number }) {
  return (
    <Image src="/icon.png" width={size} height={size} alt="icon" />
    
    
  );
}

const NAV = [
  { href: "/photos",    label: "Photos",    Icon: Images  },
  { href: "/albums",    label: "Albums",    Icon: Folder  },
  { href: "/favorites", label: "Favorites", Icon: Heart   },
  { href: "/archive",   label: "Archive",   Icon: Archive },
  { href: "/map",       label: "Map",       Icon: MapPin  },
  { href: "/trash",     label: "Trash",     Icon: Trash2  },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  collapsed,
  onUpload,
}: {
  collapsed: boolean;
  onUpload?: () => void;
}) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <aside
      className={clsx(
        "hidden md:flex flex-col h-screen sticky top-0 flex-shrink-0 overflow-y-auto",
        "bg-[--background] border-r border-[--border] transition-all duration-200",
        collapsed ? "w-[72px]" : "w-56"
      )}
    >
      {/* Wordmark */}
      <div className={clsx("flex items-center gap-2.5 h-16 px-4 flex-shrink-0", collapsed && "justify-center px-0")}>
        <PixelBoxLogo size={30} />
        {!collapsed && <span className="font-medium text-[15px] tracking-tight">PixelBox</span>}
      </div>

      {/* Upload */}
      {onUpload && (
        <div className={clsx("px-3 mb-3", collapsed && "flex justify-center px-0")}>
          <button
            onClick={onUpload}
            className={clsx(
              "flex items-center gap-2.5 rounded-full font-medium text-sm transition-colors",
              "bg-[--surfaceHover] hover:bg-[--border]",
              collapsed ? "w-10 h-10 justify-center" : "w-full px-4 py-2"
            )}
            title={collapsed ? "Upload" : undefined}
          >
            <Upload className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Upload</span>}
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={clsx(
                "flex items-center gap-3 rounded-full text-sm transition-colors",
                collapsed ? "w-10 h-10 justify-center mx-auto" : "px-3 py-2",
                active
                  ? "bg-[--surfaceHover] font-medium"
                  : "text-[--text-secondary] hover:bg-[--surfaceHover]/60 hover:text-[--text-primary]"
              )}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom utilities */}
      <div className="px-2 pb-4 space-y-0.5">
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title={collapsed ? "Toggle theme" : undefined}
          className={clsx(
            "flex items-center gap-3 rounded-full text-sm w-full transition-colors",
            "text-[--text-secondary] hover:bg-[--surfaceHover]/60 hover:text-[--text-primary]",
            collapsed ? "w-10 h-10 justify-center mx-auto" : "px-3 py-2"
          )}
        >
          {theme === "light"
            ? <Moon className="w-[18px] h-[18px] flex-shrink-0" />
            : <Sun  className="w-[18px] h-[18px] flex-shrink-0" />}
          {!collapsed && <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>}
        </button>

        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={clsx(
            "flex items-center gap-3 rounded-full text-sm transition-colors",
            "text-[--text-secondary] hover:bg-[--surfaceHover]/60 hover:text-[--text-primary]",
            collapsed ? "w-10 h-10 justify-center mx-auto" : "px-3 py-2"
          )}
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* Avatar with hover menu */}
        {session && (
          <div 
            className={clsx("relative pt-1", collapsed && "flex justify-center")}
          >
            <button
              className={clsx(
                "w-8 h-8 rounded-full bg-[--accent] text-white text-sm font-medium",
                "flex items-center justify-center",
                collapsed && "mx-auto"
              )}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {session.user?.name?.charAt(0).toUpperCase() ?? "U"}
            </button>
            <div 
              className={clsx(
                "absolute bottom-full left-0 z-50 w-52 bg-[--surface] rounded-2xl shadow-2xl border border-[--border] py-1 overflow-hidden transition-all duration-150",
                showUserMenu ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <div className="px-3 py-2.5 border-b border-[--border]">
                <p className="text-sm font-medium truncate">{session.user?.name}</p>
                <p className="text-xs text-[--text-secondary] truncate">{session.user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[--surfaceHover] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Top header ───────────────────────────────────────────────────────────────
function Header({
  collapsed,
  onToggleSidebar,
  title,
  subtitle,
  actions,
  onUpload,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onUpload?: () => void;
}) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="flex-shrink-0 flex items-center h-16 px-4 gap-3 border-b border-[--border] bg-[--background] z-30">
      <button
        onClick={onToggleSidebar}
        className="hidden md:flex w-9 h-9 items-center justify-center rounded-full hover:bg-[--surfaceHover] transition-colors flex-shrink-0"
      >
        <Menu className="w-[18px] h-[18px]" />
      </button>

      {title && (
        <div className="min-w-0">
          <h1 className="text-xl font-medium truncate leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-[--text-secondary] leading-tight">{subtitle}</p>}
        </div>
      )}

      {actions && <div className="flex-1 flex items-center">{actions}</div>}
      {!actions && <div className="flex-1" />}

      {/* Right side */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Mobile upload */}
        {onUpload && (
          <button
            onClick={onUpload}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-[--accent] text-white"
          >
            <Upload className="w-4 h-4" />
          </button>
)}
        {/* Avatar */}
        {session && (
          <div className="relative">
            <button 
              className="w-8 h-8 rounded-full bg-[--accent] text-white text-sm font-medium flex items-center justify-center ml-1"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {session.user?.name?.charAt(0).toUpperCase() ?? "U"}
            </button>
            <div 
              className={clsx(
                "absolute right-0 top-full z-50 w-52 bg-[--surface] rounded-2xl shadow-2xl border border-[--border] py-1 transition-all duration-150",
                showUserMenu ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <div className="px-3 py-2.5 border-b border-[--border]">
                <p className="text-sm font-medium truncate">{session.user?.name}</p>
                <p className="text-xs text-[--text-secondary] truncate">{session.user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[--surfaceHover] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Mobile bottom nav ─────────────────────────────────────────────────────────
function MobileBottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/photos",    label: "Photos",    Icon: Images  },
    { href: "/albums",    label: "Albums",    Icon: Folder  },
    { href: "/favorites", label: "Favs",      Icon: Heart   },
    { href: "/map",       label: "Map",       Icon: MapPin  },
    { href: "/settings",  label: "More",      Icon: Settings},
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[--surface] !text-black border-t border-[--border] flex items-center justify-around px-1 py-1">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href} className={clsx("flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors !text-black", active ? "text-[--accent]" : "text-[--text-secondary]")}>
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── AppShell (exported) ──────────────────────────────────────────────────────
// Wrap any authenticated page in this to get the sidebar + header layout.
export function AppShell({
  title,
  subtitle,
  headerActions,
  onUpload,
  children,
  scrollable = true,
  noPadding = false,
}: {
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  onUpload?: () => void;
  children: React.ReactNode;
  scrollable?: boolean;
  noPadding?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[--background]">
      <Sidebar collapsed={collapsed} onUpload={onUpload} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed(v => !v)}
          title={title}
          subtitle={subtitle}
          actions={headerActions}
          onUpload={onUpload}
        />

        {scrollable ? (
          <main className={clsx("flex-1 overflow-y-auto", !noPadding && "px-4 md:px-6 pt-4 pb-28")}>
            {children}
          </main>
        ) : (
          <div className={clsx("flex-1 overflow-hidden", !noPadding && "px-4 md:px-6 pt-4")}>
            {children}
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}
