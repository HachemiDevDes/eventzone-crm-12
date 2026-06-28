import React, { useState, useRef, useMemo } from "react";
import { useStore } from "../store/StoreContext";
import { Client } from "../types";
import { formatDZD, cn } from "../lib/utils";
import { Plus, Search, MapPin, Phone, Mail, Building2, Users as UsersIcon, CheckSquare, Edit2, X, Paperclip, FileText, Download, Trash2, ChevronLeft, ChevronRight, Users, TrendingUp, Calendar, Zap, Activity } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useTranslation } from "../hooks/useTranslation";
import { WILAYAS } from "../constants";
import { subDays, isAfter, parseISO } from "date-fns";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";

export default function Clients() {
  const { data, addClient, updateClient, deleteClient, currentUser, uploadFile, deleteDocument, searchTarget, setSearchTarget } = useStore();
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Handle search target
  React.useEffect(() => {
    if (searchTarget && searchTarget.type === 'Client') {
      const client = data.clients.find(c => c.id === searchTarget.id);
      if (client) {
        setSelectedClient(client);
        setSearchTarget(null);
      }
    }
  }, [searchTarget, data.clients, setSearchTarget]);

  const isManager = currentUser?.role === "Manager";

  const filteredClients = useMemo(() => {
    return data.clients.filter(
      (c) => {
        const matchesSearch = c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.wilaya.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (isManager) return matchesSearch;
        return matchesSearch && c.assignedTo === currentUser?.id;
      }
    );
  }, [data.clients, searchTerm, isManager, currentUser?.id]);

  // Statistics calculations
  const stats = useMemo(() => {
    const totalClients = filteredClients.length;
    
    const totalRevenue = filteredClients.reduce((sum, client) => {
      const clientEvents = data.events.filter((e) => e.clientId === client.id);
      const calculatedRevenue = clientEvents.reduce((eventSum, e) => {
        const offer = data.offers.find(
          (o) => o.relatedToType === "Client" && o.relatedToId === client.id && o.eventName === e.eventName
        );
        return eventSum + (offer ? offer.price : 0);
      }, 0);
      return sum + (client.revenue !== undefined ? client.revenue : calculatedRevenue);
    }, 0);

    const thirtyDaysAgo = subDays(new Date(), 30);
    const newClients = filteredClients.filter(c => isAfter(parseISO(c.createdAt), thirtyDaysAgo)).length;

    const today = new Date();
    const activeEvents = data.events.filter(e => {
      const isUpcoming = isAfter(parseISO(e.date), today);
      if (!isUpcoming) return false;
      const client = data.clients.find(c => c.id === e.clientId);
      if (!client) return false;
      if (!isManager && client.assignedTo !== currentUser?.id) return false;
      return true;
    }).length;

    return {
      totalClients,
      totalRevenue,
      newClients,
      activeEvents
    };
  }, [filteredClients, data.events, data.offers, data.clients, isManager, currentUser?.id]);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("clientsTitle")}</h1>
          <p className="text-neutral-600 mt-1">{t("manageClientsDescription") || "Gérez votre base de clients et suivez leurs performances."}</p>
        </div>
        <Button
          onClick={() => {
            setEditingClient(null);
            setIsModalOpen(true);
          }}
          variant="primary"
          size="md"
          className="w-full sm:w-auto shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t("newClient")}
        </Button>
      </div>

      <div className="card-standard overflow-hidden flex-1 flex flex-col !p-0">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/30 flex items-center space-x-4">
          <div className="relative flex-1 max-w-xs group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder={t("searchClientPlaceholder")}
              className="pl-10 h-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-neutral-50/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-3 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                  {t("company")}
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                  {t("contact")}
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                  {t("location")}
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                  {t("events")}
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                  {t("totalRevenue")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredClients.map((client) => {
                const clientEvents = data.events.filter((e) => e.clientId === client.id);
                const calculatedRevenue = clientEvents.reduce((sum, e) => {
                  const offer = data.offers.find(
                    (o) => o.relatedToType === "Client" && o.relatedToId === client.id && o.eventName === e.eventName
                  );
                  return sum + (offer ? offer.price : 0);
                }, 0);
                const revenue = client.revenue !== undefined ? client.revenue : calculatedRevenue;

                return (
                  <tr
                    key={client.id}
                    className="hover:bg-primary/5 cursor-pointer transition-all group"
                    onClick={() => setSelectedClient(client)}
                  >
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-white border border-neutral-100 rounded-xl flex items-center justify-center shadow-sm group-hover:border-primary/20 transition-all">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-bold text-neutral-800 group-hover:text-primary transition-colors">
                              {client.companyName}
                            </div>
                            {client.convertedFromLeadId && (
                              <span className="px-1.5 py-0.5 bg-success/10 text-success text-[8px] font-bold rounded-full tracking-wide border border-success/20 uppercase">
                                {t("convertedBadge")}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-tight mt-0.5">{client.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-xs font-bold text-neutral-800">{client.contactPerson}</div>
                      <div className="text-[10px] font-medium text-neutral-500 mt-0.5">{client.email}</div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center text-[11px] font-bold text-neutral-600">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary opacity-60" />
                        {client.wilaya}
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="inline-flex items-center px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-bold rounded-xl border border-neutral-200">
                        {clientEvents.length}
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">{formatDZD(revenue)}</span>
                        {isManager && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirmDeleteId === client.id) {
                                deleteClient(client.id);
                              } else {
                                setConfirmDeleteId(client.id);
                                setTimeout(() => setConfirmDeleteId(null), 3000);
                              }
                            }}
                            className={cn(
                              "ml-4 h-8 w-8 p-0 transition-all",
                              confirmDeleteId === client.id 
                                ? "bg-danger text-white hover:bg-danger/90 shadow-lg shadow-danger/20 opacity-100" 
                                : "text-neutral-300 hover:text-danger hover:bg-danger/5 opacity-0 group-hover:opacity-100"
                            )}
                            title={t("delete")}
                          >
                            {confirmDeleteId === client.id ? <span className="text-[9px] font-bold px-1">{t("confirm")}</span> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
            <div className="p-20 text-center">
              <div className="inline-flex p-8 bg-neutral-50 rounded-xl mb-6">
                <Search className="w-12 h-12 text-neutral-200" />
              </div>
              <p className="text-neutral-400 font-bold text-lg">{t("noClientsFound")}</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <NewClientModal 
          onClose={() => {
            setIsModalOpen(false);
            setEditingClient(null);
          }} 
          onSave={(client) => {
            if (editingClient) {
              updateClient(editingClient.id, client);
            } else {
              addClient(client);
            }
          }} 
          initialData={editingClient}
        />
      )}

      {selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEdit={() => {
            setEditingClient(selectedClient);
            setSelectedClient(null);
            setIsModalOpen(true);
          }}
          tasks={data.tasks.filter(t => t.relatedToId === selectedClient.id)}
          isManager={isManager}
          deleteClient={deleteClient}
        />
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  color = "blue"
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  color?: "blue" | "green" | "purple" | "orange";
}) {
  const colors = {
    blue: "bg-primary-light text-primary",
    green: "bg-success/10 text-success",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-warning/10 text-warning",
  };

  const cookieMaskStyle = {
    maskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50,0 C61,0 67,2 73,8 C79,14 86,21 92,27 C98,33 100,39 100,50 C100,61 98,67 92,73 C86,79 79,86 73,92 C67,98 61,100 50,100 C39,100 33,98 27,92 C21,86 14,79 8,73 C2,67 0,61 0,50 C0,39 2,33 8,27 C14,21 21,14 27,8 C33,2 39,0 50,0 Z'/%3E%3C/svg%3E")`,
    maskSize: 'contain',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50,0 C61,0 67,2 73,8 C79,14 86,21 92,27 C98,33 100,39 100,50 C100,61 98,67 92,73 C86,79 79,86 73,92 C67,98 61,100 50,100 C39,100 33,98 27,92 C21,86 14,79 8,73 C2,67 0,61 0,50 C0,39 2,33 8,27 C14,21 21,14 27,8 C33,2 39,0 50,0 Z'/%3E%3C/svg%3E")`,
    WebkitMaskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center'
  };

  return (
    <div className="card-standard group relative overflow-hidden !p-6">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div 
            className={cn("p-4 transition-transform duration-300 group-hover:scale-110", colors[color])}
            style={cookieMaskStyle}
          >
            {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
          </div>
          {trend && (
            <div className="flex items-center space-x-1 bg-success/10 border border-success/20 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-[10px] font-semibold text-success uppercase tracking-wide">{trend}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-1">{title}</p>
          <h3 className="text-2xl font-semibold text-neutral-900">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function NewClientModal({
  onClose,
  onSave,
  initialData,
}: {
  onClose: () => void;
  onSave: (client: Client) => void;
  initialData?: Client | null;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Client>>(initialData || { 
    documents: [],
    rc: "",
    nif: "",
    nis: "",
    art: "",
    rib: "",
    bankName: "",
    address: "",
    additionalEmails: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const [newEmail, setNewEmail] = useState("");

  const handleAddEmail = () => {
    if (!newEmail) return;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setFormData({
        ...formData,
        additionalEmails: [...(formData.additionalEmails || []), newEmail]
      });
      setNewEmail("");
    } else {
      toast.error("Format d'email invalide");
    }
  };

  const handleRemoveEmail = (index: number) => {
    const updatedEmails = [...(formData.additionalEmails || [])];
    updatedEmails.splice(index, 1);
    setFormData({ ...formData, additionalEmails: updatedEmails });
  };

  const [isUploading, setIsUploading] = useState(false);
  const { uploadFile } = useStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const publicUrl = await uploadFile(file);
      setIsUploading(false);

      if (publicUrl) {
        const newDoc = {
          id: uuidv4(),
          name: file.name,
          url: publicUrl,
          type: file.type || "application/octet-stream",
          size: file.size,
          createdAt: new Date().toISOString()
        };
        setFormData({
          ...formData,
          documents: [...(formData.documents || []), newDoc]
        });
      }
    }
  };

  const removeDocument = (id: string) => {
    setFormData({
      ...formData,
      documents: (formData.documents || []).filter(d => d.id !== id)
    });
  };

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
    } as Client);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-visible shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {initialData ? t("editClient") : t("newClient")}
            </h2>
            <p className="text-sm text-neutral-600 mt-1">Remplissez les informations pour {initialData ? 'modifier' : 'créer'} un client.</p>
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
          <span className="text-xs text-neutral-700 font-bold uppercase tracking-widest">Étape {step} / 2</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-4">
          <form id="client-form" onSubmit={handleSubmit} className="space-y-8 pb-4">
            {step === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">Informations Entreprise</h3>
                  <div>
                    <Label>{t("company")}</Label>
                    <Input
                      required
                      type="text"
                      placeholder="Nom de l'entreprise"
                      value={formData.companyName || ""}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("sector")}</Label>
                      <Input
                        required
                        type="text"
                        placeholder="Ex: Technologie"
                        value={formData.sector || ""}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{t("wilaya")}</Label>
                      <Select
                        required
                        value={formData.wilaya || ""}
                        onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                      >
                        <option value="">Sélectionner</option>
                        {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>{t("revenueDZD")}</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={formData.revenue || ""}
                        onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold uppercase">DZD</span>
                    </div>
                  </div>

                  <div>
                    <Label>{t("notes")}</Label>
                    <Textarea
                      rows={3}
                      placeholder="Informations complémentaires..."
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">{t("contactPrincipal")}</h3>
                  <div>
                    <Label>{t("contactPerson")}</Label>
                    <Input
                      required
                      type="text"
                      placeholder={t("contactPersonPlaceholder")}
                      value={formData.contactPerson || ""}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("phone")}</Label>
                      <Input
                        required
                        type="tel"
                        placeholder={t("phonePlaceholder")}
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{t("email")}</Label>
                      <Input
                        required
                        type="email"
                        placeholder={t("emailPlaceholder")}
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="mb-1">{t("additionalEmails")}</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="email"
                        placeholder={t("addEmailPlaceholder")}
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEmail();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddEmail}
                        className="px-4 shrink-0"
                      >
                        {t("add")}
                      </Button>
                    </div>
                    {formData.additionalEmails && formData.additionalEmails.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.additionalEmails.map((email, index) => (
                          <div key={index} className="inline-flex items-center px-3 py-1 rounded bg-gray-50 text-gray-600 border border-gray-200 text-[10px] font-bold">
                            {email}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveEmail(index)}
                              className="ml-2 h-4 w-4 text-gray-400 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="mb-1">{t("attachedDocuments")}</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {(formData.documents || []).map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-gray-700 truncate">{doc.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDocument(doc.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-6 border-2 border-dashed border-gray-100 rounded-full text-xs font-bold text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 flex flex-col items-center justify-center space-y-2 transition-all disabled:opacity-50"
                    >
                      <Paperclip className="w-5 h-5" />
                      <span>{isUploading ? t("uploading") : t("addDocument")}</span>
                    </Button>
                    <Input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">{t("location")}</h3>
                  <div>
                    <Label>{t("companyAddress")}</Label>
                    <Textarea
                      rows={3}
                      placeholder={t("companyAddressPlaceholder")}
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">{t("fiscalInformation")}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>RC</Label>
                      <Input
                        type="text"
                        value={formData.rc || ""}
                        onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                        placeholder={t("rcPlaceholder")}
                      />
                    </div>
                    <div>
                      <Label>NIF</Label>
                      <Input
                        type="text"
                        value={formData.nif || ""}
                        onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                        placeholder={t("nifPlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>NIS</Label>
                      <Input
                        type="text"
                        value={formData.nis || ""}
                        onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                        placeholder={t("nisPlaceholder")}
                      />
                    </div>
                    <div>
                      <Label>{t("art_label")}</Label>
                      <Input
                        type="text"
                        value={formData.art || ""}
                        onChange={(e) => setFormData({ ...formData, art: e.target.value })}
                        placeholder={t("artPlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("bank_name")}</Label>
                      <Input
                        type="text"
                        placeholder={t("bankNamePlaceholder")}
                        value={formData.bankName || ""}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>RIB</Label>
                      <Input
                        type="text"
                        placeholder={t("ribPlaceholder")}
                        value={formData.rib || ""}
                        onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
                      />
                    </div>
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
              form="client-form"
              type="submit"
              variant="primary"
              size="md"
              className="px-8 shadow-lg shadow-primary/20"
            >
              {step === 1 ? t("next") : (initialData ? t("save") : t("createClient"))}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientDetailsModal({ 
  client, 
  onClose, 
  onEdit, 
  tasks, 
  isManager, 
  deleteClient 
}: { 
  client: Client; 
  onClose: () => void; 
  onEdit: () => void; 
  tasks: any[]; 
  isManager: boolean; 
  deleteClient: (id: string) => void 
}) {
  const { data, deleteDocument, updateClient, currentUser } = useStore();
  const { t, lang } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note = {
      id: uuidv4(),
      text: newNote.trim(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || "Unknown"
    };
    const updatedClient = {
      ...client,
      notesHistory: [...(client.notesHistory || []), note]
    };
    updateClient(updatedClient);
    setNewNote("");
  };
  const clientEvents = data.events.filter((e) => e.clientId === client.id);
  const clientOffers = data.offers.filter((o) => o.relatedToType === "Client" && o.relatedToId === client.id);

  const handleDownload = async (url: string, fileName: string) => {
    console.log('Attempting download:', { url, fileName });
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error, falling back to new tab:', error);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Clean Header */}
        <div className="p-6 border-b flex justify-between items-center bg-white">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-gray-900">{client.companyName}</h2>
                {client.convertedFromLeadId && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full border border-primary/20">
                    {t("convertedBadge")}
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-600">{client.sector} • {client.wilaya}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isManager && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirmDelete) {
                    deleteClient(client.id);
                    onClose();
                  } else {
                    setConfirmDelete(true);
                    setTimeout(() => setConfirmDelete(false), 3000);
                  }
                }}
                className={cn(
                  "rounded-full transition-all h-9 px-3",
                  confirmDelete ? 'bg-danger text-white' : 'hover:bg-danger/10 text-danger'
                )}
              >
                {confirmDelete ? <span className="text-xs font-semibold">{t("confirm")}</span> : <Trash2 className="w-4 h-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-9 w-9 p-0 hover:bg-gray-100 text-gray-600 rounded-full"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0 hover:bg-gray-100 text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-neutral-50/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Info Cards */}
            <div className="lg:col-span-4 space-y-6">
              {/* Contact Card */}
              <div className="card-standard space-y-6">
                <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide flex items-center">
                  <UsersIcon className="w-4 h-4 mr-2 text-primary" />
                  {t("contact")}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-neutral-50 rounded-xl group hover:bg-primary/5 transition-colors">
                    <div className="p-3 bg-white rounded-xl shadow-sm mr-4 group-hover:text-primary transition-colors">
                      <UsersIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">Responsable</p>
                      <p className="text-sm font-medium text-neutral-800">{client.contactPerson}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-neutral-50 rounded-xl group hover:bg-primary/5 transition-colors">
                    <div className="p-3 bg-white rounded-xl shadow-sm mr-4 group-hover:text-primary transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">Téléphone</p>
                      <p className="text-sm font-medium text-neutral-800">{client.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start p-4 bg-neutral-50 rounded-xl group hover:bg-primary/5 transition-colors">
                    <div className="p-3 bg-white rounded-xl shadow-sm mr-4 mt-1 group-hover:text-primary transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">Email</p>
                      <p className="text-sm font-medium text-neutral-800 truncate">{client.email}</p>
                      {client.additionalEmails && client.additionalEmails.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {client.additionalEmails.map((email, idx) => (
                            <p key={idx} className="text-xs font-medium text-neutral-600 truncate">{email}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Info Card (Optional) */}
              {(client.rc || client.nif || client.bankName) && (
                <div className="card-standard space-y-6">
                  <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-primary" />
                    Détails Financiers
                  </h3>
                  <div className="space-y-3">
                    {client.rc && (
                      <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                        <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">RC</span>
                        <span className="text-xs font-medium text-neutral-800">{client.rc}</span>
                      </div>
                    )}
                    {client.nif && (
                      <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                        <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">NIF</span>
                        <span className="text-xs font-medium text-neutral-800">{client.nif}</span>
                      </div>
                    )}
                    {client.bankName && (
                      <div className="pt-3">
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide mb-2">Banque & RIB</p>
                        <p className="text-xs font-medium text-neutral-800">{client.bankName}</p>
                        <p className="text-[10px] font-mono font-semibold text-primary mt-2 tracking-wide bg-primary-light/30 p-2 rounded-lg">{client.rib}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documents Card */}
              <div className="card-standard space-y-6">
                <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide flex items-center">
                  <Paperclip className="w-4 h-4 mr-2 text-primary" />
                  {t("documents")}
                </h3>
                {(client.documents || []).length > 0 ? (
                  <div className="space-y-3">
                    {client.documents?.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl group/doc hover:bg-primary/5 transition-all">
                        <div className="flex items-center space-x-4 overflow-hidden">
                          <div className="p-3 bg-white rounded-xl shadow-sm group-hover/doc:text-primary transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-medium text-neutral-700 truncate">{doc.name}</p>
                            <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide mt-1">
                              {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : t("unknownSize")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc.url, doc.name)}
                            className="h-9 w-9 p-0 text-neutral-400 hover:text-primary hover:bg-white rounded-full transition-all"
                            title={t("download")}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirmDeleteDocId === doc.id) {
                                deleteDocument(doc.id);
                                setConfirmDeleteDocId(null);
                              } else {
                                setConfirmDeleteDocId(doc.id);
                                setTimeout(() => setConfirmDeleteDocId(null), 3000);
                              }
                            }}
                            className={cn(
                              "h-9 px-2 rounded-full transition-all",
                              confirmDeleteDocId === doc.id 
                                ? "bg-danger text-white hover:bg-danger/90" 
                                : "text-neutral-400 hover:text-danger hover:bg-white"
                            )}
                            title={t("delete")}
                          >
                            {confirmDeleteDocId === doc.id ? <span className="text-[8px] font-semibold uppercase tracking-wide">{t("confirm")}</span> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 font-medium text-center py-6 italic bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-100">{t("noDocuments")}</p>
                )}
              </div>
            </div>

            {/* Right Column: Activity & History */}
            <div className="lg:col-span-8 space-y-8">
              {/* Notes Section */}
              <div className="card-standard !p-8">
                <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-6 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-primary" />
                  {t("notes")} (Originales)
                </h3>
                <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100/50 mb-8">
                  <p className="text-sm text-neutral-600 font-medium leading-relaxed whitespace-pre-wrap italic">
                    {client.notes || t("noNotesClient")}
                  </p>
                </div>

                <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-6 flex items-center">
                  <CheckSquare className="w-4 h-4 mr-2 text-primary" />
                  Historique des notes
                </h3>
                
                <div className="space-y-4 mb-8">
                  {client.notesHistory && client.notesHistory.length > 0 ? (
                    client.notesHistory.map((note) => (
                      <div key={note.id} className="bg-neutral-50 border border-neutral-100/50 p-6 rounded-2xl group hover:border-primary/20 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-semibold text-neutral-800 bg-white px-3 py-1 rounded-lg shadow-sm">{note.createdBy}</span>
                          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                            {new Date(note.createdAt).toLocaleString(lang === 'fr' ? 'fr-DZ' : 'en-US')}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 font-medium leading-relaxed whitespace-pre-wrap">{note.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-400 font-semibold italic text-center py-8 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-100">Aucune note pour le moment.</p>
                  )}
                </div>

                <div className="flex space-x-4">
                  <Input
                    type="text"
                    placeholder="Ajouter une nouvelle note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNote();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>

              {/* Tasks Section */}
              <div className="card-standard !p-8">
                <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-6 flex items-center">
                  <CheckSquare className="w-4 h-4 mr-2 text-primary" />
                  {t("associatedTasks")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <div key={task.id} className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100/50 flex justify-between items-start group hover:border-primary/20 transition-all">
                        <div>
                          <h4 className="font-semibold text-neutral-800 group-hover:text-primary transition-colors">{task.title}</h4>
                          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mt-3 flex items-center">
                            <Calendar className="w-3 h-3 mr-1.5" />
                            {t("dueDate")}: {new Date(task.dueDate).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full border shadow-sm ${
                          task.completed ? 'bg-success/10 text-success border-success/20' :
                          'bg-warning/10 text-warning border-warning/20'
                        }`}>
                          {task.completed ? t("completed") : t("inProgress")}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-100">
                      <p className="text-sm text-neutral-400 font-bold uppercase tracking-wider">{t("noAssociatedTasksClient")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Events History */}
              <div className="card-standard !p-8">
                <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-6 flex items-center">
                  <UsersIcon className="w-4 h-4 mr-2 text-primary" />
                  {t("eventsHistory")}
                </h3>
                {clientEvents.length > 0 ? (
                  <div className="overflow-hidden rounded-2xl border border-neutral-100/50">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-neutral-50/50">
                        <tr>
                          <th className="px-6 py-5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">{t("date")}</th>
                          <th className="px-6 py-5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">{t("event")}</th>
                          <th className="px-6 py-5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">{t("attendees")}</th>
                          <th className="px-6 py-5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">{t("satisfaction")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {clientEvents.map((event) => (
                          <tr key={event.id} className="hover:bg-primary/5 transition-colors group">
                            <td className="px-6 py-5 text-xs font-medium text-neutral-500">{new Date(event.date).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}</td>
                            <td className="px-6 py-5 text-sm font-semibold text-neutral-800 group-hover:text-primary transition-colors">{event.eventName}</td>
                            <td className="px-6 py-5 text-xs font-medium text-neutral-600">{event.attendees}</td>
                            <td className="px-6 py-5">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-sm font-semibold text-primary">{event.satisfactionRating}</span>
                                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">/ 5</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-100">
                    <p className="text-sm text-neutral-400 font-bold uppercase tracking-wider">{t("noEventsRecorded")}</p>
                  </div>
                )}
              </div>

              {/* Quotes & Offers */}
              <div className="card-standard !p-8">
                <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-6 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-primary" />
                  {t("quotesAndOffers")}
                </h3>
                {clientOffers.length > 0 ? (
                  <div className="overflow-hidden rounded-2xl border border-neutral-100/50">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-neutral-50/50">
                        <tr>
                          <th className="px-6 py-5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">{t("eventDate")}</th>
                          <th className="px-6 py-5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">{t("event")}</th>
                          <th className="px-6 py-5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">{t("price")}</th>
                          <th className="px-6 py-5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">{t("status")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {clientOffers.map((offer) => (
                          <tr key={offer.id} className="hover:bg-primary/5 transition-colors group">
                            <td className="px-6 py-5 text-xs font-medium text-neutral-500">{new Date(offer.eventDate).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}</td>
                            <td className="px-6 py-5 text-sm font-semibold text-neutral-800 group-hover:text-primary transition-colors">{offer.eventName}</td>
                            <td className="px-6 py-5 text-sm font-semibold text-primary">{formatDZD(offer.price)}</td>
                            <td className="px-6 py-5">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border shadow-sm ${
                                offer.status === "Accepté" ? "bg-success/10 text-success border-success/20" :
                                offer.status === "Rejeté" ? "bg-danger/10 text-danger border-danger/20" :
                                "bg-warning/10 text-warning border-warning/20"
                              }`}>
                                {offer.status === "Accepté" ? t("accepted") :
                                 offer.status === "Rejeté" ? t("rejected") :
                                 offer.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-100">
                    <p className="text-sm text-neutral-400 font-bold uppercase tracking-wider">{t("noQuotesRecorded")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


