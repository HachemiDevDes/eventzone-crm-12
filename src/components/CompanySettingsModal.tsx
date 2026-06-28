import React, { useState } from "react";
import { CompanySettings } from "../types";
import { X, Save, Upload, Building2, CreditCard, MapPin, Phone, Mail } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: CompanySettings;
  onSave: (settings: CompanySettings) => void;
}

export default function CompanySettingsModal({ isOpen, onClose, settings, onSave }: CompanySettingsModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CompanySettings>(settings || {
    name: "",
    address: "",
    phone: "",
    email: "",
    rc: "",
    nif: "",
    nis: "",
    art: "",
    rib: "",
    bankName: "",
    logoUrl: ""
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-neutral-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t("company_settings")}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{t("manage_company_info")}</p>
          </div>
          <Button 
            variant="ghost"
            size="icon"
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all h-8 w-8 sm:h-10 sm:w-10"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
          <form id="company-settings-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Logo Upload */}
            <div className="flex flex-col items-center justify-center space-y-4 p-8 border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50 hover:bg-neutral-50 hover:border-primary/30 transition-all group">
              {formData.logoUrl ? (
                <div className="relative group/logo">
                  <img src={formData.logoUrl} alt="Company Logo" className="h-24 sm:h-32 object-contain drop-shadow-md" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logoUrl: "" })}
                    className="absolute -top-3 -right-3 bg-white text-red-500 rounded-full p-2 shadow-lg border border-red-50 hover:bg-red-50 transition-all opacity-0 group-hover/logo:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-neutral-100 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8 text-neutral-400" />
                  </div>
                  <div className="mt-4 flex flex-col items-center">
                    <label
                      htmlFor="logo-upload"
                      className="relative cursor-pointer rounded-xl bg-primary px-6 py-2 text-xs font-black text-white uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      <span>{t("upload_logo")}</span>
                      <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-3">{t("logo_requirements")}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h3 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2 flex items-center">
                <Building2 className="w-4 h-4 mr-2" />
                {t("general_information")}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t("company_name")} *</Label>
                  <div className="relative">
                    <Input
                      required
                      type="text"
                      className="pl-10"
                      placeholder="Nom de l'entreprise"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("email")} *</Label>
                  <div className="relative">
                    <Input
                      required
                      type="email"
                      className="pl-10"
                      placeholder="contact@entreprise.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("phone")} *</Label>
                  <div className="relative">
                    <Input
                      required
                      type="tel"
                      className="pl-10"
                      placeholder="05XX XX XX XX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>{t("address")} *</Label>
                  <div className="relative">
                    <Input
                      required
                      type="text"
                      className="pl-10"
                      placeholder="Adresse complète"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                {t("legal_banking_info")}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t("rc_label")}</Label>
                  <Input
                    type="text"
                    placeholder="Registre de Commerce"
                    value={formData.rc || ""}
                    onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("nif_label")}</Label>
                  <Input
                    type="text"
                    placeholder="Numéro d'Identification Fiscale"
                    value={formData.nif || ""}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("nis_label")}</Label>
                  <Input
                    type="text"
                    placeholder="Numéro d'Identification Statistique"
                    value={formData.nis || ""}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("art_label")}</Label>
                  <Input
                    type="text"
                    placeholder="Article d'Imposition"
                    value={formData.art || ""}
                    onChange={(e) => setFormData({ ...formData, art: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("bank_name")}</Label>
                  <Input
                    type="text"
                    placeholder="Nom de la banque"
                    value={formData.bankName || ""}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("rib_label")}</Label>
                  <Input
                    type="text"
                    placeholder="RIB"
                    value={formData.rib || ""}
                    onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 sm:p-8 bg-neutral-50/30 border-t border-neutral-100 flex justify-between items-center shrink-0 mt-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="font-bold text-neutral-500 uppercase tracking-widest text-[10px] sm:text-xs"
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="company-settings-form"
            variant="primary"
            className="px-6 sm:px-8 shadow-lg shadow-primary/20 font-bold uppercase tracking-widest text-[10px] sm:text-xs"
          >
            <Save className="w-4 h-4 mr-2" />
            {t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
