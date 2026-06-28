import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../store/StoreContext";
import { Client, Lead, LeadStage, ServiceType, Task } from "../types";
import { formatDZD, cn } from "../lib/utils";
import { Plus, Phone, Mail, Calendar, MoreVertical, Edit2, CheckSquare, Star, User, Trash2, Globe, TrendingUp, Zap, Activity, Users, X, ArrowRight, Briefcase, Target, DollarSign, Download, Upload, FileSpreadsheet, Filter, ChevronRight, Eye } from "lucide-react";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";
import { subDays, isAfter, parseISO } from "date-fns";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";

const STAGES: LeadStage[] = [
  "Nouveau",
  "Contacté",
  "Démo Planifiée",
  "Devis Envoyé",
  "Négociation",
  "Gagné",
  "Perdu",
];

const ALL_STAGES = [...STAGES, "Autre" as LeadStage];

export default function Leads() {
  const { data, addLead, updateLead, deleteLead, addClient, currentUser, fetchData, searchTarget, setSearchTarget } = useStore();
  const { t, lang } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle search target
  React.useEffect(() => {
    if (searchTarget && searchTarget.type === 'Lead') {
      const lead = data.leads.find(l => l.id === searchTarget.id);
      if (lead) {
        setSelectedLead(lead);
        setSearchTarget(null);
      }
    }
  }, [searchTarget, data.leads, setSearchTarget]);

  const stageTranslationKeys: Record<LeadStage, string> = {
    "Nouveau": "new",
    "Contacté": "contacted",
    "Démo Planifiée": "demoScheduled",
    "Devis Envoyé": "quoteSent",
    "Négociation": "negotiation",
    "Gagné": "won",
    "Perdu": "lost",
  };
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [loggingCallLead, setLoggingCallLead] = useState<Lead | null>(null);
  const [loggingLinkedInLead, setLoggingLinkedInLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  const isManager = currentUser?.role?.toLowerCase() === "manager" || currentUser?.role?.toLowerCase() === "admin";
  const isSMM = currentUser?.role?.toLowerCase() === "social media manager";

  const filteredLeads = useMemo(() => {
    if (isManager) return data.leads;
    return data.leads.filter(l => l.assignedTo === currentUser?.id);
  }, [data.leads, isManager, currentUser?.id]);

  const stats = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const pipelineValue = filteredLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    
    const wonLeads = filteredLeads.filter(l => l.stage === "Gagné").length;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    const thirtyDaysAgo = subDays(new Date(), 30);
    const newLeads = filteredLeads.filter(l => isAfter(parseISO(l.createdAt), thirtyDaysAgo)).length;

    return {
      totalLeads,
      pipelineValue,
      conversionRate,
      newLeads
    };
  }, [filteredLeads]);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    if (isSMM) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = (e: React.DragEvent, stage: LeadStage) => {
    if (isSMM) return;
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
      const lead = data.leads.find(l => l.id === leadId);
      if (stage === "Gagné" && lead && !lead.convertedToClientId) {
        setConvertingLead(lead);
      } else {
        updateLead(leadId, { stage });
      }
    }
  };

  const confirmConversion = () => {
    if (!convertingLead) return;
    
    const newClientId = uuidv4();
    const newClient: Client = {
      id: newClientId,
      companyName: convertingLead.companyName,
      contactPerson: convertingLead.contactName,
      email: convertingLead.email,
      phone: convertingLead.phone,
      sector: t("unspecified"),
      wilaya: t("unspecified"),
      notes: t("convertedFromLead"),
      createdAt: new Date().toISOString(),
      convertedFromLeadId: convertingLead.id,
      assignedTo: convertingLead.assignedTo,
      revenue: convertingLead.estimatedValue,
    };

    addClient(newClient);
    updateLead(convertingLead.id, { stage: "Gagné", convertedToClientId: newClientId });
    
    setConvertingLead(null);
    toast.success(t("successConvert"));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("leads")}</h1>
          <p className="text-neutral-600 mt-1">{t("manageLeadsDescription") || "Gérez vos prospects et suivez leur progression dans le tunnel de vente."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {(isManager || isSMM) && (
            <Button
              onClick={() => setIsImportExportOpen(true)}
              variant="outline"
              size="md"
              className="flex-1 sm:flex-none border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold"
            >
              <FileSpreadsheet className="w-5 h-5 mr-2 text-primary" />
              Import & Export
            </Button>
          )}
          <Button
            onClick={() => {
              setEditingLead(null);
              setIsModalOpen(true);
            }}
            variant="primary"
            size="md"
            className="flex-1 sm:flex-none shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t("newLead")}
          </Button>
        </div>
      </div>

      {/* Pipeline Section */}
      <div className="flex-1 overflow-x-auto custom-scrollbar pb-4">
        <div className="flex space-x-6 min-w-max h-full">
          {ALL_STAGES.map((stage) => {
            const isOther = (stage as string) === "Autre";
            const stageLeads = data.leads.filter((l) => {
              const matchesStage = isOther 
                ? !STAGES.includes(l.stage) 
                : l.stage === stage;
              
              const matchesRole = isManager || isSMM || l.assignedTo === currentUser?.id;
              if (isSMM && !["LinkedIn", "Instagram", "Facebook"].includes(l.source || "")) return false;
              return matchesStage && matchesRole;
            });
            
            return (
              <div
                key={stage}
                className="w-[85vw] md:w-80 bg-neutral-50/50 rounded-xl flex flex-col max-h-full border border-neutral-200 shadow-sm"
                onDrop={(e) => !isOther && handleDrop(e, stage as LeadStage)}
                onDragOver={handleDragOver}
              >
                <div className="p-4 border-b border-neutral-200 flex justify-between items-center rounded-t-xl">
                  <h3 className="font-bold text-neutral-900 text-sm">
                    {isOther ? "Stages Inconnus" : t(stageTranslationKeys[stage as LeadStage])}
                  </h3>
                  <span className="bg-white text-neutral-700 text-[10px] py-0.5 px-2 rounded-full font-bold shadow-sm border border-neutral-100">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                  {stageLeads.length > 0 ? (
                    stageLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => setSelectedLead(lead)}
                        onEdit={!isSMM ? (e) => {
                          e.stopPropagation();
                          setEditingLead(lead);
                          setIsModalOpen(true);
                        } : undefined}
                        onDelete={isManager ? (e) => {
                          e.stopPropagation();
                          deleteLead(lead.id);
                        } : undefined}
                        onLogLinkedIn={!isSMM ? (e) => {
                          e.stopPropagation();
                          setLoggingLinkedInLead(lead);
                        } : undefined}
                      />
                    ))
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-xl opacity-50">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t("noLeads") || "Aucun prospect"}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <NewLeadModal 
          onClose={() => {
            setIsModalOpen(false);
            setEditingLead(null);
          }} 
          onCheckDuplicate={(lead) => {
            if (editingLead) return;
            
            const normalizedPhone = lead.phone?.replace(/\D/g, '');
            const duplicate = data.leads.find(l => {
              const lPhone = l.phone.replace(/\D/g, '');
              const samePhone = normalizedPhone && lPhone && lPhone === normalizedPhone;
              const sameEmail = lead.email && l.email && l.email.toLowerCase().trim() === lead.email.toLowerCase().trim();
              const sameEvent = lead.eventName && l.eventName && l.eventName.toLowerCase().trim() === lead.eventName.toLowerCase().trim();
              const sameCompany = lead.companyName && l.companyName && l.companyName.toLowerCase().trim() === lead.companyName.toLowerCase().trim();
              
              return samePhone || sameEmail || (lead.eventName && sameEvent) || sameCompany;
            });

            if (duplicate) {
              setDuplicateLead(duplicate);
              setIsModalOpen(false);
            }
          }}
          onSave={(lead) => {
            if (editingLead) {
              updateLead(editingLead.id, lead);
            } else {
              // Final duplicate detection logic on save as well
              const normalizedPhone = lead.phone.replace(/\D/g, '');
              const duplicate = data.leads.find(l => {
                const lPhone = l.phone.replace(/\D/g, '');
                const samePhone = normalizedPhone && lPhone && lPhone === normalizedPhone;
                const sameEmail = lead.email && l.email && l.email.toLowerCase().trim() === lead.email.toLowerCase().trim();
                const sameEvent = lead.eventName && l.eventName && l.eventName.toLowerCase().trim() === lead.eventName.toLowerCase().trim();
                const sameCompany = lead.companyName && l.companyName && l.companyName.toLowerCase().trim() === lead.companyName.toLowerCase().trim();
                
                return samePhone || sameEmail || (lead.eventName && sameEvent) || sameCompany;
              });

              if (duplicate) {
                setDuplicateLead(duplicate);
                setIsModalOpen(false);
                return;
              }
              addLead(lead);
            }
          }} 
          initialData={editingLead}
        />
      )}

      {loggingCallLead && (
        <LogCallModal 
          lead={loggingCallLead} 
          onClose={() => setLoggingCallLead(null)} 
        />
      )}

      {loggingLinkedInLead && (
        <LogLinkedInModal 
          lead={loggingLinkedInLead} 
          onClose={() => setLoggingLinkedInLead(null)} 
        />
      )}

      {selectedLead && (
        <LeadDetailsModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          tasks={data.tasks.filter(t => t.relatedToId === selectedLead.id)}
        />
      )}

      {convertingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t("convertLead")}</h2>
            <p className="text-gray-600 mb-6">
              {t("convertConfirm") || "Êtes-vous sûr de vouloir convertir ce prospect en client ? Cette action est irréversible."}
              <br />
              <span className="font-bold">{convertingLead.companyName}</span>
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setConvertingLead(null)}
                variant="ghost"
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={confirmConversion}
                variant="primary"
                className="px-4 py-2 bg-primary-gradient text-white rounded-full hover:opacity-90 shadow-md shadow-primary/20"
              >
                {t("convert")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isImportExportOpen && (
        <ImportExportLeadsModal 
          onClose={() => setIsImportExportOpen(false)} 
        />
      )}
    </div>
  );
}

