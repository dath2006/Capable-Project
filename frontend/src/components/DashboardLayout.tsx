import {
  BrainCircuit,
  FileText,
  LogOut,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAccessToken } from "../lib/auth";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  {
    to: "/flashcards",
    label: "Flashcards",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    to: "/papers",
    label: "Question Papers",
    icon: <FileText className="h-4 w-4" />,
  },
  { to: "/quiz", label: "Quiz", icon: <BrainCircuit className="h-4 w-4" /> },
  {
    to: "/rag",
    label: "RAG Workspace",
    icon: <Waypoints className="h-4 w-4" />,
  },
];

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAccessToken();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#f9f5ec,_#f4f7fb_45%,_#eef2f8)] text-[var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)]/80 bg-[var(--surface)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => navigate("/flashcards")}
              className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
            >
              Capable Studio
            </button>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
