import React, { useState, useRef } from "react";
import { Bell, User, Database, Upload, Download, Trash2, Check, FileSpreadsheet } from "lucide-react";
import { useStore } from "../store/StoreContext";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Button } from "../components/ui/Button";
import { useTranslation } from "../hooks/useTranslation";

type SettingsTab = "profile" | "notifications" | "data";

export default function Settings() {
  const { t } = useTranslation();
  const { 
    currentUser, 
    updateCurrentUser, 
    data, 
    markNotificationAsRead, 
    clearNotifications,
    uploadFile 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCurrentUser(formData);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      if (url) {
        await updateCurrentUser({ avatar: url });
        toast.success("Photo de profil mise à jour");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `eventzone_data_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success("Données exportées avec succès (JSON)");
  };

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Prospects
      const leadsWS = XLSX.utils.json_to_sheet(data.leads);
      XLSX.utils.book_append_sheet(wb, leadsWS, t("leads") || "Prospects");

      // Clients
      const clientsWS = XLSX.utils.json_to_sheet(data.clients.map(({ documents, ...c }) => c));
      XLSX.utils.book_append_sheet(wb, clientsWS, "Clients");

      // Offers
      const offersWS = XLSX.utils.json_to_sheet(data.offers);
      XLSX.utils.book_append_sheet(wb, offersWS, "Offres");

      // Tasks
      const tasksWS = XLSX.utils.json_to_sheet(data.tasks);
      XLSX.utils.book_append_sheet(wb, tasksWS, "Tâches");

      // Events
      const eventsWS = XLSX.utils.json_to_sheet(data.events);
      XLSX.utils.book_append_sheet(wb, eventsWS, "Événements");

      XLSX.writeFile(wb, `eventzone_data_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Données exportées avec succès (Excel)");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Erreur lors de l'export Excel");
    }
  };

  const clearCache = () => {
    localStorage.removeItem("eventzone_user");
    localStorage.removeItem("eventzone_theme");
    toast.success("Cache vidé. Rechargement...");
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm md:text-base text-neutral-600 mt-1 md:mt-2">Gérez vos préférences et paramètres de compte.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4">
          {/* Sidebar */}
          <div className="border-r border-gray-200 bg-gray-50 p-4 space-y-2">
            <button 
              onClick={() => setActiveTab("profile")}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-2.5 rounded-full font-medium transition-all",
                activeTab === "profile" 
                  ? "bg-white text-primary shadow-sm border border-gray-200" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <User className="w-5 h-5" />
              <span>Profil</span>
            </button>
            <button 
              onClick={() => setActiveTab("notifications")}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-2.5 rounded-full font-medium transition-all",
                activeTab === "notifications" 
                  ? "bg-white text-primary shadow-sm border border-gray-200" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </button>
            <button 
              onClick={() => setActiveTab("data")}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-2.5 rounded-full font-medium transition-all",
                activeTab === "data" 
                  ? "bg-white text-primary shadow-sm border border-gray-200" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Database className="w-5 h-5" />
              <span>Données</span>
            </button>
          </div>

          {/* Content */}
          <div className="col-span-3 p-8">
            {activeTab === "profile" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations du profil</h2>
                  
                  <div className="flex items-center space-x-6 mb-8">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-3xl font-bold overflow-hidden border-4 border-white shadow-md">
                        {currentUser?.avatar ? (
                          <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                        ) : (
                          currentUser?.name.charAt(0)
                        )}
                      </div>
                      <button 
                        onClick={handleAvatarClick}
                        disabled={isUploading}
                        className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{currentUser?.name}</h3>
                      <p className="text-sm text-neutral-600">{currentUser?.role}</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label>
                          Nom complet
                        </Label>
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Email
                        </Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                      >
                        Enregistrer les modifications
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Centre de Notifications</h2>
                  <button 
                    onClick={clearNotifications}
                    className="text-sm text-neutral-600 hover:text-red-500 transition-colors"
                  >
                    Tout effacer
                  </button>
                </div>

                <div className="space-y-3">
                  {data.notifications.length > 0 ? (
                    data.notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className={cn(
                          "p-4 rounded-xl border transition-all flex items-start space-x-4",
                          notif.read 
                            ? "bg-white border-gray-100" 
                            : "bg-primary/10 border-primary/20"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg",
                          notif.read ? "bg-gray-100" : "bg-primary/10"
                        )}>
                          <Bell className={cn("w-5 h-5", notif.read ? "text-neutral-500" : "text-primary")} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className={cn("font-medium", notif.read ? "text-gray-700" : "text-gray-900")}>
                              {notif.title}
                            </h3>
                            {!notif.read && (
                              <button 
                                onClick={() => markNotificationAsRead(notif.id)}
                                className="p-1 text-primary hover:bg-primary/10 rounded-full"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-neutral-600 mt-1">{notif.message}</p>
                          <span className="text-[10px] text-neutral-500 mt-2 block">
                            {new Date(notif.createdAt).toLocaleString('fr-DZ')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-neutral-600">Aucune notification pour le moment.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Gestion des Données</h2>
                
                <div className="space-y-4">
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                          <Download className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Exporter les données</h3>
                          <p className="text-sm text-neutral-600">Téléchargez une sauvegarde complète de vos données au format JSON.</p>
                        </div>
                      </div>
                      <button 
                        onClick={exportData}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Exporter
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <FileSpreadsheet className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Exporter vers Excel</h3>
                          <p className="text-sm text-neutral-600">Téléchargez vos données sous forme de fichier Excel multi-feuilles.</p>
                        </div>
                      </div>
                      <button 
                        onClick={exportToExcel}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Exporter Excel
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-red-50/50 rounded-2xl border border-red-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-red-100 rounded-xl">
                          <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-red-900">Vider le cache</h3>
                          <p className="text-sm text-red-700/70">Supprime les données locales et déconnecte la session actuelle.</p>
                        </div>
                      </div>
                      <button 
                        onClick={clearCache}
                        className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-full text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        Vider
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
