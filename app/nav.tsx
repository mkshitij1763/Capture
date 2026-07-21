"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Capture", icon: "add_circle" },
  { href: "/review", label: "Review", icon: "visibility" },
  { href: "/lists", label: "Lists", icon: "format_list_bulleted" },
  { href: "/habits", label: "Habits", icon: "cached" },
] as const;

function NavIcon({ name, filled }: { name: string; filled: boolean }) {
  return (
    <span
      className="material-symbols-outlined"
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="material-symbols-outlined" aria-hidden="true">
            spa
          </span>
          <span className="brand-wordmark">Capture</span>
        </div>
        <nav className="sidebar-nav">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "sidebar-link sidebar-link-active" : "sidebar-link"}
              >
                <NavIcon name={link.icon} filled={active} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="bottom-nav" aria-label="Primary">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "bottom-nav-link bottom-nav-link-active" : "bottom-nav-link"}
            >
              <NavIcon name={link.icon} filled={active} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
