import React, { useState, useRef } from "react";
import { Staff } from "../types";
import { X, Upload, Star, User, Briefcase, Phone, MapPin, Languages, Award, CheckCircle2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "../lib/utils";
import { WILAYAS } from "../constants";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import { useTranslation } from "../hooks/useTranslation";

const STAFF_TYPES = [
  { name: "Hôtesse (F)", icon: "👗" },
  { name: "Hôte (M)", icon: "🤵" },
  { name: "Agent de Sécurité", icon: "🔒" },
  { name: "Animateur/Animatrice", icon: "🎭" },
  { name: "Photographe/Vidéaste", icon: "📸" },
  { name: "Technicien", icon: "🔧" },
  { name: "DJ / Sonorisation", icon: "🎵" },
  { name: "Serveur/Serveuse", icon: "🍽️" },
  { name: "Décorateur", icon: "🎨" },
  { name: "Chauffeur", icon: "🚗" },
  { name: "Coordinateur terrain", icon: "📋" },
  { name: "Autre", icon: "➕" }
];

const LANGUAGES = ["Arabe", "Français", "Anglais", "Tamazight", "Autre"];

const getSpecializationsForType = (type: string) => {
  if (type.includes("Hôtesse") || type.includes("Hôte")) {
    return [
      "Accueil & Orientation", 
      "Badging", 
      "Remise de cadeaux", 
      "Assistance VIP", 
      "Animation", 
      "Interprétariat", 
      "Coordination",
      "Placement en salle",
      "Gestion vestiaire",
      "Passage micro",
      "Service boisson",
      "Animation stand",
      "Distribution flyers",
      "Saisie de données"
    ];
  }
  if (type.includes("Sécurité")) {
    return ["Contrôle d'accès", "Surveillance", "Gestion des foules", "Sécurité VIP", "Intervention d'urgence"];
  }
  if (type.includes("Animateur")) {
    return ["Animation scène", "Jeux & Quiz", "Cérémonie", "Animation enfants", "Présentation"];
  }
  if (type.includes("Photographe")) {
    return ["Photo événementielle", "Vidéo & Montage", "Drone", "Live streaming", "Portrait"];
  }
  if (type.includes("Technicien")) {
    return ["Sonorisation", "Éclairage", "Scène & Décor", "Informatique", "Électricité"];
  }
  return [];
};

interface StaffModalProps {
  onClose: () => void;
  onSave: (staff: Staff) => void;
  initialData?: Staff | null;
}

export default function StaffModal({ onClose, onSave, initialData }: StaffModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Staff>>(initialData || {
    firstName: "",
    lastName: "",
    gender: "Homme",
    staffType: "Hôte (M)",
    phone: "",
    age: 18,
    wilaya: "Alger",
    profilePhotoUrl: "",
    languages: ["Arabe", "Français"],
    experienceYears: 0,
    specializations: [],
    availability: "Disponible",
    rating: 0,
    totalEvents: 0,
    notes: "",
    isActive: true
  });

  const [customSpec, setCustomSpec] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePhotoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    const staff: Staff = {
      id: initialData?.id || uuidv4(),
      firstName: formData.firstName!,
      lastName: formData.lastName!,
      gender: formData.gender!,
      staffType: formData.staffType!,
      phone: formData.phone!,
      age: formData.age,
      wilaya: formData.wilaya,
      profilePhotoUrl: formData.profilePhotoUrl,
      languages: formData.languages,
      experienceYears: formData.experienceYears || 0,
      specializations: formData.specializations,
      availability: formData.availability || "Disponible",
      rating: formData.rating || 0,
      totalEvents: formData.totalEvents || 0,
      notes: formData.notes,
      isActive: formData.isActive ?? true,
      createdAt: initialData?.createdAt || new Date().toISOString()
    };

    onSave(staff);
    onClose();
  };

  const toggleLanguage = (lang: string) => {
    const current = formData.languages || [];
    if (current.includes(lang)) {
      setFormData({ ...formData, languages: current.filter(l => l !== lang) });
    } else {
      setFormData({ ...formData, languages: [...current, lang] });
    }
  };

  const toggleSpec = (spec: string) => {
    const current = formData.specializations || [];
    if (current.includes(spec)) {
      setFormData({ ...formData, specializations: current.filter(s => s !== spec) });
    } else {
      setFormData({ ...formData, specializations: [...current, spec] });
    }
  };

  const addCustomSpec = () => {
    if (customSpec.trim() && !(formData.specializations || []).includes(customSpec.trim())) {
      setFormData({ ...formData, specializations: [...(formData.specializations || []), customSpec.trim()] });
      setCustomSpec("");
    }
  };

  const availableSpecs = getSpecializationsForType(formData.staffType || "");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-visible">
        {/* Header */}
        <div className="p-6 sm:p-8 pb-0 shrink-0">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {initialData ? t("edit_member") : t("new_member")}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {step === 1 ? t("personal_info") : t("professional_profile")}
              </p>
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

          {/* Step Indicator */}
          <div className="flex items-center space-x-4 mb-6 sm:mb-8">
            <div className="flex items-center space-x-2">
              <div className={cn("h-1.5 w-8 sm:w-12 rounded-full transition-all duration-500", step >= 1 ? 'bg-primary' : 'bg-gray-100')}></div>
              <div className={cn("h-1.5 w-8 sm:w-12 rounded-full transition-all duration-500", step >= 2 ? 'bg-primary' : 'bg-gray-100')}></div>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest">{t("step")} {step} / 2</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex-1 overflow-y-auto custom-scrollbar">
            {step === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-6 animate-in slide-in-from-right-4 duration-300">
                {/* Photo Upload */}
                <div className="md:col-span-4 flex flex-col items-center justify-center space-y-4">
                  <div 
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-neutral-50 border-2 border-dashed border-neutral-200 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-neutral-100 hover:border-primary/30 transition-all relative group shadow-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formData.profilePhotoUrl ? (
                      <>
                        <img src={formData.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-neutral-400">
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t("photo")}</span>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">
                    {t("photo_requirements")}
                  </p>
                </div>

                {/* Personal Details */}
                <div className="md:col-span-8 space-y-6">
                  <h3 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    {t("personal_details")}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("first_name")} *</Label>
                      <Input
                        type="text"
                        required
                        placeholder="Prénom"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("last_name")} *</Label>
                      <Input
                        type="text"
                        required
                        placeholder="Nom"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("staff_type")} *</Label>
                      <Select
                        required
                        value={formData.staffType}
                        onChange={(e) => {
                          const newType = e.target.value;
                          const newGender = newType.includes("(F)") ? "Femme" : newType.includes("(M)") ? "Homme" : formData.gender;
                          setFormData({ ...formData, staffType: newType, gender: newGender, specializations: [] });
                        }}
                      >
                        {STAFF_TYPES.map(t => <option key={t.name} value={t.name}>{t.icon} {t.name}</option>)}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("gender")} *</Label>
                      <div className="flex bg-neutral-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: "Homme" })}
                          className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-full transition-all",
                            formData.gender === "Homme" ? "bg-white text-primary shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                          )}
                        >
                          {t("male")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: "Femme" })}
                          className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-full transition-all",
                            formData.gender === "Femme" ? "bg-white text-primary shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                          )}
                        >
                          {t("female")}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("phone")} *</Label>
                      <div className="relative">
                        <Input
                          type="tel"
                          required
                          className="pl-10"
                          placeholder="05XX XX XX XX"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("wilaya")}</Label>
                      <div className="relative">
                        <Select
                          value={formData.wilaya}
                          className="pl-10"
                          onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                        >
                          {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                        </Select>
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("age")}</Label>
                    <div className="flex items-center space-x-4">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          min="18"
                          max="50"
                          className="pl-10"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      </div>
                      <div className="bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 flex items-center">
                        <span className="text-xs font-bold text-primary">
                          {formData.age} ans
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in slide-in-from-right-4 duration-300">
                {/* Professional Profile */}
                <div className="space-y-6">
                  <h3 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2 flex items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {t("experience_availability")}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("experience_years")}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.experienceYears}
                        onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("availability")}</Label>
                      <Select
                        value={formData.availability}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                      >
                        <option value="Disponible">{t("available")}</option>
                        <option value="Occupé">{t("busy")}</option>
                        <option value="Indisponible">{t("unavailable")}</option>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="flex items-center">
                      <Languages className="w-4 h-4 mr-2 text-primary" />
                      {t("languages_spoken")}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                            (formData.languages || []).includes(lang)
                              ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                              : "bg-white text-neutral-600 border-neutral-200 hover:border-primary/30"
                          )}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="flex items-center">
                      <Award className="w-4 h-4 mr-2 text-primary" />
                      {t("initial_rating")}
                    </Label>
                    <div className="flex items-center space-x-2 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star className={cn("w-8 h-8", (formData.rating || 0) >= star ? "fill-yellow-400 text-yellow-400" : "text-neutral-200")} />
                        </button>
                      ))}
                      <span className="ml-4 text-sm font-black text-neutral-400">{formData.rating || 0} / 5</span>
                    </div>
                  </div>
                </div>

                {/* Specializations & Notes */}
                <div className="space-y-6">
                  <h3 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2 flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    {t("specializations_notes")}
                  </h3>

                  <div className="space-y-4">
                    <Label>{t("specializations")}</Label>
                    {availableSpecs.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {availableSpecs.map(spec => (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => toggleSpec(spec)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border uppercase tracking-tight",
                              (formData.specializations || []).includes(spec)
                                ? "bg-primary text-white border-primary shadow-sm"
                                : "bg-white text-neutral-500 border-neutral-200 hover:border-primary/20"
                            )}
                          >
                            {spec}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        value={customSpec}
                        onChange={(e) => setCustomSpec(e.target.value)}
                        placeholder={t("custom_spec_placeholder")}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomSpec();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={addCustomSpec}
                        className="shrink-0"
                      >
                        {t("add")}
                      </Button>
                    </div>
                    {/* Custom specs display */}
                    <div className="flex flex-wrap gap-2">
                      {(formData.specializations || []).filter(s => !availableSpecs.includes(s)).map(spec => (
                        <span key={spec} className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center uppercase tracking-tight">
                          {spec}
                          <button type="button" onClick={() => toggleSpec(spec)} className="ml-2 text-blue-400 hover:text-primary">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("internal_notes")}</Label>
                    <Textarea
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={t("internal_notes_placeholder")}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 sm:p-8 bg-neutral-50/30 border-t border-neutral-100 flex justify-between items-center shrink-0 mt-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={step === 1 ? onClose : () => setStep(1)}
              className="font-bold text-neutral-500 uppercase tracking-widest text-[10px] sm:text-xs"
            >
              {step === 1 ? t("cancel") : t("back")}
            </Button>
            <div className="flex space-x-3">
              <Button
                type={step === 2 ? "submit" : "button"}
                onClick={step === 1 ? () => setStep(2) : undefined}
                variant="primary"
                className="px-6 sm:px-8 shadow-lg shadow-primary/20 font-bold uppercase tracking-widest text-[10px] sm:text-xs"
              >
                {step === 1 ? t("next") : t("save")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
