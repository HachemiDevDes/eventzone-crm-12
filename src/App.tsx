import React, { useState, useEffect } from "react";
import { StoreProvider, useStore } from "./store/StoreContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Clients from "./pages/Clients";
import FinancialDocuments from "./pages/FinancialDocuments";
import Events from "./pages/Events";
import Tasks from "./pages/Tasks";
import Settings from "./pages/Settings";
import Documents from "./pages/Documents";
import Team from "./pages/Team";
import Instructions from "./pages/Instructions";
import Login from "./pages/Login";
import SocialMediaHub from "./pages/SocialMediaHub";
import SocialStudio from "./pages/SocialStudio";
import Suppliers from "./pages/Suppliers";
import RecruitmentForm from "./pages/RecruitmentForm";
import Communication from "./pages/Communication";
import { Toaster } from "sonner";
import { Trophy, Phone, Target, Mail } from "lucide-react";

export type Page =
  | "Dashboard"
  | "Leads"
  | "Clients"
  | "FinancialDocuments"
  | "Communication"
  | "Events"
  | "Tasks"
  | "Settings"
  | "Documents"
  | "Team"
  | "Instructions"
  | "SocialMediaHub"
  | "SocialStudio"
  | "Suppliers"
  | "Recruitment";

export default function App() {
  const { currentUser, loading, currentPage, setCurrentPage } = useStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRecruitmentMode, setIsRecruitmentMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("recruitment") === "true") {
      setIsRecruitmentMode(true);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // RBAC Protection
    if (currentUser.role === "Sales Agent") {
      const allowedPages = ["Dashboard", "Leads", "Clients", "FinancialDocuments", "Communication", "Tasks", "Events", "Instructions", "Documents"];
      if (!allowedPages.includes(currentPage)) {
        setCurrentPage("Dashboard");
      }
    } else if (currentUser.role === "Social Media Manager") {
      const allowedPages = ["Dashboard", "Leads", "SocialMediaHub", "SocialStudio", "Instructions", "Tasks"];
      if (!allowedPages.includes(currentPage)) {
        setCurrentPage("Dashboard");
      }
    }
  }, [currentUser, currentPage]);

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-text-secondary font-medium">Chargement du CRM...</p>
        </div>
      </div>
    );
  }

  if (isRecruitmentMode) {
    return (
      <>
        <Toaster 
          position="top-right" 
          richColors 
          theme="light" 
        />
        <RecruitmentForm />
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Toaster position="top-right" richColors theme="light" />
        <Login />
      </>
    );
  }

  const renderPage = () => {
    if (!currentUser) return <Login />;

    switch (currentPage) {
      case "Dashboard":
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case "Leads":
        return <Leads />;
      case "Clients":
        return <Clients />;
      case "FinancialDocuments":
        return <FinancialDocuments />;
      case "Events":
        return <Events />;
      case "Tasks":
        return <Tasks />;
      case "Settings":
        return <Settings />;
      case "Documents":
        return <Documents />;
      case "Team":
        return <Team />;
      case "Instructions":
        return <Instructions />;
      case "SocialMediaHub":
        return <SocialMediaHub />;
      case "SocialStudio":
        return <SocialStudio />;
      case "Suppliers":
        return <Suppliers />;
      case "Communication":
        return <Communication />;
      case "Recruitment":
        return <RecruitmentForm />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <>
      <Toaster 
        position="top-right" 
        richColors 
        theme="light" 
      />
      <div className="flex h-screen bg-background font-sans text-text-primary overflow-hidden">
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={(page) => {
            setCurrentPage(page);
            setIsMobileMenuOpen(false);
          }} 
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
        />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Header 
            setCurrentPage={setCurrentPage} 
            toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {renderPage()}
          </main>
          
          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </div>
      </div>
    </>
  );
}
