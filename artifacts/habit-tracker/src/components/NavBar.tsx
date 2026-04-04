import { Link, useLocation } from "wouter";
import { LayoutDashboard, BookOpen, Settings, BarChart2, Wallet } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

interface NavBarProps {
  onOpenSettings: () => void;
}

export function NavBar({ onOpenSettings }: NavBarProps) {
  const { settings } = useApp();
  const [location] = useLocation();
  const { profile } = settings;

  const initials = profile.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navItems = [
    { href: "/", label: "Habits", icon: LayoutDashboard },
    { href: "/insights", label: "Insights", icon: BarChart2 },
    { href: "/finance", label: "Finance", icon: Wallet },
    { href: "/notes", label: "Notes", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">H</span>
          </div>
          <span className="font-bold text-gray-800 dark:text-gray-100 hidden sm:block">HabitSpace</span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = location === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            data-testid="btn-settings"
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            data-testid="btn-profile"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="Profile & Settings"
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-8 h-8 rounded-xl object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {initials}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
