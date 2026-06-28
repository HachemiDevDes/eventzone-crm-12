import React, { useState } from "react";
import { Staff, StaffAssignment, EventLog } from "../types";
import { X, Calendar, MapPin, Briefcase, Star, FileText, User } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import { cn } from "../lib/utils";
import { useTranslation } from "../hooks/useTranslation";

interface StaffAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignment: StaffAssignment) => void;
  staffList: Staff[];
  events: EventLog[];
  initialData?: StaffAssignment | null;
}

const ROLES = [
  "Hôtesse d'accueil",
  "Hôte d'accueil",
  "Superviseur",
  "Chef d'équipe",
  "Manutentionnaire",
  "Chauffeur",
  "Sécurité",
  "Autre"
];

export default function StaffAssignmentModal({
  isOpen,
  onClose,
  onSave,
  staffList,
  events,
  initialData
}: StaffAssignmentModalProps) {
  const [formData, setFormData] = useState<Partial<StaffAssignment>>(
    initialData || {
      staffId: "",
      eventId: "",
      eventName: "",
      eventDate: new Date().toISOString().split('T')[0],
      eventLocation: "",
      roleAtEvent: "",
      performanceRating: undefined,
      notes: ""
    }
  );

  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEventId = e.target.value;
    const selectedEvent = events.find(ev => ev.id === selectedEventId);
    
    if (selectedEvent) {
      setFormData({
        ...formData,
        eventId: selectedEvent.id,
        eventName: selectedEvent.eventName,
        eventDate: selectedEvent.date.split('T')[0],
        eventLocation: selectedEvent.wilaya
      });
    } else {
      setFormData({
        ...formData,
        eventId: "",
        eventName: "",
        eventDate: new Date().toISOString().split('T')[0],
        eventLocation: ""
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staffId || !formData.eventName || !formData.eventDate) {
      alert("Veuillez remplir les champs obligatoires");
      return;
    }

    onSave({
      ...formData,
      id: initialData?.id || uuidv4(),
      eventDate: new Date(formData.eventDate).toISOString(),
    } as StaffAssignment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-2xl my-8 overflow-hidden border border-neutral-200 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-[12px] bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                {initialData ? t("edit_assignment") : t("new_assignment")}
              </h2>
              <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mt-0.5">
                {t("assignment_details")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(100vh-8rem)]">
          <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
            {/* Staff Selection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">{t("staff_member")}</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffId">{t("staff_member")} *</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors z-10" />
                  <Select
                    id="staffId"
                    required
                    value={formData.staffId}
                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                    className="pl-10"
                  >
                    <option value="">{t("select_member")}...</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} - {s.staffType}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">{t("event_information")}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="eventId">{t("event")} *</Label>
                  <div className="relative group">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors z-10" />
                    <Select
                      id="eventId"
                      required
                      value={formData.eventId || ""}
                      onChange={handleEventChange}
                      className="pl-10"
                    >
                      <option value="">{t("select_event")}...</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.eventName}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDate">{t("event_date")} *</Label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors z-10" />
                    <Input
                      id="eventDate"
                      type="date"
                      required
                      value={formData.eventDate?.split('T')[0] || ""}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="eventLocation">{t("location")}</Label>
                  <div className="relative group">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors z-10" />
                    <Input
                      id="eventLocation"
                      type="text"
                      value={formData.eventLocation || ""}
                      onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                      className="pl-10"
                      placeholder="Ex: SAFEX"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleAtEvent">{t("assigned_role")}</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors z-10" />
                    <Select
                      id="roleAtEvent"
                      value={formData.roleAtEvent || ""}
                      onChange={(e) => setFormData({ ...formData, roleAtEvent: e.target.value })}
                      className="pl-10"
                    >
                      <option value="">{t("select_role")}...</option>
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">{t("performance")}</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="performanceRating">{t("performance_rating")} (sur 5)</Label>
                <div className="relative group">
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors z-10" />
                  <Input
                    id="performanceRating"
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={formData.performanceRating || ""}
                    onChange={(e) => setFormData({ ...formData, performanceRating: parseFloat(e.target.value) || undefined })}
                    className="pl-10"
                    placeholder="Ex: 4.5"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">{t("notes")}</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t("notes_comments")}</Label>
                <div className="relative group">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors z-10" />
                  <Textarea
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="pl-10 min-h-[100px]"
                    placeholder={t("performance_comments_placeholder")}
                  />
                </div>
              </div>
            </div>
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
              variant="primary"
              className="px-6 sm:px-8 shadow-lg shadow-primary/20 font-bold uppercase tracking-widest text-[10px] sm:text-xs"
            >
              {t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
