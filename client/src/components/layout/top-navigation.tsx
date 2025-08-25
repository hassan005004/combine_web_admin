import { Menu, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

interface TopNavigationProps {
  onMenuClick: () => void;
  title: string;
  subtitle: string;
}

export function TopNavigation({ onMenuClick, title, subtitle }: TopNavigationProps) {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4" data-testid="top-navigation">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
            data-testid="menu-button"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800" data-testid="page-title">{title}</h2>
            <p className="text-slate-500" data-testid="page-subtitle">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative" data-testid="notifications-button">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10" data-testid="user-avatar">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-800" data-testid="user-name">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500" data-testid="user-email">{user?.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="logout-button">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
