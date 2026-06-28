import React, { useState, useMemo } from "react";
import { useStore } from "../store/StoreContext";
import { EventLog } from "../types";
import { Plus, Search, Calendar as CalendarIcon, MapPin, Users, Star, List, Grid, Trash2, TrendingUp, Zap, Activity, CheckCircle2, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "../hooks/useTranslation";
import { WILAYAS } from "../constants";
import { cn } from "../lib/utils";
import { 
  isAfter, 
  isBefore, 
  subDays, 
  addDays, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from "date-fns";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";

export default function Events() {
  const { data, addEvent, deleteEvent, currentUser, searchTarget, setSearchTarget } = useStore();
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "upcoming" | "past">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Handle search target
  React.useEffect(() => {
    if (searchTarget && searchTarget.type === 'Event') {
      const event = data.events.find(e => e.id === searchTarget.id);
      if (event) {
        setSearchTerm(event.eventName);
        setSearchTarget(null);
      }
    }
  }, [searchTarget, data.events, setSearchTarget]);

  const isManager = currentUser?.role === "Manager";

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const filteredEvents = useMemo(() => {
    const now = new Date();
    return data.events
      .filter(
        (e) => {
          const eventDate = parseISO(e.date);
          const isUpcoming = isAfter(eventDate, now) || isSameDay(eventDate, now);
          
          if (timeFilter === "upcoming" && !isUpcoming) return false;
          if (timeFilter === "past" && isUpcoming) return false;

          const matchesSearch = e.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.wilaya.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.clients.find((c) => c.id === e.clientId)?.companyName.toLowerCase().includes(searchTerm.toLowerCase());
          
          if (isManager) return matchesSearch;
          
          const client = data.clients.find(c => c.id === e.clientId);
          return matchesSearch && client?.assignedTo === currentUser?.id;
        }
      )
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        if (timeFilter === "upcoming") {
          return dateA - dateB; // Soonest first
        }
        return dateB - dateA; // Most recent first for past and all
      });
  }, [data.events, data.clients, searchTerm, timeFilter, isManager, currentUser?.id]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, EventLog[]> = {};
    filteredEvents.forEach(event => {
      const dateStr = format(parseISO(event.date), 'yyyy-MM-dd');
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(event);
    });
    return map;
  }, [filteredEvents]);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("eventsTitle")}</h1>
          <p className="text-gray-500 mt-1">{t("manageEventsDescription") || "Suivez et gérez tous vos événements passés et futurs."}</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          size="md"
          className="w-full sm:w-auto shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t("logEvent")}
        </Button>
      </div>

      <div className="card-standard overflow-hidden flex-1 flex flex-col !p-0">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/30 flex items-center justify-between">
          <div className="relative flex-1 max-w-xs group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder={t("searchEventPlaceholder")}
              className="pl-10 h-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4 ml-4">
            {viewMode === "list" && (
              <div className="flex bg-neutral-100 p-1 rounded-xl">
                <button
                  onClick={() => setTimeFilter("all")}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full transition-all",
                    timeFilter === "all" ? "bg-white text-primary shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                  )}
                >
                  {t("all") || "Tous"}
                </button>
                <button
                  onClick={() => setTimeFilter("upcoming")}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full transition-all",
                    timeFilter === "upcoming" ? "bg-white text-primary shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                  )}
                >
                  {t("upcomingEventsShort") || "À venir"}
                </button>
                <button
                  onClick={() => setTimeFilter("past")}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full transition-all",
                    timeFilter === "past" ? "bg-white text-primary shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                  )}
                >
                  {t("completedEvents") || "Terminés"}
                </button>
              </div>
            )}

            <div className="flex bg-neutral-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-full transition-all ${
                viewMode === "list"
                  ? "bg-white text-primary shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
              title="Vue Liste"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-1.5 rounded-full transition-all ${
                viewMode === "calendar"
                  ? "bg-white text-primary shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
              title="Vue Calendrier"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {viewMode === "list" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-neutral-700 uppercase tracking-widest">{t("date")}</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-700 uppercase tracking-widest">{t("client")}</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-700 uppercase tracking-widest">{t("eventName")}</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-700 uppercase tracking-widest">{t("wilaya")}</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-700 uppercase tracking-widest text-center">{t("attendees")}</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-700 uppercase tracking-widest text-center">{t("satisfaction")}</th>
                    {isManager && <th className="px-6 py-4 text-xs font-bold text-neutral-700 uppercase tracking-widest text-right">{t("actions")}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredEvents.map((event) => {
                    const client = data.clients.find((c) => c.id === event.clientId);
                    const isConfirming = confirmDeleteId === event.id;

                    return (
                      <tr key={event.id} className="group hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/5 rounded-xl">
                              <CalendarIcon className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-bold text-neutral-700">
                              {new Date(event.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-500 border border-neutral-200">
                              {client?.companyName.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-neutral-900">{client?.companyName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-neutral-600">{event.eventName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 text-neutral-500">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-sm">{event.wilaya}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-neutral-100 rounded-full text-neutral-600">
                            <Users className="w-3 h-3" />
                            <span className="text-xs font-bold">{event.attendees}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-3.5 h-3.5",
                                  i < event.satisfactionRating
                                    ? "text-yellow-400 fill-current"
                                    : "text-neutral-200"
                                )}
                              />
                            ))}
                          </div>
                        </td>
                        {isManager && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                if (isConfirming) {
                                  deleteEvent(event.id);
                                  setConfirmDeleteId(null);
                                } else {
                                  setConfirmDeleteId(event.id);
                                  setTimeout(() => setConfirmDeleteId(null), 3000);
                                }
                              }}
                              className={cn(
                                "p-2 rounded-full transition-all",
                                isConfirming
                                  ? "bg-red-500 text-white shadow-lg shadow-red-200"
                                  : "text-neutral-400 hover:text-red-500 hover:bg-red-50"
                              )}
                            >
                              {isConfirming ? (
                                <span className="text-[10px] font-black uppercase tracking-tighter px-1">Confirmer</span>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-neutral-800 capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: lang === 'fr' ? undefined : undefined })}
                </h3>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2"
                  >
                    <TrendingUp className="w-4 h-4 rotate-180" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                    className="text-xs font-bold uppercase tracking-widest"
                  >
                    Aujourd'hui
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-px bg-neutral-100 rounded-xl overflow-hidden border border-neutral-100">
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                  <div key={day} className="bg-neutral-50 py-3 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, i) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDay[dateStr] || [];
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={i}
                      className={cn(
                        "min-h-[120px] bg-white p-2 transition-colors hover:bg-neutral-50/50",
                        !isCurrentMonth && "bg-neutral-50/30 opacity-50"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                          isToday ? "bg-primary text-white shadow-sm" : "text-neutral-500"
                        )}>
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-xl">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className="text-[10px] p-1.5 bg-neutral-50 border border-neutral-100 rounded-xl text-neutral-600 font-bold truncate hover:border-primary/30 transition-colors cursor-default"
                            title={event.eventName}
                          >
                            {event.eventName}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[9px] text-neutral-400 font-bold pl-1">
                            + {dayEvents.length - 3} autres
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {filteredEvents.length === 0 && (
            <div className="p-20 text-center">
              <div className="inline-flex p-8 bg-neutral-50 rounded-xl mb-6">
                <Search className="w-12 h-12 text-neutral-200" />
              </div>
              <p className="text-neutral-400 font-bold text-lg">{t("noEventsLogged")}</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <NewEventModal onClose={() => setIsModalOpen(false)} onSave={addEvent} />
      )}
    </div>
  );
}



function NewEventModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (event: EventLog) => void;
}) {
  const { data, currentUser } = useStore();
  const { t } = useTranslation();
  const isManager = currentUser?.role === "Manager";
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<EventLog>>({
    servicesDelivered: [],
    satisfactionRating: 5,
  });

  const availableClients = isManager 
    ? data.clients 
    : data.clients.filter(c => c.assignedTo === currentUser?.id);

  const availableServices = [
    { key: "ticketingPlatform", label: t("ticketingPlatform") },
    { key: "registrationForm", label: t("registrationForm") },
    { key: "mobileApp", label: t("mobileApp") },
    { key: "badgePrinting", label: t("badgePrinting") },
    { key: "hostesses", label: t("hostesses") },
    { key: "accessControl", label: t("accessControl") },
    { key: "reportsAnalytics", label: t("reportsAnalytics") },
  ];

  const handleServiceToggle = (service: string) => {
    const current = formData.servicesDelivered || [];
    if (current.includes(service)) {
      setFormData({ ...formData, servicesDelivered: current.filter((s) => s !== service) });
    } else {
      setFormData({ ...formData, servicesDelivered: [...current, service] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    } as EventLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-visible">
        {/* Header */}
        <div className="p-8 pb-0 shrink-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t("logEventTitle")}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {step === 1 ? t("eventDetails") || "Détails de l'événement" : t("satisfactionAndServices") || "Satisfaction et Services"}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="flex items-center space-x-2">
              <div className={cn("h-1.5 w-12 rounded-full transition-all duration-500", step >= 1 ? 'bg-primary' : 'bg-gray-100')}></div>
              <div className={cn("h-1.5 w-12 rounded-full transition-all duration-500", step >= 2 ? 'bg-primary' : 'bg-gray-100')}></div>
            </div>
            <span className="text-xs text-neutral-700 font-bold uppercase tracking-widest">Étape {step} / 2</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar">
            {step === 1 ? (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">Informations Générales</h3>
                    <div>
                      <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 block">{t("client")}</Label>
                      <Select
                        required
                        value={formData.clientId || ""}
                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      >
                        <option value="">{t("selectClient")}</option>
                        {availableClients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.companyName}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label>{t("eventName")}</Label>
                      <Input
                        required
                        type="text"
                        placeholder="Nom de l'événement"
                        value={formData.eventName || ""}
                        onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t("date")}</Label>
                        <div className="relative">
                          <Input
                            required
                            type="date"
                            className="pr-10"
                            value={formData.date || ""}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          />
                          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <Label>{t("wilaya")}</Label>
                        <Select
                          icon={<MapPin />}
                          required
                          value={formData.wilaya || ""}
                          onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                        >
                          <option value="">Sélectionner</option>
                          {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">Détails de Participation</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t("attendees")}</Label>
                        <Input
                          required
                          type="number"
                          placeholder="0"
                          value={formData.attendees || ""}
                          onChange={(e) => setFormData({ ...formData, attendees: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>{t("badgesPrinted")}</Label>
                        <Input
                          required
                          type="number"
                          placeholder="0"
                          value={formData.badgesPrinted || ""}
                          onChange={(e) => setFormData({ ...formData, badgesPrinted: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{t("notes")}</Label>
                      <Textarea
                        rows={4}
                        placeholder="Notes sur l'événement..."
                        value={formData.notes || ""}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2 mb-6">Services & Satisfaction</h3>
                  <Label className="mb-4">{t("servicesDelivered")}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {availableServices.map((service) => (
                      <button
                        key={service.key}
                        type="button"
                        onClick={() => handleServiceToggle(service.label)}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-full border transition-all text-left",
                          formData.servicesDelivered?.includes(service.label)
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-neutral-100 bg-white text-neutral-600 hover:border-neutral-200"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-xl border flex items-center justify-center transition-all shrink-0",
                          formData.servicesDelivered?.includes(service.label)
                            ? "border-primary bg-primary"
                            : "border-neutral-200 bg-white"
                        )}>
                          {formData.servicesDelivered?.includes(service.label) && (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-xs font-bold">{service.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-4 block">{t("clientSatisfaction")}</Label>
                  <div className="flex items-center space-x-4 bg-neutral-50/50 p-6 rounded-2xl border border-neutral-100">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFormData({ ...formData, satisfactionRating: rating })}
                        className="focus:outline-none group transition-transform active:scale-90"
                      >
                        <Star
                          className={cn(
                            "w-10 h-10 transition-all",
                            rating <= (formData.satisfactionRating || 0)
                              ? "text-yellow-400 fill-current drop-shadow-sm"
                              : "text-neutral-200 group-hover:text-neutral-300"
                          )}
                        />
                      </button>
                    ))}
                    <span className="ml-4 text-xl font-black text-neutral-700">
                      {formData.satisfactionRating}/5
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-8 bg-neutral-50/30 border-t border-neutral-100 flex justify-between items-center shrink-0 mt-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={step === 1 ? onClose : () => setStep(1)}
              className="font-bold text-neutral-500 uppercase tracking-widest text-xs"
            >
              {step === 1 ? t("cancel") : t("back")}
            </Button>
            <div className="flex space-x-3">
              <Button
                type={step === 2 ? "submit" : "button"}
                onClick={step === 1 ? () => setStep(2) : undefined}
                variant="primary"
                className="px-8 shadow-lg shadow-primary/20 font-bold uppercase tracking-widest text-xs"
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
