import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, MessageSquare, Compass, FileText, Mic2,
  Map, Linkedin, Bell, User, LogOut, Sparkles, Menu, X
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/chat", icon: MessageSquare, label: "AI Career Chat" },
  { path: "/career-paths", icon: Compass, label: "Career Paths" },
  { path: "/cv-analysis", icon: FileText, label: "CV Analysis" },
  { path: "/interview", icon: Mic2, label: "Interview Sim" },
  { path: "/roadmap", icon: Map, label: "Learning Roadmap" },
  { path: "/linkedin", icon: Linkedin, label: "LinkedIn Review" },
  { path: "/notifications", icon: Bell, label: "Notifications" },
  { path: "/profile", icon: User, label: "My Profile" },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: notifSettings } = trpc.notifications.getSettings.useQuery();
  const { data: allNotifs } = trpc.notifications.getAll.useQuery();
  const unreadCount = allNotifs?.filter(n => !n.isRead).length ?? 0;

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663217691016/k7VpytXHEM35u7EgMMjw5j/logo-icon-3Zk42XAXdJxRFW3U6aUj3p.webp"
            alt="CareerMentor AI Logo"
            className="w-9 h-9 rounded-xl flex-shrink-0 object-cover"
          />
          <div>
            <p className="font-display text-sm font-bold text-sidebar-foreground leading-tight">CareerMentor</p>
            <p className="text-xs text-sidebar-foreground/50">AI for Women in Tech</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;
          const isNotif = path === "/notifications";
          return (
            <Link key={path} href={path} onClick={() => setSidebarOpen(false)}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isNotif && unreadCount > 0 && (
                  <Badge className="bg-rose-500 text-white text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || "User"}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email || ""}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent gap-2"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 animate-fade-in-up">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663217691016/k7VpytXHEM35u7EgMMjw5j/logo-icon-3Zk42XAXdJxRFW3U6aUj3p.webp"
            alt="CareerMentor AI Logo"
            className="w-16 h-16 rounded-2xl object-cover mx-auto"
          />
          <h2 className="text-2xl font-display font-bold text-foreground">Sign in to continue</h2>
          <p className="text-muted-foreground">Access your personalized career mentor</p>
          <Button asChild className="gradient-primary text-white border-0">
            <a href={getLoginUrl()}>Sign In with Manus</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-sidebar flex flex-col shadow-2xl">
            <button
              className="absolute top-4 right-4 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663217691016/k7VpytXHEM35u7EgMMjw5j/logo-icon-3Zk42XAXdJxRFW3U6aUj3p.webp"
              alt="CareerMentor AI Logo"
              className="w-7 h-7 rounded-lg object-cover"
            />
            <span className="font-display font-bold text-sm">CareerMentor AI</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
