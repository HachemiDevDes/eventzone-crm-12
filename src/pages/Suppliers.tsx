import React, { useState, useMemo, useEffect } from "react";
import { useStore } from "../store/StoreContext";
import { Supplier, SupplierOrder } from "../types";
import { 
  Truck, Search, Plus, Edit2, Trash2, Star, Phone, Mail, MapPin, 
  Globe, FileText, Calendar, CheckCircle, XCircle, AlertCircle, 
  Clock, DollarSign, ChevronLeft, TrendingUp, BarChart2, PieChart as PieChartIcon,
  Filter, MoreVertical, X, Save, FileCheck, Award, Users
} from "lucide-react";
import { cn } from "../lib/utils";
import { format, differenceInDays, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import SupplierModal from "../components/SupplierModal";
import SupplierOrderModal from "../components/SupplierOrderModal";
import StaffTab from "../components/StaffTab";
import BasePricesTab from "../components/BasePricesTab";

export const CATEGORIES = [
  { name: "Impression & Badging", icon: "🖨️", color: "bg-primary/10 text-primary border-primary/20" },
  { name: "Matériel Informatique", icon: "💻", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { name: "Équipement Événementiel", icon: "🎪", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { name: "Transport & Logistique", icon: "🚗", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { name: "Traiteur & Restauration", icon: "🍽️", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { name: "Photographie & Vidéo", icon: "📸", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { name: "Sonorisation & Éclairage", icon: "🔊", color: "bg-red-100 text-red-700 border-red-200" },
  { name: "Hébergement & Salles", icon: "🏨", color: "bg-teal-100 text-teal-700 border-teal-200" },
  { name: "Technologie & SaaS", icon: "🖥️", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { name: "Fournitures de Bureau", icon: "📦", color: "bg-gray-100 text-gray-700 border-gray-200" },
  { name: "Maintenance & Technique", icon: "🔧", color: "bg-amber-100 text-amber-700 border-amber-200" },
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

const CONTRACT_STATUSES = ["Aucun", "Actif", "En négociation", "Expiré", "Résilié"];
const ORDER_STATUSES = ["En attente", "Confirmé", "En livraison", "Livré", "Annulé"];
const PAYMENT_STATUSES = ["Non payé", "Partiellement payé", "Payé"];
const PAYMENT_TERMS = ["Comptant", "30 jours", "60 jours", "Acompte 50%", "Négociable"];

const formatDZD = (amount: number) => {
  return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(amount).replace('DZD', 'DZD');
};

const getCategoryStyle = (categoryName: string) => {
  const cat = CATEGORIES.find(c => c.name === categoryName);
  return cat ? cat.color : "bg-gray-100 text-gray-700 border-gray-200";
};

const getContractStatusColor = (status: string) => {
  switch (status) {
    case "Actif": return "bg-emerald-100 text-emerald-700";
    case "Expiré": return "bg-red-100 text-red-700";
    case "En négociation": return "bg-orange-100 text-orange-700";
    case "Résilié": return "bg-gray-100 text-gray-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

const getOrderStatusColor = (status: string) => {
  switch (status) {
    case "Livré": return "bg-emerald-100 text-emerald-700";
    case "Confirmé": return "bg-primary/10 text-primary";
    case "En livraison": return "bg-orange-100 text-orange-700";
    case "Annulé": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "Payé": return "bg-emerald-100 text-emerald-700";
    case "Partiellement payé": return "bg-orange-100 text-orange-700";
    case "Non payé": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

export default function Suppliers() {
  const { data, currentUser, addSupplier, updateSupplier, deleteSupplier, addSupplierOrder, updateSupplierOrder, deleteSupplierOrder, searchTarget, setSearchTarget } = useStore();
  const [activeTab, setActiveTab] = useState<"list" | "orders" | "evaluation" | "contracts" | "staff" | "base_prices">("list");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Handle search target
  useEffect(() => {
    if (searchTarget && searchTarget.type === 'Supplier') {
      const supplier = data.suppliers?.find(s => s.id === searchTarget.id);
      if (supplier) {
        setSelectedSupplier(supplier);
        setActiveTab("list");
        setSearchTarget(null);
      }
    }
  }, [searchTarget, data.suppliers, setSearchTarget]);
  
  // Update selectedSupplier when data.suppliers changes
  useEffect(() => {
    if (selectedSupplier) {
      const updated = data.suppliers?.find(s => s.id === selectedSupplier.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedSupplier)) {
        setSelectedSupplier(updated);
      } else if (!updated) {
        setSelectedSupplier(null);
      }
    }
  }, [data.suppliers, selectedSupplier]);

  // Modals state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'supplier' | 'order', id: string } | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingOrder, setEditingOrder] = useState<SupplierOrder | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [wilayaFilter, setWilayaFilter] = useState("All");
  const [contractFilter, setContractFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  if (currentUser?.role !== "Manager") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Accès Refusé</h2>
          <p className="text-neutral-700 mt-2">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // Derived data
  const suppliers = data.suppliers || [];
  const orders = data.supplierOrders || [];

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchesSearch = s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (s.contactName && s.contactName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === "All" || s.category === categoryFilter;
      const matchesWilaya = wilayaFilter === "All" || s.wilaya === wilayaFilter;
      const matchesContract = contractFilter === "All" || s.contractStatus === contractFilter;
      const matchesStatus = statusFilter === "All" || 
                            (statusFilter === "Active" && s.isActive) || 
                            (statusFilter === "Inactive" && !s.isActive);
      
      return matchesSearch && matchesCategory && matchesWilaya && matchesContract && matchesStatus;
    });
  }, [suppliers, searchTerm, categoryFilter, wilayaFilter, contractFilter, statusFilter]);

  const totalSpentThisYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return orders
      .filter(o => new Date(o.orderDate).getFullYear() === currentYear && o.status !== "Annulé")
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  const activeSuppliersCount = suppliers.filter(s => s.isActive).length;
  const preferredSuppliersCount = suppliers.filter(s => s.isPreferred).length;

  const categoryExpenses = useMemo(() => {
    const expenses: Record<string, number> = {};
    orders.forEach(order => {
      if (order.status !== "Annulé") {
        const supplier = suppliers.find(s => s.id === order.supplierId);
        if (supplier) {
          expenses[supplier.category] = (expenses[supplier.category] || 0) + order.totalAmount;
        }
      }
    });
    return Object.entries(expenses).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [orders, suppliers]);

  const topSuppliers = useMemo(() => {
    const expenses: Record<string, number> = {};
    orders.forEach(order => {
      if (order.status !== "Annulé") {
        const supplier = suppliers.find(s => s.id === order.supplierId);
        if (supplier) {
          expenses[supplier.companyName] = (expenses[supplier.companyName] || 0) + order.totalAmount;
        }
      }
    });
    return Object.entries(expenses)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [orders, suppliers]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === 'supplier') {
        await deleteSupplier(itemToDelete.id);
      } else {
        await deleteSupplierOrder(itemToDelete.id);
      }
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      if (itemToDelete.type === 'supplier' && selectedSupplier?.id === itemToDelete.id) {
        setSelectedSupplier(null);
      }
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const renderSupplierProfile = () => {
    if (!selectedSupplier) return null;

    const supplierOrders = orders.filter(o => o.supplierId === selectedSupplier.id);
    const totalSpent = supplierOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = supplierOrders.length > 0 ? totalSpent / supplierOrders.length : 0;

    return (
      <div className="h-full flex flex-col bg-gray-50 -m-4 sm:-m-8 p-4 sm:p-8 overflow-y-auto">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => setSelectedSupplier(null)}
            className="mr-4 p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            {selectedSupplier.companyName}
            {selectedSupplier.isPreferred && <Star className="w-6 h-6 text-amber-400 fill-amber-400 ml-2" />}
          </h1>
          <div className="ml-auto flex space-x-3">
            <button 
              onClick={() => {
                setEditingSupplier(selectedSupplier);
                setIsSupplierModalOpen(true);
              }}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 flex items-center"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Modifier
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", getCategoryStyle(selectedSupplier.category))}>
                  {selectedSupplier.category}
                </span>
                <span className={cn("px-2 py-1 rounded-full text-xs font-bold", selectedSupplier.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                  {selectedSupplier.isActive ? "Actif" : "Inactif"}
                </span>
              </div>

              <div className="space-y-4">
                {selectedSupplier.contactName && (
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedSupplier.contactName}</p>
                      <p className="text-xs text-neutral-600">Contact principal</p>
                    </div>
                  </div>
                )}
                {selectedSupplier.phone && (
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <a href={`tel:${selectedSupplier.phone}`} className="text-sm text-primary hover:underline">{selectedSupplier.phone}</a>
                  </div>
                )}
                {selectedSupplier.email && (
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <a href={`mailto:${selectedSupplier.email}`} className="text-sm text-primary hover:underline">{selectedSupplier.email}</a>
                  </div>
                )}
                {selectedSupplier.address && (
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <p className="text-sm text-gray-700">{selectedSupplier.address}{selectedSupplier.wilaya ? `, ${selectedSupplier.wilaya}` : ''}</p>
                  </div>
                )}
                {selectedSupplier.website && (
                  <div className="flex items-start">
                    <Globe className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <a href={selectedSupplier.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{selectedSupplier.website}</a>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Évaluation interne</h3>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={cn("w-6 h-6 cursor-pointer transition-colors", star <= selectedSupplier.rating ? "text-amber-400 fill-amber-400" : "text-gray-200")}
                      onClick={() => updateSupplier(selectedSupplier.id, { rating: star })}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Services proposés</h3>
              <div className="flex flex-wrap gap-2">
                {selectedSupplier.servicesProvided?.length > 0 ? (
                  selectedSupplier.servicesProvided.map((service, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {service}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">Aucun service spécifié</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Total Commandes</p>
                <p className="text-2xl font-bold text-gray-900">{supplierOrders.length}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Total Dépensé</p>
                <p className="text-2xl font-bold text-primary">{formatDZD(totalSpent)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Panier Moyen</p>
                <p className="text-2xl font-bold text-emerald-600">{formatDZD(avgOrderValue)}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Historique des commandes</h3>
                <button 
                  onClick={() => {
                    setEditingOrder(null);
                    setIsOrderModalOpen(true);
                  }}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  + Nouvelle commande
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Date</th>
                      <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Montant</th>
                      <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Statut</th>
                      <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Paiement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {supplierOrders.length > 0 ? (
                      supplierOrders.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()).map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="p-4 text-sm text-gray-900">{format(new Date(order.orderDate), 'dd MMM yyyy', { locale: fr })}</td>
                          <td className="p-4 text-sm font-medium text-gray-900">{formatDZD(order.totalAmount)}</td>
                          <td className="p-4">
                            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getOrderStatusColor(order.status))}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getPaymentStatusColor(order.paymentStatus))}>
                              {order.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">Aucune commande trouvée</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {selectedSupplier ? (
        renderSupplierProfile()
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
              Gestion des Fournisseurs
            </h1>
            <div className="flex space-x-3 w-full sm:w-auto">
              {activeTab === "list" && (
                <button
                  onClick={() => setIsSupplierModalOpen(true)}
                  className="w-full sm:w-auto bg-primary-gradient text-white px-4 py-2 rounded-full flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-md shadow-primary/20 text-sm font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nouveau Fournisseur</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
              <button
                className={cn("px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors", activeTab === "list" ? "border-primary text-primary" : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-gray-300")}
                onClick={() => setActiveTab("list")}
              >
                Liste des Fournisseurs
              </button>
              {currentUser?.role === "Manager" && (
                <button
                  className={cn("px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors", activeTab === "staff" ? "border-primary text-primary" : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-gray-300")}
                  onClick={() => setActiveTab("staff")}
                >
                  Staff
                </button>
              )}
              <button
                className={cn("px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors", activeTab === "base_prices" ? "border-primary text-primary" : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-gray-300")}
                onClick={() => setActiveTab("base_prices")}
              >
                Prix de Base
              </button>
              <button
                className={cn("px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors", activeTab === "orders" ? "border-primary text-primary" : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-gray-300")}
                onClick={() => setActiveTab("orders")}
              >
                Commandes
              </button>
              <button
                className={cn("px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors", activeTab === "evaluation" ? "border-primary text-primary" : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-gray-300")}
                onClick={() => setActiveTab("evaluation")}
              >
                Évaluation & Performance
              </button>
              <button
                className={cn("px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors", activeTab === "contracts" ? "border-primary text-primary" : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-gray-300")}
                onClick={() => setActiveTab("contracts")}
              >
                Contrats & Documents
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50">
              {activeTab === "list" && (
                <div className="space-y-6">
                  {/* Top Summary */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Truck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 font-medium">Total Fournisseurs</p>
                        <p className="text-lg font-bold text-gray-900">{suppliers.length}</p>
                      </div>
                    </div>
                    <div className="hidden md:block w-px h-10 bg-gray-200"></div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-50 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 font-medium">Actifs</p>
                        <p className="text-lg font-bold text-gray-900">{activeSuppliersCount}</p>
                      </div>
                    </div>
                    <div className="hidden md:block w-px h-10 bg-gray-200"></div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-50 rounded-xl">
                        <Star className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 font-medium">Préférés</p>
                        <p className="text-lg font-bold text-gray-900">{preferredSuppliersCount}</p>
                      </div>
                    </div>
                    <div className="hidden md:block w-px h-10 bg-gray-200"></div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-50 rounded-xl">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 font-medium">Dépenses (Année)</p>
                        <p className="text-lg font-bold text-gray-900">{formatDZD(totalSpentThisYear)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-gray-200">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un fournisseur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="All">Toutes les catégories</option>
                      {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                    </select>
                    <select
                      value={wilayaFilter}
                      onChange={(e) => setWilayaFilter(e.target.value)}
                      className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="All">Toutes les wilayas</option>
                      {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <select
                      value={contractFilter}
                      onChange={(e) => setContractFilter(e.target.value)}
                      className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="All">Tous les contrats</option>
                      {CONTRACT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Table */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Fournisseur</th>
                            <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Catégorie</th>
                            <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Contact</th>
                            <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Contrat</th>
                            <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Évaluation</th>
                            <th className="p-4 text-xs font-semibold text-neutral-600 uppercase text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredSuppliers.length > 0 ? (
                            filteredSuppliers.map(supplier => (
                              <tr key={supplier.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedSupplier(supplier)}>
                                <td className="p-4">
                                  <div className="flex items-center">
                                    <span className="font-bold text-gray-900">{supplier.companyName}</span>
                                    {supplier.isPreferred && <Star className="w-4 h-4 text-amber-400 fill-amber-400 ml-2" />}
                                    {!supplier.isActive && <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full font-bold">Inactif</span>}
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center mt-1">
                                    <MapPin className="w-3 h-3 mr-1" /> {supplier.wilaya || 'Non spécifié'}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", getCategoryStyle(supplier.category))}>
                                    {supplier.category}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="text-sm font-medium text-gray-900">{supplier.contactName || '-'}</div>
                                  <div className="text-xs text-gray-500">{supplier.phone || '-'}</div>
                                </td>
                                <td className="p-4">
                                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getContractStatusColor(supplier.contractStatus))}>
                                    {supplier.contractStatus}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star} 
                                        className={cn("w-4 h-4", star <= supplier.rating ? "text-amber-400 fill-amber-400" : "text-gray-200")}
                                      />
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end space-x-2" onClick={e => e.stopPropagation()}>
                                    <button 
                                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                                      onClick={() => {
                                        setEditingSupplier(supplier);
                                        setIsSupplierModalOpen(true);
                                      }}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                      onClick={() => {
                                        setItemToDelete({ type: 'supplier', id: supplier.id });
                                        setIsDeleteModalOpen(true);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-8 text-center">
                                <div className="flex flex-col items-center justify-center">
                                  <Truck className="w-12 h-12 text-gray-300 mb-4" />
                                  <p className="text-gray-500 font-medium">Aucun fournisseur trouvé</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "orders" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Toutes les commandes</h2>
                    <button
                      onClick={() => {
                        setEditingOrder(null);
                        setIsOrderModalOpen(true);
                      }}
                      className="bg-primary-gradient text-white px-4 py-2 rounded-full flex items-center space-x-2 hover:opacity-90 transition-all shadow-md shadow-primary/20 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nouvelle Commande</span>
                    </button>
                  </div>
                  
                  {/* Orders Table */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Fournisseur</th>
                            <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Date</th>
                            <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Montant</th>
                            <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Statut</th>
                            <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Paiement</th>
                            <th className="p-4 text-xs font-semibold text-neutral-600 uppercase">Documents</th>
                            <th className="p-4 text-xs font-semibold text-neutral-600 uppercase text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {orders.length > 0 ? (
                            orders.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()).map(order => {
                              const supplier = suppliers.find(s => s.id === order.supplierId);
                              return (
                                <tr key={order.id} className="hover:bg-gray-50">
                                  <td className="p-4">
                                    <span 
                                      className="font-bold text-primary hover:underline cursor-pointer"
                                      onClick={() => supplier && setSelectedSupplier(supplier)}
                                    >
                                      {supplier?.companyName || 'Fournisseur inconnu'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-sm text-gray-900">{format(new Date(order.orderDate), 'dd MMM yyyy', { locale: fr })}</td>
                                  <td className="p-4 text-sm font-medium text-gray-900">{formatDZD(order.totalAmount)}</td>
                                  <td className="p-4">
                                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getOrderStatusColor(order.status))}>
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getPaymentStatusColor(order.paymentStatus))}>
                                      {order.paymentStatus}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center space-x-2">
                                      {order.invoiceUrl ? (
                                        <a href={order.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark" title="Facture">
                                          <FileText className="w-4 h-4" />
                                        </a>
                                      ) : (
                                        <FileText className="w-4 h-4 text-gray-300" title="Pas de facture" />
                                      )}
                                      {order.contractUrl ? (
                                        <a href={order.contractUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800" title="Contrat">
                                          <FileCheck className="w-4 h-4" />
                                        </a>
                                      ) : (
                                        <FileCheck className="w-4 h-4 text-gray-300" title="Pas de contrat" />
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                      <button 
                                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                                        onClick={() => {
                                          setEditingOrder(order);
                                          setIsOrderModalOpen(true);
                                        }}
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button 
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        onClick={() => {
                                          setItemToDelete({ type: 'order', id: order.id });
                                          setIsDeleteModalOpen(true);
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-8 text-center">
                                <div className="flex flex-col items-center justify-center">
                                  <FileText className="w-12 h-12 text-gray-300 mb-4" />
                                  <p className="text-gray-500 font-medium">Aucune commande trouvée</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "evaluation" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Évaluation & Performance</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dépenses par catégorie */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                        <PieChartIcon className="w-5 h-5 mr-2 text-primary" />
                        Dépenses par catégorie
                      </h3>
                      <div className="h-80">
                        {categoryExpenses.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryExpenses}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {categoryExpenses.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(value: number) => formatDZD(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <PieChartIcon className="w-12 h-12 text-gray-300 mb-4" />
                            <p>Aucune donnée disponible</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Top Fournisseurs */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                        <BarChart2 className="w-5 h-5 mr-2 text-primary" />
                        Top 5 Fournisseurs (Dépenses)
                      </h3>
                      <div className="h-80">
                        {topSuppliers.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topSuppliers} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                              <XAxis type="number" tickFormatter={(value) => `${value / 1000}k`} />
                              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                              <RechartsTooltip formatter={(value: number) => formatDZD(value)} />
                              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <BarChart2 className="w-12 h-12 text-gray-300 mb-4" />
                            <p>Aucune donnée disponible</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "contracts" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Contrats Fournisseurs</h2>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Fournisseur</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Statut du contrat</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Date de début</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Date de fin</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Document</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {suppliers.filter(s => s.contractStatus !== "Aucun").length > 0 ? (
                            suppliers
                              .filter(s => s.contractStatus !== "Aucun")
                              .sort((a, b) => {
                                if (a.contractStatus === "Actif" && b.contractStatus !== "Actif") return -1;
                                if (a.contractStatus !== "Actif" && b.contractStatus === "Actif") return 1;
                                return 0;
                              })
                              .map(supplier => (
                                <tr key={supplier.id} className="hover:bg-gray-50">
                                  <td className="p-4">
                                    <span 
                                      className="font-bold text-primary hover:underline cursor-pointer"
                                      onClick={() => setSelectedSupplier(supplier)}
                                    >
                                      {supplier.companyName}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getContractStatusColor(supplier.contractStatus))}>
                                      {supplier.contractStatus}
                                    </span>
                                  </td>
                                  <td className="p-4 text-sm text-gray-900">
                                    {supplier.contractStartDate ? format(new Date(supplier.contractStartDate), 'dd MMM yyyy', { locale: fr }) : '-'}
                                  </td>
                                  <td className="p-4 text-sm text-gray-900">
                                    {supplier.contractEndDate ? format(new Date(supplier.contractEndDate), 'dd MMM yyyy', { locale: fr }) : '-'}
                                  </td>
                                  <td className="p-4">
                                    {supplier.contractUrl ? (
                                      <a href={supplier.contractUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 flex items-center" title="Voir le contrat">
                                        <FileCheck className="w-4 h-4 mr-1" />
                                        <span className="text-sm">Voir</span>
                                      </a>
                                    ) : (
                                      <span className="text-sm text-gray-400 flex items-center">
                                        <FileCheck className="w-4 h-4 mr-1" />
                                        Non fourni
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-8 text-center">
                                <div className="flex flex-col items-center justify-center">
                                  <FileText className="w-12 h-12 text-gray-300 mb-4" />
                                  <p className="text-gray-500 font-medium">Aucun contrat trouvé</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "staff" && currentUser?.role === "Manager" && (
                <StaffTab />
              )}

              {activeTab === "base_prices" && (
                <BasePricesTab />
              )}
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Confirmer la suppression</h2>
              <p className="text-center text-gray-500 mb-6">
                Êtes-vous sûr de vouloir supprimer {itemToDelete?.type === 'supplier' ? 'ce fournisseur' : 'cette commande'} ? Cette action est irréversible.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 font-medium transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <SupplierModal
          isOpen={isSupplierModalOpen}
          onClose={() => {
            setIsSupplierModalOpen(false);
            setEditingSupplier(null);
          }}
          onSave={(supplier) => {
            if (editingSupplier) {
              updateSupplier(supplier.id, supplier);
            } else {
              addSupplier(supplier);
            }
          }}
          initialData={editingSupplier}
          categories={CATEGORIES}
          wilayas={WILAYAS}
          contractStatuses={CONTRACT_STATUSES}
        />
      )}

      {/* Supplier Order Modal */}
      {isOrderModalOpen && (
        <SupplierOrderModal
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false);
            setEditingOrder(null);
          }}
          onSave={(order) => {
            if (editingOrder) {
              updateSupplierOrder(order.id, order);
            } else {
              addSupplierOrder(order);
            }
          }}
          initialData={editingOrder}
          suppliers={suppliers}
          orderStatuses={ORDER_STATUSES}
          paymentStatuses={PAYMENT_STATUSES}
          paymentTerms={PAYMENT_TERMS}
          preselectedSupplierId={selectedSupplier?.id}
        />
      )}
    </div>
  );
}
