import React, { useState, useMemo } from "react";
import { useStore } from "../store/StoreContext";
import { Staff, StaffAssignment } from "../types";
import { 
  Users, Search, Plus, Edit2, Trash2, Star, Phone, Mail, MapPin, 
  Calendar, CheckCircle, XCircle, AlertCircle, Clock, DollarSign, 
  ChevronLeft, Filter, MoreVertical, X, Save, Eye, EyeOff, Briefcase, Copy
} from "lucide-react";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import StaffModal from "./StaffModal";
import StaffProfile from "./StaffProfile";
import StaffAssignmentModal from "./StaffAssignmentModal";

const STAFF_TYPES = [
  { name: "Hôtesse (F)", icon: "👗", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { name: "Hôte (M)", icon: "🤵", color: "bg-primary/10 text-primary border-primary/20" },
  { name: "Agent de Sécurité", icon: "🔒", color: "bg-red-100 text-red-700 border-red-200" },
  { name: "Animateur/Animatrice", icon: "🎭", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { name: "Photographe/Vidéaste", icon: "📸", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { name: "Technicien", icon: "🔧", color: "bg-gray-100 text-gray-700 border-gray-200" },
  { name: "DJ / Sonorisation", icon: "🎵", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { name: "Serveur/Serveuse", icon: "🍽️", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { name: "Décorateur", icon: "🎨", color: "bg-teal-100 text-teal-700 border-teal-200" },
  { name: "Chauffeur", icon: "🚗", color: "bg-blue-900 text-blue-100 border-blue-800" },
  { name: "Coordinateur terrain", icon: "📋", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { name: "Autre", icon: "➕", color: "bg-slate-100 text-slate-700 border-slate-200" }
];

const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
  "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda",
  "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla",
  "Oran", "El Bayadh", "Illizi", "Bordj Bou Arreridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar",
  "Ouled Djellal", "Béni Abbès", "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa"
];

const formatDZD = (amount: number) => {
  return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(amount).replace('DZD', 'DZD');
};

const getStaffTypeStyle = (typeName: string) => {
  const type = STAFF_TYPES.find(t => t.name === typeName);
  return type ? type.color : "bg-gray-100 text-gray-700 border-gray-200";
};

const getStaffTypeIcon = (typeName: string) => {
  const type = STAFF_TYPES.find(t => t.name === typeName);
  return type ? type.icon : "👤";
};

const getAvailabilityColor = (status: string) => {
  switch (status) {
    case "Disponible": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Occupé": return "bg-orange-100 text-orange-700 border-orange-200";
    case "Indisponible": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export default function StaffTab() {
  const { data, currentUser, addStaff, updateStaff, deleteStaff, addStaffAssignment, updateStaffAssignment, deleteStaffAssignment, setCurrentPage } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<"database" | "assignments">("database");
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tous");
  const [genderFilter, setGenderFilter] = useState("Tous");
  const [wilayaFilter, setWilayaFilter] = useState("Toutes");
  const [availabilityFilter, setAvailabilityFilter] = useState("Toutes");
  const [sortBy, setSortBy] = useState("Note");

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<StaffAssignment | null>(null);

  const staffList = data.staff || [];
  const assignments = data.staffAssignments || [];

  const filteredStaff = useMemo(() => {
    let result = staffList.filter(s => {
      const matchesSearch = s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.lastName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "Tous" || s.staffType === typeFilter;
      const matchesGender = genderFilter === "Tous" || s.gender === genderFilter;
      const matchesWilaya = wilayaFilter === "Toutes" || s.wilaya === wilayaFilter;
      const matchesAvailability = availabilityFilter === "Toutes" || s.availability === availabilityFilter;
      
      return matchesSearch && matchesType && matchesGender && matchesWilaya && matchesAvailability;
    });

    result.sort((a, b) => {
      if (sortBy === "Note") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "Expérience") return (b.experienceYears || 0) - (a.experienceYears || 0);
      if (sortBy === "Tarif") return (b.dailyRateDzd || 0) - (a.dailyRateDzd || 0);
      if (sortBy === "Nom") return a.lastName.localeCompare(b.lastName);
      return 0;
    });

    return result;
  }, [staffList, searchTerm, typeFilter, genderFilter, wilayaFilter, availabilityFilter, sortBy]);

  const activeStaffCount = staffList.filter(s => s.isActive).length;
  const availableStaffCount = staffList.filter(s => s.isActive && s.availability === "Disponible").length;
  const totalEventsCovered = staffList.reduce((sum, s) => sum + (s.totalEvents || 0), 0);
  const avgRating = staffList.length > 0 ? (staffList.reduce((sum, s) => sum + (s.rating || 0), 0) / staffList.length).toFixed(1) : "0.0";

  if (selectedStaff) {
    return (
      <StaffProfile 
        staff={selectedStaff} 
        onBack={() => setSelectedStaff(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", activeSubTab === "database" ? "border-primary text-primary" : "border-transparent text-neutral-600 hover:text-neutral-900")}
          onClick={() => setActiveSubTab("database")}
        >
          Base de données
        </button>
        <button
          className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", activeSubTab === "assignments" ? "border-primary text-primary" : "border-transparent text-neutral-600 hover:text-neutral-900")}
          onClick={() => setActiveSubTab("assignments")}
        >
          Affectations
        </button>
      </div>

      {activeSubTab === "database" && (
        <>
          {/* Top Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-neutral-600 font-medium">Total staff actifs</p>
                <p className="text-lg font-bold text-gray-900">{activeStaffCount}</p>
              </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-gray-200"></div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-600 font-medium">Disponibles</p>
                <p className="text-lg font-bold text-gray-900">{availableStaffCount}</p>
              </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-gray-200"></div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-600 font-medium">Événements</p>
                <p className="text-lg font-bold text-gray-900">{totalEventsCovered}</p>
              </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-gray-200"></div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-600 font-medium">Note moyenne</p>
                <p className="text-lg font-bold text-gray-900">{avgRating}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Rechercher par nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn("px-4 py-2 border rounded-full flex items-center space-x-2 transition-colors text-sm font-medium", showFilters ? "bg-primary text-white border-primary" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50")}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtres</span>
              </button>
              <button
                onClick={() => {
                  setCurrentPage("Recruitment");
                }}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-gray-50 transition-colors text-sm font-medium ml-2"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Prévisualiser</span>
              </button>
              <button
                onClick={() => {
                  const link = `${window.location.origin}?recruitment=true`;
                  navigator.clipboard.writeText(link);
                  toast.success("Lien de recrutement copié !");
                }}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-gray-50 transition-colors text-sm font-medium ml-2"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Lien Formulaire</span>
              </button>
              <button
                onClick={() => {
                  setEditingStaff(null);
                  setIsStaffModalOpen(true);
                }}
                className="bg-primary text-white px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-primary-dark transition-colors text-sm font-medium ml-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter Staff</span>
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-gray-100">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="Tous">Tous les types</option>
                  {STAFF_TYPES.map(t => <option key={t.name} value={t.name}>{t.icon} {t.name}</option>)}
                </select>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="Tous">Tous les genres</option>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </select>
                <select
                  value={wilayaFilter}
                  onChange={(e) => setWilayaFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="Toutes">Toutes les wilayas</option>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="Toutes">Toutes disponibilités</option>
                  <option value="Disponible">Disponible</option>
                  <option value="Occupé">Occupé</option>
                  <option value="Indisponible">Indisponible</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="Note">Trier par: Note</option>
                  <option value="Expérience">Trier par: Expérience</option>
                  <option value="Tarif">Trier par: Tarif</option>
                  <option value="Nom">Trier par: Nom</option>
                </select>
              </div>
            )}
          </div>

          {/* Table */}
          {filteredStaff.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-neutral-600 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Staff</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium">Disponibilité</th>
                      <th className="px-6 py-4 font-medium">Wilaya</th>
                      <th className="px-6 py-4 font-medium">Événements</th>
                      <th className="px-6 py-4 font-medium">Note</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStaff.map(staff => (
                      <tr key={staff.id} className={cn("hover:bg-gray-50 transition-colors", !staff.isActive && "opacity-60")}>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {staff.profilePhotoUrl ? (
                              <img src={staff.profilePhotoUrl} alt={`${staff.firstName} ${staff.lastName}`} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm border border-gray-200">
                                {staff.firstName[0]}{staff.lastName[0]}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{staff.firstName} {staff.lastName}</div>
                              <div className="text-xs text-gray-500">{staff.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border", getStaffTypeStyle(staff.staffType))}>
                            {getStaffTypeIcon(staff.staffType)} {staff.staffType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", getAvailabilityColor(staff.availability))}>
                            {staff.availability}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {staff.wilaya}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {staff.totalEvents || 0}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-yellow-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="ml-1 text-sm font-medium text-gray-700">{staff.rating || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => setSelectedStaff(staff)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingStaff(staff);
                                setIsStaffModalOpen(true);
                              }} 
                              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setDeletingStaffId(staff.id)} 
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun membre du staff trouvé</h3>
              <p className="text-gray-500 mb-6">Ajoutez votre premier membre du staff pour commencer à gérer vos équipes terrains.</p>
              <button
                onClick={() => {
                  setEditingStaff(null);
                  setIsStaffModalOpen(true);
                }}
                className="bg-primary text-white px-4 py-2 rounded-full inline-flex items-center space-x-2 hover:bg-primary-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un membre</span>
              </button>
            </div>
          )}
        </>
      )}

      {activeSubTab === "assignments" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Toutes les affectations</h2>
            <button
              onClick={() => {
                setEditingAssignment(null);
                setIsAssignmentModalOpen(true);
              }}
              className="bg-primary-gradient text-white px-4 py-2 rounded-full flex items-center space-x-2 hover:opacity-90 transition-all shadow-md shadow-primary/20 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Affectation</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {assignments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Événement</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Lieu</th>
                      <th className="px-6 py-4 font-medium">Staff</th>
                      <th className="px-6 py-4 font-medium">Rôle</th>
                      <th className="px-6 py-4 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {assignments.map(assignment => {
                      const staff = staffList.find(s => s.id === assignment.staffId);
                      return (
                        <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {assignment.eventName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {format(new Date(assignment.eventDate), "d MMMM yyyy", { locale: fr })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {assignment.eventLocation || "-"}
                          </td>
                          <td className="px-6 py-4">
                            {staff ? (
                              <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded" onClick={() => setSelectedStaff(staff)}>
                                {staff.profilePhotoUrl ? (
                                  <img src={staff.profilePhotoUrl} alt={`${staff.firstName} ${staff.lastName}`} className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-[10px] border border-gray-200">
                                    {staff.firstName[0]}{staff.lastName[0]}
                                  </div>
                                )}
                                <span className="text-sm font-medium text-gray-900">{staff.firstName} {staff.lastName}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Staff inconnu</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {assignment.roleAtEvent || "-"}
                          </td>
                          <td className="px-6 py-4">
                            {assignment.performanceRating ? (
                              <div className="flex items-center text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="ml-1 text-sm font-medium text-gray-700">{assignment.performanceRating}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune affectation</h3>
                <p className="text-gray-500">Il n'y a pas encore d'affectations enregistrées.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isStaffModalOpen && (
        <StaffModal
          initialData={editingStaff}
          onClose={() => {
            setIsStaffModalOpen(false);
            setEditingStaff(null);
          }}
          onSave={(staff) => {
            if (editingStaff) {
              updateStaff(staff.id, staff);
            } else {
              addStaff(staff);
            }
          }}
        />
      )}

      {isAssignmentModalOpen && (
        <StaffAssignmentModal
          isOpen={isAssignmentModalOpen}
          initialData={editingAssignment}
          staffList={staffList}
          events={data.events}
          onClose={() => {
            setIsAssignmentModalOpen(false);
            setEditingAssignment(null);
          }}
          onSave={(assignment) => {
            if (editingAssignment) {
              updateStaffAssignment(assignment.id, assignment);
              toast.success("Affectation modifiée avec succès");
            } else {
              addStaffAssignment(assignment);
              toast.success("Nouvelle affectation ajoutée avec succès");
            }
          }}
        />
      )}

      {deletingStaffId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer ce membre du staff ? Cette action est irréversible et supprimera également son historique d'affectations.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeletingStaffId(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  deleteStaff(deletingStaffId);
                  setDeletingStaffId(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
