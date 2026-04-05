import { Link, useLocation } from "wouter";
import { LayoutDashboard, BarChart2, Wallet, BookOpen, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Habits", icon: LayoutDashboard },
  { href: "/insights", label: "Insights", icon: BarChart2 },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/health", label: "Health", icon: Heart },
  { href: "/notes", label: "Notes", icon: BookOpen },
];

export const TAB_ORDER = NAV_ITEMS.map((n) => n.href);

interface BottomNavProps {
  bouncing?: string | null;
}

export function BottomNav({ bouncing }: BottomNavProps) {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-area-inset-bottom" style={{ background: "rgba(248,248,253,0.85)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", boxShadow: "0 -4px 20px rgba(0,0,0,0.04)", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="flex items-stretch max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = location === href;
          const isBouncing = bouncing === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all duration-200 relative",
                isActive ? "text-primary" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400",
                isBouncing && "animate-bounce"
              )}
              aria-label={label}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
              <span className={cn("text-[10px] font-medium leading-none", isActive ? "text-primary" : "text-gray-400")}>
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