function ImportExportLeadsModal({ onClose }: { onClose: () => void }) {
  const { data, addLead, bulkAddLeads, currentUser } = useStore();
  const { t } = useTranslation();
  const [exportStage, setExportStage] = useState<LeadStage | "All">("All");
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const leadsToExport = exportStage === "All" 
      ? data.leads 
      : data.leads.filter(l => l.stage === exportStage);

    if (leadsToExport.length === 0) {
      toast.error("Aucun prospect à exporter pour ce filtre.");
      return;
    }

    const exportData = leadsToExport.map(l => ({
      "Entreprise": l.companyName,
      "Contact": l.contactName,
      "Téléphone": l.phone,
      "Email": l.email,
      "Événement": l.eventName || "",
      "Date Événement": l.eventDate || "",
      "Valeur Estimée": l.estimatedValue || 0,
      "Type de Service": l.serviceType || "",
      "Étape": l.stage,
      "Source": l.source || "",
      "Notes": l.notes || "",
      "Score": l.score || 0,
      "Date de Création": new Date(l.createdAt).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths for a better "table-like" look
    const wscols = [
      { wch: 25 }, // Entreprise
      { wch: 20 }, // Contact
      { wch: 15 }, // Téléphone
      { wch: 25 }, // Email
      { wch: 25 }, // Événement
      { wch: 15 }, // Date Événement
      { wch: 15 }, // Valeur Estimée
      { wch: 20 }, // Type de Service
      { wch: 15 }, // Étape
      { wch: 15 }, // Source
      { wch: 30 }, // Notes
      { wch: 10 }, // Score
      { wch: 15 }  // Date de Création
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prospects");
    
    const fileName = `prospects_export_${exportStage.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Exportation réussie !");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws) as any[];

        const leadsToImport: Lead[] = [];
        let duplicateCount = 0;

        jsonData.forEach(row => {
          const companyName = row["Entreprise"] || row["Company"] || row["Nom"];
          const contactName = row["Contact"] || row["Nom Contact"] || "Inconnu";
          const phone = String(row["Téléphone"] || row["Phone"] || "");
          const email = row["Email"] || "";

          if (!companyName) return;

          // Duplicate check
          const normalizedPhone = phone.replace(/\D/g, '');
          const isDuplicate = data.leads.some(l => {
            const lPhone = l.phone.replace(/\D/g, '');
            const samePhone = normalizedPhone && lPhone && lPhone === normalizedPhone;
            const sameEmail = email && l.email && l.email.toLowerCase().trim() === email.toLowerCase().trim();
            const sameCompany = companyName && l.companyName && l.companyName.toLowerCase().trim() === companyName.toLowerCase().trim();
            return samePhone || sameEmail || sameCompany;
          });

          if (isDuplicate) {
            duplicateCount++;
            return;
          }

          const newLead: Lead = {
            id: uuidv4(),
            companyName,
            contactName,
            phone,
            email,
            eventName: row["Événement"] || row["Event"] || "",
            eventDate: row["Date Événement"] || row["Event Date"] || new Date().toISOString(),
            estimatedValue: Number(row["Valeur Estimée"] || row["Value"] || 0),
            serviceType: (row["Type de Service"] || "Plateforme uniquement") as ServiceType,
            stage: (row["Étape"] || "Nouveau") as LeadStage,
            source: (row["Source"] || "Direct") as any,
            notes: row["Notes"] || "",
            score: Number(row["Score"] || 0),
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.id,
            assignedTo: currentUser?.id
          };

          leadsToImport.push(newLead);
        });

        if (leadsToImport.length > 0) {
          await bulkAddLeads(leadsToImport);
          toast.success(`${leadsToImport.length} prospects importés.${duplicateCount > 0 ? ` (${duplicateCount} doublons ignorés)` : ""}`);
        } else {
          toast.info("Aucun nouveau prospect à importer.");
        }
        onClose();
      } catch (err) {
        console.error("Import error:", err);
        toast.error("Erreur lors de l'importation du fichier.");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-0 w-full max-w-2xl shadow-2xl overflow-hidden border border-neutral-200">
        <div className="bg-primary-gradient p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Import / Export de Prospects</h2>
              <p className="text-white/80 text-xs font-medium uppercase tracking-widest mt-0.5">Gestion des données Excel/CSV</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Export Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Download className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-bold text-neutral-900 uppercase tracking-wider text-xs">Exporter les données</h3>
            </div>
            
            <div className="space-y-4 bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
              <div>
                <Label className="text-[10px] font-black uppercase text-neutral-400 mb-2 block">Filtrer par étape</Label>
                <Select 
                  value={exportStage} 
                  onChange={(e) => setExportStage(e.target.value as any)}
                  className="bg-white"
                >
                  <option value="All">Tous les prospects</option>
                  {STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <Button 
                onClick={handleExport}
                className="w-full bg-primary hover:bg-primary text-white font-bold py-3 rounded-full shadow-lg shadow-primary/20 transition-all"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger Excel
              </Button>
            </div>
            <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
              L'exportation générera un fichier .xlsx contenant toutes les informations détaillées des prospects sélectionnés.
            </p>
          </div>

          {/* Import Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Upload className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-bold text-neutral-900 uppercase tracking-wider text-xs">Importer des prospects</h3>
            </div>

            <div className="space-y-4 bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="lead-upload"
                  disabled={importing}
                />
                <label
                  htmlFor="lead-upload"
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
                    importing ? "bg-neutral-100 border-neutral-200" : "bg-white border-neutral-200 hover:border-green-500 hover:bg-green-50/30"
                  )}
                >
                  {importing ? (
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-2" />
                      <span className="text-xs font-bold text-neutral-500 uppercase">Importation...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                      <span className="text-xs font-bold text-neutral-500 uppercase">Choisir un fichier</span>
                      <span className="text-[10px] text-neutral-400 mt-1">Excel or CSV</span>
                    </>
                  )}
                </label>
              </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <div className="flex items-start space-x-2">
                <Filter className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  <strong>Note:</strong> Assurez-vous que votre fichier contient les colonnes "Entreprise", "Contact", "Téléphone" et "Email". Les doublons seront automatiquement ignorés.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex justify-end">
          <Button
            onClick={onClose}
            variant="ghost"
            className="px-6 py-2 text-neutral-500 font-bold hover:bg-neutral-100 rounded-full"
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}

interface LeadNote {
  id: string;
  text: string;
  createdAt: string;
  createdBy: string;
}

const LeadCard: React.FC<{
  lead: Lead;
  onDragStart: (e: React.DragEvent) => void;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onLogLinkedIn?: (e: React.MouseEvent) => void;
  onWhatsApp?: (e: React.MouseEvent) => void;
}> = ({ lead, onDragStart, onClick, onEdit, onDelete, onLogLinkedIn, onWhatsApp }) => {
  const { data } = useStore();
  const { t, lang } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const creator = (data.team || []).find(m => m.id === (lead.createdBy || lead.assignedTo));

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={() => setIsExpanded(!isExpanded)}
      className={cn(
        "group bg-white border border-neutral-200 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-primary transition-all relative overflow-hidden",
        isExpanded && "border-primary/30"
      )}
    >
      {/* Top Section: Company Name & Value (Always visible) */}
      <div className={cn(
        "flex justify-between gap-2",
        isExpanded ? "items-start" : "items-center"
      )}>
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-bold text-neutral-900 leading-tight transition-all",
            isExpanded ? "text-sm mb-1" : "text-xs truncate"
          )} title={lead.companyName}>
            {lead.companyName}
          </h4>
          {!isExpanded && lead.eventName && (
            <p className="text-[9px] font-bold text-neutral-400 truncate">
              {lead.eventName}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          {!isExpanded && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className="h-7 w-7 text-neutral-400 hover:text-primary hover:bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"
              title={t("viewDetails") || "Voir détails"}
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="p-1 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all"
            title={t("viewDetails") || "Voir détails"}
          >
            <ChevronRight className={cn(
              "w-4 h-4 transition-transform duration-200",
              isExpanded && "rotate-90 text-primary"
            )} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 12 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {lead.eventName && (
              <div className="flex items-center space-x-1.5 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                <p className="text-[10px] font-bold text-neutral-400 truncate">
                  {lead.eventName}
                </p>
              </div>
            )}

            {/* Subtitle: Contact Name */}
            <div className="flex items-center space-x-2 mb-4 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                <User className="w-3 h-3 text-neutral-400" />
              </div>
              <p className="text-xs font-bold text-neutral-600 truncate">{lead.contactName}</p>
            </div>
            
            {/* Contact Info Grid */}
            <div className="grid grid-cols-1 gap-2 text-[10px] text-neutral-500 mb-5">
              <div className="flex items-center space-x-2.5 bg-neutral-50/50 p-1.5 rounded-xl border border-neutral-100/50">
                <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                <span className="font-medium truncate">{lead.phone}</span>
              </div>
              <div className="flex items-center space-x-2.5 bg-neutral-50/50 p-1.5 rounded-xl border border-neutral-100/50">
                <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                <span className="font-medium truncate">{lead.email}</span>
              </div>
            </div>

            {/* Footer: Tags & Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
              <div className="flex items-center space-x-3">
                {creator ? (
                  creator.avatar ? (
                    <img 
                      src={creator.avatar} 
                      alt={creator.name}
                      className="w-7 h-7 rounded-full object-cover border border-white/20 shadow-soft"
                      title={`${t("addedBy")}: ${creator.name}`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div 
                      className="w-7 h-7 rounded-full bg-primary-gradient flex items-center justify-center text-[10px] font-black text-white shadow-soft border border-white/20" 
                      title={`${t("addedBy")}: ${creator.name}`}
                    >
                      {creator.name.charAt(0)}
                    </div>
                  )
                ) : (
                  <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200" title={t("unassigned")}>
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                )}
                
                <div className="flex gap-1.5">
                  {lead.website && (
                    <a 
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 bg-neutral-100 text-neutral-600 hover:text-primary hover:bg-primary/10 rounded-xl transition-all shadow-sm"
                      title={`${t("website")}: ${lead.website}`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <span className="text-[9px] font-black px-2 py-1 bg-neutral-100 text-neutral-600 rounded-xl uppercase tracking-widest border border-neutral-200 shadow-sm">
                    {lead.serviceType.split(' ')[0]}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onClick(); }}
                  className="text-primary hover:bg-primary/5 border border-transparent hover:border-primary/10"
                  title={t("viewDetails") || "Voir détails"}
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                {onLogLinkedIn && lead.source === "LinkedIn" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onLogLinkedIn(e); }}
                    className="text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20"
                    title={t("logLinkedIn")}
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </Button>
                )}
                {onEdit && (
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onEdit(e); }}
                    className="text-neutral-400 hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20"
                    title={t("edit")}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                )}
                {onDelete && (
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onDelete(e); }}
                    className="text-neutral-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100"
                    title={t("delete")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
    blue: "bg-primary/10 text-primary",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
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
    <div className="bg-white border border-neutral-200 rounded-xl p-5 transition-all duration-300 group relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div 
            className={cn("p-4 transition-transform duration-500 group-hover:scale-110 shadow-sm", colors[color])}
            style={cookieMaskStyle}
          >
            {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
          </div>
          {trend && (
            <div className="flex items-center space-x-1 bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-[10px] font-bold text-success">{trend}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-xl font-bold text-neutral-900 tracking-tight">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function NewLeadModal({
  onClose,
  onSave,
  initialData,
  onCheckDuplicate
}: {
  onClose: () => void;
  onSave: (lead: Lead) => void;
  initialData: Lead | null;
  onCheckDuplicate?: (lead: Partial<Lead>) => void;
}) {
  const { data, currentUser } = useStore();
  const { t } = useTranslation();
  const isManager = currentUser?.role === "Manager";
  const isSMM = currentUser?.role === "Social Media Manager";
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Lead>>(
    initialData || {
      stage: "Nouveau",
      serviceType: "Plateforme uniquement",
      source: isSMM ? "LinkedIn" : "Direct",
      website: "",
      eventName: "",
      assignedTo: currentUser?.id,
      rc: "",
      nif: "",
      nis: "",
      art: "",
      rib: "",
      bankName: "",
      additionalEmails: [],
    }
  );

  const [newEmail, setNewEmail] = useState("");

  // Real-time duplicate check
  React.useEffect(() => {
    if (initialData || !onCheckDuplicate) return;

    const timer = setTimeout(() => {
      const hasEnoughInfo = 
        (formData.companyName && formData.companyName.length > 3) || 
        (formData.phone && formData.phone.length > 5) || 
        (formData.email && formData.email.includes('@') && formData.email.length > 5) ||
        (formData.eventName && formData.eventName.length > 3);

      if (hasEnoughInfo) {
        onCheckDuplicate(formData);
      }
    }, 800); // Debounce to avoid annoying popups while typing

    return () => clearTimeout(timer);
  }, [formData.companyName, formData.phone, formData.email, formData.eventName, initialData, onCheckDuplicate]);

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
      createdBy: initialData?.createdBy || currentUser?.id,
    } as Lead);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-visible">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {initialData ? t("editLead") : t("newLead")}
            </h2>
            <p className="text-sm text-neutral-600 mt-1">Remplissez les informations pour {initialData ? 'modifier' : 'créer'} un prospect.</p>
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
          <form id="lead-form" onSubmit={handleSubmit} className="space-y-8 pb-4">
            {step === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">{t("companyInformation")}</h3>
                  <div>
                    <Label>{t("company")}</Label>
                    <Input
                      required
                      type="text"
                      value={formData.companyName || ""}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder={t("companyNamePlaceholder")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("website")}</Label>
                      <Input
                        type="url"
                        value={formData.website || ""}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder={t("websitePlaceholder")}
                      />
                    </div>
                    <div>
                      <Label>{t("eventName")}</Label>
                      <Input
                        type="text"
                        value={formData.eventName || ""}
                        onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                        placeholder={t("eventNamePlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t("serviceType")}</Label>
                    <Select
                      icon={<Briefcase />}
                      value={formData.serviceType || "Plateforme uniquement"}
                      onChange={(e) =>
                        setFormData({ ...formData, serviceType: e.target.value as ServiceType })
                      }
                    >
                      <option value="Plateforme uniquement">{t("platformOnly")}</option>
                      <option value="Opérations sur site">{t("onsiteOperations")}</option>
                      <option value="Package complet">{t("fullPackage")}</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">{t("contactPrincipal")}</h3>
                  <div>
                    <Label>{t("contact")}</Label>
                    <Input
                      required
                      type="text"
                      value={formData.contactName || ""}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder={t("contactNamePlaceholder")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("phone")}</Label>
                      <Input
                        required
                        type="tel"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={t("phonePlaceholder")}
                      />
                    </div>
                    <div>
                      <Label>{t("email")}</Label>
                      <Input
                        required
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t("emailPlaceholder")}
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
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">{t("financialDetailsAndDate")}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("eventDate")}</Label>
                      <div className="relative">
                        <Input
                          required
                          type="date"
                          className="pr-10"
                          value={formData.eventDate || ""}
                          onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <Label>{t("estimatedValue")}</Label>
                      <div className="relative">
                        <Input
                          required
                          type="number"
                          value={formData.estimatedValue || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, estimatedValue: Number(e.target.value) })
                          }
                          placeholder={t("estimatedValuePlaceholder")}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold uppercase">DZD</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("leadSource")}</Label>
                      <Select
                        value={formData.source || "Direct"}
                        onChange={(e) =>
                          setFormData({ ...formData, source: e.target.value as any })
                        }
                        disabled={isSMM}
                      >
                        {!isSMM && <option value="Direct">{t("direct")}</option>}
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        {!isSMM && <option value="Google">Google</option>}
                        {!isSMM && <option value="Cold Email">{t("coldEmail")}</option>}
                        {!isSMM && <option value="Referral">{t("referral")}</option>}
                        {!isSMM && <option value="Salon">{t("exhibition")}</option>}
                        {!isSMM && <option value="Other">{t("other")}</option>}
                      </Select>
                    </div>
                    <div>
                      <Label>{t("leadScore")}</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.score || ""}
                        onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                        placeholder={t("leadScorePlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t("assignedTo")}</Label>
                    <Select
                      value={formData.assignedTo || ""}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      disabled={!isManager}
                    >
                      <option value="">{t("unassigned")}</option>
                      {(data.team || []).map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>{t("notes")}</Label>
                    <Textarea
                      rows={3}
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={t("initialNotesPlaceholder")}
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
                      <Label>ART</Label>
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
                        value={formData.bankName || ""}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        placeholder={t("bankNamePlaceholder")}
                      />
                    </div>
                    <div>
                      <Label>RIB</Label>
                      <Input
                        type="text"
                        value={formData.rib || ""}
                        onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
                        placeholder={t("ribPlaceholder")}
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
              form="lead-form"
              type="submit"
              variant="primary"
              size="md"
              className="px-8 shadow-lg shadow-primary/20"
            >
              {step === 1 ? t("next") : (initialData ? t("save") : t("create"))}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogCallModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { logInteraction } = useStore();
  const { t } = useTranslation();
  const [outcome, setOutcome] = useState<any>("Reached");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await logInteraction({
      leadId: lead.id,
      type: "Phone Call",
      outcome,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">{t("logCall")}</h2>
          <Button 
            variant="ghost"
            size="icon"
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("callOutcome")}</Label>
            <Select
              required
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              <option value="Reached">{t("reached")}</option>
              <option value="No Answer">{t("noAnswer")}</option>
              <option value="Busy">{t("busy")}</option>
              <option value="Wrong Number">{t("wrongNumber")}</option>
              <option value="Not Interested">{t("notInterested")}</option>
              <option value="Interested">{t("interested")}</option>
              <option value="Meeting Scheduled">{t("meetingScheduled")}</option>
            </Select>
          </div>
          <div>
            <Label>{t("notes")}</Label>
            <Textarea
              required
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Détails de l'appel..."
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-4 py-2 bg-primary-gradient text-white rounded-full hover:opacity-90 shadow-md shadow-primary/20"
            >
              {t("saveCall")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeadDetailsModal({ lead, onClose, tasks }: { lead: Lead; onClose: () => void; tasks: Task[] }) {
  const { updateLead, currentUser } = useStore();
  const { t, lang } = useTranslation();
  const [newNote, setNewNote] = useState("");

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const note: LeadNote = {
      id: Math.random().toString(36).substr(2, 9),
      text: newNote,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || "Système"
    };

    updateLead(lead.id, {
      notesHistory: [note, ...(lead.notesHistory || [])]
    });
    setNewNote("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{lead.companyName}</h2>
            <p className="text-sm text-neutral-600">{lead.contactName}</p>
          </div>
          <Button 
            variant="ghost"
            size="icon"
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-[10px] font-bold text-neutral-700 uppercase mb-1">{t("estimatedValue")}</p>
              <p className="text-sm font-bold text-primary">{formatDZD(lead.estimatedValue)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-[10px] font-bold text-neutral-700 uppercase mb-1">{t("source")}</p>
              <p className="text-sm font-bold text-neutral-900">{lead.source}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-[10px] font-bold text-neutral-700 uppercase mb-1">{t("stage")}</p>
              <p className="text-sm font-bold text-neutral-900">{lead.stage}</p>
            </div>
          </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <Phone className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-700">{lead.phone}</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <Mail className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-700">{lead.email}</span>
              </div>
            </div>

          {lead.additionalEmails && lead.additionalEmails.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">{t("additionalEmails") || "Emails supplémentaires"}</h3>
              <div className="flex flex-wrap gap-2">
                {lead.additionalEmails.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                    <Mail className="w-3 h-3 text-neutral-500" />
                    <span className="text-xs text-neutral-700">{email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lead.notes && (
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">{t("notes")}</h3>
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">{t("notesHistory") || "Historique des notes"}</h3>
            <div className="flex space-x-2 mb-4">
              <Input
                type="text"
                placeholder={t("addNotePlaceholder") || "Ajouter une note..."}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="flex-1"
              />
              <Button onClick={handleAddNote} variant="primary" className="bg-primary-gradient text-white">
                {t("add")}
              </Button>
            </div>
            <div className="space-y-3">
              {lead.notesHistory?.map((note) => (
                <div key={note.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-primary">{note.createdBy}</span>
                    <span className="text-[10px] text-gray-400">{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-700">{note.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">{t("associatedTasks")}</h3>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <CheckSquare className={cn("w-4 h-4", task.completed ? "text-success" : "text-neutral-500")} />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{task.title}</p>
                      <p className="text-[10px] text-neutral-500">{new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", task.completed ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
                    {task.completed ? t("completed") : t("inProgress")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button onClick={onClose} variant="ghost" className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full">
            {t("close")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LogLinkedInModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { logInteraction } = useStore();
  const { t } = useTranslation();
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await logInteraction({
      leadId: lead.id,
      type: "LinkedIn Message",
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">{t("logLinkedInMessage")}</h2>
          <Button 
            variant="ghost"
            size="icon"
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("messageNotes")}</Label>
            <Textarea
              required
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Détails du message..."
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-4 py-2 bg-[#0077B5] text-white rounded-full hover:opacity-90 shadow-md shadow-primary/20"
            >
              {t("saveMessage")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DuplicateLeadModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { data } = useStore();
  const { t } = useTranslation();
  const assignedMember = (data.team || []).find(m => m.id === lead.assignedTo);

  const getRecommendation = (stage: LeadStage) => {
    switch (stage) {
      case "Gagné":
        return {
          note: "Ce prospect est déjà un client gagné. Ne pas appeler sauf pour un suivi client spécifique.",
          call: false,
          color: "text-success bg-success/10 border-success/20"
        };
      case "Perdu":
        return {
          note: "Ce prospect a été marqué comme perdu. Vérifiez les raisons de l'échec dans l'historique avant toute nouvelle tentative.",
          call: false,
          color: "text-red-600 bg-red-50 border-red-100"
        };
      case "Négociation":
      case "Devis Envoyé":
        return {
          note: "Une négociation est en cours ou un devis a déjà été envoyé. Ne pas appeler pour éviter de perturber le processus de vente actuel.",
          call: false,
          color: "text-warning bg-warning/10 border-warning/20"
        };
      case "Démo Planifiée":
        return {
          note: "Une démonstration est déjà planifiée. Vérifiez la date et les détails avant de prendre contact.",
          call: false,
          color: "text-orange-600 bg-orange-50 border-orange-100"
        };
      case "Contacté":
        return {
          note: "Ce prospect a déjà été contacté. Vérifiez les dernières notes d'interaction pour voir si un rappel est nécessaire.",
          call: true,
          color: "text-primary bg-primary/10 border-primary/20"
        };
      default:
        return {
          note: "Ce prospect existe déjà dans le système. Vérifiez s'il est déjà pris en charge par un autre agent.",
          call: true,
          color: "text-gray-600 bg-gray-50 border-gray-100"
        };
    }
  };

  const recommendation = getRecommendation(lead.stage);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-0 w-full max-w-lg shadow-2xl overflow-hidden border border-neutral-200">
        <div className="bg-amber-50 p-6 border-b border-amber-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tight">Prospect Déjà Existant</h2>
            <p className="text-amber-700 text-sm font-medium opacity-80">Un doublon a été détecté dans la base de données.</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">{lead.companyName}</h3>
                <p className="text-sm text-neutral-500 font-medium">{lead.contactName}</p>
              </div>
              <div className="px-3 py-1 bg-white rounded-xl border border-neutral-200 shadow-sm">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{lead.stage}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center space-x-2 text-xs text-neutral-600">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-bold">{lead.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-neutral-600">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-bold truncate">{lead.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-neutral-600">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-bold">{assignedMember?.name || "Non assigné"}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-neutral-600">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-bold">{new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className={cn("p-5 rounded-2xl border flex items-start space-x-4", recommendation.color)}>
            <Activity className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-1">Situation & Recommandation</h4>
              <p className="text-sm font-medium leading-relaxed">{recommendation.note}</p>
              <div className="mt-3 flex items-center space-x-2">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", recommendation.call ? "bg-success" : "bg-red-500")} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {recommendation.call ? "Appel suggéré" : "Ne pas appeler"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex justify-end">
          <Button
            onClick={onClose}
            variant="primary"
            className="px-8 py-3 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200 font-bold"
          >
            Compris, fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
