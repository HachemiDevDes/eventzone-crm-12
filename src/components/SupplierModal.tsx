import React, { useState } from "react";
import { Supplier } from "../types";
import { X, Building2, User, Mail, Phone, MapPin, Globe, Tag, Star, Save, CheckCircle2, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import { cn } from "../lib/utils";
import { useTranslation } from "../hooks/useTranslation";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
  initialData?: Supplier | null;
  categories: { name: string; icon: string; color: string }[];
  wilayas: string[];
  contractStatuses: string[];
}

export default function SupplierModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  wilayas,
  contractStatuses
}: SupplierModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Supplier>>(
    initialData || {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      wilaya: "",
      website: "",
      category: categories[0]?.name || "",
      servicesProvided: [],
      rating: 0,
      isPreferred: false,
      isActive: true,
      contractStatus: "Aucun"
    }
  );

  const [newService, setNewService] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    onSave({
      ...formData,
      id: initialData?.id || uuidv4(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      totalOrders: initialData?.totalOrders || 0,
      totalSpent: initialData?.totalSpent || 0,
    } as Supplier);
    onClose();
  };

  const addService = () => {
    if (newService.trim() && !formData.servicesProvided?.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        servicesProvided: [...(prev.servicesProvided || []), newService.trim()]
      }));
      setNewService("");
    }
  };

  const removeService = (serviceToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      servicesProvided: prev.servicesProvided?.filter(s => s !== serviceToRemove)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-visible shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {initialData ? t("editSupplier") || "Modifier le fournisseur" : t("newSupplier") || "Nouveau fournisseur"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 1 ? "Informations Entreprise & Services" : "Contact & Localisation"}
            </p>
          </div>
          <Button 
            variant="ghost"
            size="icon"
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex items-center space-x-4 mb-8">
          <div className="flex items-center space-x-2">
            <div className={cn("h-1.5 w-12 rounded-full transition-all duration-500", step >= 1 ? 'bg-primary' : 'bg-gray-100')}></div>
            <div className={cn("h-1.5 w-12 rounded-full transition-all duration-500", step >= 2 ? 'bg-primary' : 'bg-gray-100')}></div>
          </div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Étape {step} / 2</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-4">
          <form id="supplier-form" onSubmit={handleSubmit} className="space-y-8 pb-4">
            {step === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">Informations Entreprise</h3>
                  
                  <div>
                    <Label>Nom de l'entreprise *</Label>
                    <Input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Ex: Tech Solutions"
                    />
                  </div>

                  <div>
                    <Label>Catégorie *</Label>
                    <Select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label>Statut du contrat</Label>
                    <Select
                      value={formData.contractStatus}
                      onChange={(e) => setFormData({ ...formData, contractStatus: e.target.value })}
                    >
                      {contractStatuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">Services proposés</h3>
                  
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Select
                        value={newService}
                        onChange={(e) => setNewService(e.target.value)}
                        className="flex-1"
                      >
                        <option value="">Sélectionner un service...</option>
                        {categories.map((cat) => (
                          <option key={cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </Select>
                      <Button
                        type="button"
                        onClick={addService}
                        variant="secondary"
                        className="px-4 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 p-4 bg-neutral-50 rounded-xl border border-neutral-100 min-h-[100px]">
                      {formData.servicesProvided?.map((service, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 rounded bg-white text-neutral-600 border border-neutral-200 text-[10px] font-bold uppercase tracking-wider">
                          {service}
                          <button
                            type="button"
                            onClick={() => removeService(service)}
                            className="ml-2 text-neutral-400 hover:text-danger transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {(!formData.servicesProvided || formData.servicesProvided.length === 0) && (
                        <p className="text-xs text-neutral-400 italic m-auto">Aucun service ajouté</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">Contact</h3>
                  
                  <div>
                    <Label>Nom du contact</Label>
                    <Input
                      type="text"
                      value={formData.contactName || ""}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="Ex: Jean Dupont"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Téléphone</Label>
                      <Input
                        type="tel"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0555..."
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Site web</Label>
                    <Input
                      type="url"
                      value={formData.website || ""}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-4">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        formData.isActive ? "bg-primary border-primary" : "border-neutral-200 group-hover:border-primary/50"
                      )} onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
                        {formData.isActive && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Actif</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        formData.isPreferred ? "bg-amber-500 border-amber-500" : "border-neutral-200 group-hover:border-amber-500/50"
                      )} onClick={() => setFormData({ ...formData, isPreferred: !formData.isPreferred })}>
                        {formData.isPreferred && <Star className="w-3.5 h-3.5 text-white fill-white" />}
                      </div>
                      <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Préféré</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">Localisation</h3>
                  
                  <div>
                    <Label>Wilaya</Label>
                    <Select
                      value={formData.wilaya || ""}
                      onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                    >
                      <option value="">Sélectionner...</option>
                      {wilayas.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label>Adresse</Label>
                    <Textarea
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={4}
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex justify-between items-center pt-8 border-t border-gray-100 mt-auto">
          {step === 2 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(1)}
              className="px-6 py-2 text-gray-500 hover:bg-gray-50"
            >
              {t("back")}
            </Button>
          )}
          <div className="flex space-x-3 ml-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="px-6 py-2 text-gray-500 hover:bg-gray-50"
            >
              {t("cancel")}
            </Button>
            <Button
              form="supplier-form"
              type="submit"
              variant="primary"
              size="md"
              className="px-8 shadow-lg shadow-primary/20"
            >
              {step === 1 ? t("next") : (initialData ? t("save") : t("createSupplier") || "Créer le fournisseur")}
            </Button>
          </div>
        </div>
      </div>
    </div>

  );
}
