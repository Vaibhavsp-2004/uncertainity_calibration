import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ServiceStatus } from "@/components/features/ServiceStatus";

export const Navbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/dataset", label: "Dataset Manager" },
    { path: "/database", label: "Database Explorer" },
    { path: "/search", label: "Search Console" },
    { path: "/ingest", label: "Upload Video" },
    { path: "/live", label: "Live Stream" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-accent/20 bg-ink-soft/75 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.06)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-16">
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.4)]">
            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          </div>
          <span className="text-lg font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent via-paper to-purple">
            RE-ID SYSTEM
          </span>
        </Link>
        <nav className="hidden md:flex space-x-6 text-xs uppercase tracking-widest font-semibold items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`transition-colors py-1 border-b-2 ${
                  isActive
                    ? "text-accent border-accent drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]"
                    : "text-accent/60 border-transparent hover:text-accent hover:border-accent/40"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pl-3 border-l border-accent/30">
            <ServiceStatus />
          </div>
        </nav>
        {/* Mobile menu link toggle */}
        <div className="md:hidden flex items-center gap-3">
          <ServiceStatus />
          <Link
            to="/search"
            className="btn-primary text-[10px] py-1 px-2.5"
          >
            Search
          </Link>
        </div>
      </div>
      {/* Mobile nav bar row */}
      <div className="md:hidden flex overflow-x-auto gap-3 px-4 py-2 border-t border-ink-line text-[11px] uppercase tracking-wider bg-ink/90">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`whitespace-nowrap px-2 py-1 rounded ${
              location.pathname === item.path ? "bg-accent/20 text-accent font-bold" : "text-paper/60"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
};
