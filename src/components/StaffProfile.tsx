import React, { useState } from "react";
import { Staff, StaffAssignment } from "../types";
import { useStore } from "../store/StoreContext";
import { 
  ChevronLeft, Edit2, MapPin, Phone, Mail, Calendar, Star, 
  Briefcase, DollarSign, FileText, CheckCircle, XCircle, Clock
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "../lib/utils";
import StaffModal from "./StaffModal";

interface StaffProfileProps {
  staff: Staff;
  onBack: () => void;
}

const getAvailabilityColor = (status: string) => {
  switch (status) {
    case "Disponible": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Occupé": return "bg-orange-100 text-orange-700 border-orange-200";
    case "Indisponible": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const formatDZD = (amount: number) => {
  return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(amount).replace('DZD', 'DZD');
};

export default function StaffProfile({ staff, onBack }: StaffProfileProps) {
  const { data, updateStaff } = useStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Get assignments for this staff member
  const assignments = (data.staffAssignments || []).filter(a => a.staffId === staff.id);
  
  // Sort assignments by date (newest first)
  const sortedAssignments = [...assignments].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Retour à la liste
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Modifier le profil
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Photo & Basic Info */}
          <div className="flex flex-col items-center md:items-start md:w-1/3 space-y-4">
            {staff.profilePhotoUrl ? (
              <img 
                src={staff.profilePhotoUrl} 
                alt={`${staff.firstName} ${staff.lastName}`} 
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md" 
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-4xl border-4 border-white shadow-md">
                {staff.firstName[0]}{staff.lastName[0]}
              </div>
            )}
            
            <div className="text-center md:text-left w-full">
              <h1 className="text-2xl font-bold text-gray-900">{staff.firstName} {staff.lastName}</h1>
              <p className="text-primary font-medium">{staff.staffType}</p>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center md:justify-start text-gray-600">
                  <Star className="w-4 h-4 mr-2 text-yellow-400 fill-current" />
                  <span className="font-medium">{staff.rating || 0} / 5</span>
                </div>
                <div className="flex items-center justify-center md:justify-start">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", getAvailabilityColor(staff.availability))}>
                    {staff.availability}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Contact & Perso</h3>
              
              <div className="flex items-start">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="text-sm font-medium text-gray-900">{staff.phone}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{staff.email || "N/A"}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Localisation</p>
                  <p className="text-sm font-medium text-gray-900">{staff.wilaya || "N/A"}</p>
                  {staff.address && <p className="text-xs text-gray-500 mt-0.5">{staff.address}</p>}
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Âge</p>
                  <p className="text-sm font-medium text-gray-900">{staff.age ? `${staff.age} ans` : "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Profil Pro</h3>
              
              <div className="flex items-start">
                <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Tarifs</p>
                  <p className="text-sm font-medium text-gray-900">{formatDZD(staff.dailyRateDzd)} / jour</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDZD(staff.halfDayRateDzd)} / demi-journée</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Expérience</p>
                  <p className="text-sm font-medium text-gray-900">{staff.experienceYears || 0} ans</p>
                  <p className="text-xs text-gray-500 mt-0.5">{staff.totalEvents || 0} événements couverts</p>
                </div>
              </div>

              <div className="flex items-start">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Langues</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(staff.languages || []).map(lang => (
                      <span key={lang} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specializations & Notes */}
        <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Spécialisations</h3>
            {staff.specializations && staff.specializations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {staff.specializations.map(spec => (
                  <span key={spec} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm">
                    {spec}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Aucune spécialisation renseignée.</p>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Notes internes</h3>
            {staff.notes ? (
              <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                {staff.notes}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Aucune note pour ce membre.</p>
            )}
          </div>
        </div>
      </div>

      {/* Assignment History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Historique des affectations</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Événement</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Dates</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Rôle</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Rémunération</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedAssignments.length > 0 ? (
                sortedAssignments.map(assignment => {
                  const event = data.events.find(e => e.id === assignment.eventId);
                  return (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <p className="text-sm font-medium text-gray-900">{event?.title || "Événement inconnu"}</p>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {format(new Date(assignment.startDate), 'dd MMM yyyy', { locale: fr })}
                        {assignment.endDate && assignment.endDate !== assignment.startDate && (
                          <> - {format(new Date(assignment.endDate), 'dd MMM yyyy', { locale: fr })}</>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600">{assignment.role}</td>
                      <td className="p-4 text-sm font-medium text-gray-900">{formatDZD(assignment.totalAmountDzd || 0)}</td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium border",
                          assignment.status === "Confirmé" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                          assignment.status === "En attente" ? "bg-orange-100 text-orange-700 border-orange-200" :
                          assignment.status === "Terminé" ? "bg-primary/10 text-primary border-primary/20" :
                          "bg-red-100 text-red-700 border-red-200"
                        )}>
                          {assignment.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Aucune affectation trouvée pour ce membre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && (
        <StaffModal
          initialData={staff}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updatedStaff) => {
            updateStaff(updatedStaff.id, updatedStaff);
          }}
        />
      )}
    </div>
  );
}
