import React from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Calendar,
  CheckSquare,
  Settings,
  TrendingUp,
  FolderOpen,
  UsersRound,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Share2,
  PenTool,
  PanelLeftClose,
  PanelLeftOpen,
  UserPlus,
  Truck,
  BarChart3,
  Mail
} from "lucide-react";
import { Page } from "../App";
import { cn } from "../lib/utils";
import { useStore } from "../store/StoreContext";
import { useTranslation } from "../hooks/useTranslation";

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ 
  currentPage, 
  setCurrentPage, 
  isCollapsed, 
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}: SidebarProps) {
  const { currentUser, data } = useStore();
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = React.useState(false);

  const effectiveIsCollapsed = isCollapsed && !isHovered;

  const activeTasksCount = (data.tasks || []).filter(task => {
    if (task.completed) return false;
    if (currentUser?.role === "Manager") return true;
    return task.assignedTo === currentUser?.id;
  }).length;

  const navGroups = [
    {
      title: "Overview",
      items: [
        { name: t("dashboard"), page: "Dashboard", icon: LayoutDashboard },
      ]
    },
    {
      title: "Sales & Marketing",
      items: [
        { name: t("leads"), page: "Leads", icon: Users },
        { name: t("clients"), page: "Clients", icon: Briefcase },
        { name: t("financialDocuments"), page: "FinancialDocuments", icon: FileText },
        { name: t("communication") || "Communication", page: "Communication", icon: Mail },
        { name: t("socialMediaHub"), page: "SocialMediaHub", icon: Share2 },
      ]
    },
    {
      title: "Operations",
      items: [
        { name: t("events"), page: "Events", icon: Calendar },
        { name: t("tasks"), page: "Tasks", icon: CheckSquare, badge: activeTasksCount },
        { name: t("documents"), page: "Documents", icon: FolderOpen },
        { name: t("suppliers"), page: "Suppliers", icon: Truck },
      ]
    },
    {
      title: "System",
      items: [
        { name: t("team"), page: "Team", icon: UsersRound },
        { name: t("instructions"), page: "Instructions", icon: HelpCircle },
        { name: t("settings"), page: "Settings", icon: Settings },
      ]
    }
  ];

  let filteredGroups = navGroups.map(group => {
    let items = group.items;
    if (currentUser?.role === "Sales Agent") {
      items = items.filter(item => ["Dashboard", "Leads", "Clients", "FinancialDocuments", "Communication", "Tasks", "Events", "Instructions", "Documents"].includes(item.page));
    } else if (currentUser?.role === "Social Media Manager") {
      items = items.filter(item => ["Dashboard", "Leads", "SocialMediaHub", "Instructions", "Tasks"].includes(item.page));
    } else if (currentUser?.role === "Manager") {
      // Manager sees everything
    }
    return { ...group, items };
  }).filter(group => group.items.length > 0);

  return (
    <>
      <div className={cn(
        "hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )} />
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed z-50 flex flex-col h-full bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out left-0 top-0",
          effectiveIsCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-4 h-16">
          {!effectiveIsCollapsed && (
            <img
              src="https://images2.imgbox.com/02/39/OksF9irW_o.png"
              alt="Eventzone Logo"
              className="h-[18px] w-auto object-contain"
            />
          )}
          {effectiveIsCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">E</div>
            </div>
          )}
          {!effectiveIsCollapsed && (
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors"
            >
              {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          )}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-hide">
          {filteredGroups.map((group, groupIndex) => (
            <div key={group.title} className={cn("mb-6", groupIndex === 0 ? "mt-2" : "")}>
              {!effectiveIsCollapsed && (
                <h3 className="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
              )}
              {effectiveIsCollapsed && groupIndex > 0 && (
                <div className="w-8 h-px bg-neutral-100 mx-auto mb-4 mt-4" />
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.page;
                  return (
                    <button
                      key={item.page}
                      onClick={() => setCurrentPage(item.page as Page)}
                      title={effectiveIsCollapsed ? item.name : ""}
                      className={cn(
                        "w-full flex items-center px-3 py-2 rounded-full transition-all text-sm font-medium group relative",
                        isActive
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-primary",
                        effectiveIsCollapsed ? "justify-center px-0" : "space-x-3"
                      )}
                    >
                      <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-neutral-400 group-hover:text-primary")} />
                      {!effectiveIsCollapsed && <span className="flex-1 text-left">{item.name}</span>}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={cn(
                          "flex items-center justify-center bg-danger text-white text-[10px] font-bold rounded-full",
                          effectiveIsCollapsed ? "absolute top-1 right-1 w-4 h-4" : "px-1.5 py-0.5 min-w-[20px]"
                        )}>
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-neutral-100">
          <div className={cn(
            "flex items-center px-4 py-3",
            effectiveIsCollapsed ? "justify-center px-0" : "space-x-3"
          )}>
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium flex-shrink-0 shadow-sm">
                {currentUser?.name.charAt(0)}
              </div>
            )}
            {!effectiveIsCollapsed && (
              <div className="flex flex-col text-left flex-1 overflow-hidden">
                <span className="text-sm font-medium text-neutral-900 truncate">{currentUser?.name}</span>
                <span className="text-xs text-neutral-500 truncate">{currentUser?.role}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
