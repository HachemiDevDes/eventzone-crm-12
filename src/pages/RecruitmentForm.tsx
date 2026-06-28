import React, { useState } from "react";
import { useStore } from "../store/StoreContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Languages, 
  Briefcase, 
  Camera, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Upload,
  X,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
  "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda",
  "Skikda", "Sidi Bel Abbès", "Annabba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara",
  "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt",
  "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane"
];

const LANGUAGES = ["Arabe", "Français", "Anglais", "Espagnol", "Allemand", "Italien"];

export default function RecruitmentForm() {
  const { submitStaffApplication, setCurrentPage } = useStore();
  const [step, setStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "Femme" as "Homme" | "Femme",
    phone: "",
    email: "",
    age: 18,
    wilaya: "Alger",
    height: "",
    weight: "",
    languages: [] as string[],
    experience: "",
    photoUrls: [] as string[],
  });

  const steps = [
    {
      title: "Commençons par faire connaissance",
      description: "Comment vous appelez-vous ?",
      fields: ["firstName", "lastName"],
      icon: <User className="w-6 h-6 text-primary" />,
    },
    {
      title: "Quelques informations personnelles",
      description: "Votre genre et votre âge",
      fields: ["gender", "age"],
      icon: <Calendar className="w-6 h-6 text-primary" />,
    },
    {
      title: "Où pouvons-nous vous joindre ?",
      description: "Vos coordonnées de contact",
      fields: ["phone", "email", "wilaya"],
      icon: <Phone className="w-6 h-6 text-primary" />,
    },
    {
      title: "Un peu plus sur vous",
      description: "Votre taille et votre poids (optionnel)",
      fields: ["height", "weight"],
      icon: <MapPin className="w-6 h-6 text-primary" />,
    },
    {
      title: "Vos compétences linguistiques",
      description: "Quelles langues parlez-vous ?",
      fields: ["languages"],
      icon: <Languages className="w-6 h-6 text-primary" />,
    },
    {
      title: "Votre expérience",
      description: "Parlez-nous de votre parcours",
      fields: ["experience"],
      icon: <Briefcase className="w-6 h-6 text-primary" />,
    },
    {
      title: "Dernière étape : Vos photos",
      description: "Ajoutez quelques photos de vous",
      fields: ["photoUrls"],
      icon: <Camera className="w-6 h-6 text-primary" />,
    },
  ];

  const handleNext = () => {
    // Basic validation
    const currentFields = steps[step].fields;
    const isStepValid = currentFields.every(field => {
      if (field === "languages") return formData.languages.length > 0;
      if (field === "photoUrls") return true; // Optional for now
      if (field === "height" || field === "weight") return true; // Optional
      return (formData as any)[field] !== "";
    });

    if (!isStepValid) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      await submitStaffApplication({
        ...formData,
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
      });
      setIsSubmitted(true);
      toast.success("Candidature envoyée avec succès !");
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'envoi");
    }
  };

  const toggleLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2rem] shadow-xl p-8 sm:p-12 text-center"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4 tracking-tight">Candidature Envoyée !</h1>
          <p className="text-sm sm:text-base text-neutral-600 mb-8 leading-relaxed">
            Merci d'avoir postulé pour rejoindre notre équipe. Nous examinerons votre profil et vous contacterons prochainement.
          </p>
          <button 
            onClick={() => {
              if (window.location.search.includes("recruitment=true")) {
                window.location.href = "/";
              } else {
                setCurrentPage("Dashboard");
              }
            }}
            className="w-full py-4 bg-primary text-white rounded-full font-bold hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center py-8 px-4 sm:p-8">
      <div className="max-w-2xl w-full flex flex-col">
        {/* Logo and Title */}
        <div className="flex flex-col items-center mb-8 text-center">
          <img
            src="https://images2.imgbox.com/02/39/OksF9irW_o.png"
            alt="Eventzone Logo"
            className="h-10 sm:h-12 w-auto object-contain mb-4"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight px-4">
            Eventzone Staff Registration
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 flex justify-between items-center px-2">
          <div className="flex-1 h-2.5 bg-neutral-200 rounded-full overflow-hidden mr-4">
            <motion.div 
              className="h-full bg-primary shadow-[0_0_10px_rgba(43,127,255,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-black text-neutral-400 tabular-nums">
            {step + 1} / {steps.length}
          </span>
        </div>

        <motion.div 
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-8 md:p-12"
        >
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3.5 bg-primary/5 rounded-2xl shrink-0">
              {steps[step].icon}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 leading-tight">{steps[step].title}</h2>
              <p className="text-sm text-neutral-500">{steps[step].description}</p>
            </div>
          </div>

          <div className="space-y-6">
            {step === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700">Prénom</label>
                  <input 
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Ex: Amine"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700">Nom</label>
                  <input 
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Ex: Benali"
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700">Genre</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setFormData({...formData, gender: "Homme"})}
                      className={`p-4 rounded-full border font-bold transition-all ${
                        formData.gender === "Homme" 
                          ? "bg-primary text-white border-primary" 
                          : "bg-neutral-50 text-neutral-600 border-neutral-100 hover:border-primary/30"
                      }`}
                    >
                      Homme
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, gender: "Femme"})}
                      className={`p-4 rounded-full border font-bold transition-all ${
                        formData.gender === "Femme" 
                          ? "bg-primary text-white border-primary" 
                          : "bg-neutral-50 text-neutral-600 border-neutral-100 hover:border-primary/30"
                      }`}
                    >
                      Femme
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700">Âge</label>
                  <div className="flex items-center space-x-4 py-2">
                    <input 
                      type="range"
                      min="18"
                      max="50"
                      value={formData.age}
                      onChange={e => setFormData({...formData, age: parseInt(e.target.value)})}
                      className="flex-1 h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary"
                    />
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-lg shadow-inner">
                      {formData.age}
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    <span>18 ans</span>
                    <span>50 ans</span>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700">Téléphone</label>
                  <input 
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="05XX XX XX XX"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700">Email</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="votre@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700">Wilaya de résidence</label>
                  <select 
                    value={formData.wilaya}
                    onChange={e => setFormData({...formData, wilaya: e.target.value})}
                    className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    {WILAYAS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700">Taille (cm)</label>
                  <input 
                    type="number"
                    inputMode="numeric"
                    value={formData.height}
                    onChange={e => setFormData({...formData, height: e.target.value})}
                    className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Ex: 175"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700">Poids (kg)</label>
                  <input 
                    type="number"
                    inputMode="numeric"
                    value={formData.weight}
                    onChange={e => setFormData({...formData, weight: e.target.value})}
                    className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Ex: 65"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`p-3 rounded-full border text-sm font-bold transition-all ${
                      formData.languages.includes(lang)
                        ? "bg-primary text-white border-primary"
                        : "bg-neutral-50 text-neutral-600 border-neutral-100 hover:border-primary/30"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700">Expérience passée</label>
                <textarea 
                  value={formData.experience}
                  onChange={e => setFormData({...formData, experience: e.target.value})}
                  className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none h-32 resize-none"
                  placeholder="Décrivez vos expériences en tant qu'hôte/hôtesse ou dans l'événementiel..."
                />
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.photoUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group">
                      <img src={url} alt="Profile" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setFormData({...formData, photoUrls: formData.photoUrls.filter((_, i) => i !== index)})}
                        className="absolute top-2 right-2 p-1 bg-danger text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.photoUrls.length < 5 && (
                    <button 
                      onClick={() => {
                        // Mock photo upload
                        const mockUrl = `https://picsum.photos/seed/${Math.random()}/400/600`;
                        setFormData({...formData, photoUrls: [...formData.photoUrls, mockUrl]});
                      }}
                      className="aspect-square rounded-full border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-400 hover:border-primary hover:text-primary transition-all"
                    >
                      <Upload className="w-8 h-8 mb-2" />
                      <span className="text-xs font-bold">Ajouter</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-neutral-400 text-center italic">
                  Veuillez ajouter au moins une photo de portrait et une photo en pied.
                </p>
              </div>
            )}
          </div>

          <div className="mt-10 sm:mt-12 flex flex-row items-center justify-between gap-4">
            <button 
              onClick={handleBack}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-4 rounded-full font-bold transition-all ${
                step === 0 
                  ? "opacity-0 pointer-events-none" 
                  : "text-neutral-400 hover:text-neutral-900 active:scale-95"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Retour</span>
            </button>
            <button 
              onClick={handleNext}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-8 sm:px-12 py-4 bg-primary text-white rounded-full font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              <span>{step === steps.length - 1 ? "Terminer" : "Suivant"}</span>
              {step === steps.length - 1 ? <CheckCircle2 className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
