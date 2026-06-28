import React, { useState, useEffect } from "react";
import { useStore } from "../store/StoreContext";
import { Mail, Lock, Eye, EyeOff, X, CheckCircle, BarChart2, Users, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Input } from "../components/ui/Input";

export default function Login() {
  const { login } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsLoggingIn(true);
    try {
      const success = await login(email, password);
      if (!success) {
        setError("Email ou mot de passe incorrect. Veuillez réessayer.");
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      setError("Une erreur est survenue.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white overflow-hidden font-sans">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>

      {/* Left Panel - Desktop Only */}
      <div className="hidden lg:flex lg:w-[60%] bg-primary-gradient relative flex-col justify-between p-12 overflow-hidden">
        {/* Background Shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-sky-500/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 mt-12">
          <img
            src="https://images2.imgbox.com/02/39/OksF9irW_o.png"
            alt="EventZone Logo"
            className="h-12 w-auto object-contain mb-12"
          />
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Gérez vos événements <br /> avec excellence.
          </h1>
          <p className="text-xl text-blue-100/80 max-w-lg mb-12">
            La plateforme CRM dédiée aux professionnels de l'événementiel en Algérie.
          </p>

          <div className="space-y-6">
            <FeatureItem icon={<Users className="w-6 h-6" />} text="Gestion des leads et clients" />
            <FeatureItem icon={<BarChart2 className="w-6 h-6" />} text="Suivi des performances en temps réel" />
            <FeatureItem icon={<CheckCircle className="w-6 h-6" />} text="Collaboration d'équipe simplifiée" />
          </div>
        </div>

        <div className="relative z-10 text-blue-100/60 text-sm">
          © 2026 EventZone Pro Platform v2.0
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center items-center p-8 relative bg-white">
        <div 
          className={cn(
            "w-full max-w-md transition-all duration-700 transform",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src="https://images2.imgbox.com/02/39/OksF9irW_o.png"
              alt="EventZone Logo"
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-[28px] font-bold text-neutral-900 mb-2">Connexion</h2>
            <p className="text-neutral-600 text-sm">Bienvenue — entrez vos identifiants</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
                <span className="flex items-center gap-2">
                   <X className="w-4 h-4 text-red-500" />
                   {error}
                </span>
                <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className={cn("space-y-4", shake && "animate-shake")}>
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-500" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-500" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-dark to-primary hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 h-[48px]"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-neutral-500">
              © 2026 EventZone Pro — Tous droits réservés
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center space-x-4 text-white group">
      <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors backdrop-blur-sm">
        {icon}
      </div>
      <span className="text-lg font-medium">{text}</span>
    </div>
  );
}
