import React, { useState } from "react";
import { Trophy, Clock, Target, Zap, CheckCircle2, Info, HelpCircle, Globe, ExternalLink, Plus, Trash2, Edit2, X, Search, Briefcase, Share2 } from "lucide-react";
import { useStore } from "../store/StoreContext";
import { v4 as uuidv4 } from "uuid";
import { SourcingWebsite } from "../types";
import { useTranslation } from "../hooks/useTranslation";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";

export default function Instructions() {
  const { data, currentUser, addSourcingWebsite, updateSourcingWebsite, deleteSourcingWebsite } = useStore();
  const { t } = useTranslation();
  const isManager = currentUser?.role === "Manager";
  const isSMM = currentUser?.role === "Social Media Manager";
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<SourcingWebsite | null>(null);
  const [formData, setFormData] = useState<Partial<SourcingWebsite>>({
    name: "",
    url: "",
    description: "",
    category: "Annuaire"
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWebsite) {
      await updateSourcingWebsite(editingWebsite.id, formData);
    } else {
      await addSourcingWebsite({
        ...formData,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      } as SourcingWebsite);
    }
    setIsModalOpen(false);
    setEditingWebsite(null);
    setFormData({ name: "", url: "", description: "", category: t("directory") });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-primary-gradient rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center text-white">
          <HelpCircle className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3 text-white" />
          {t("crmGuideTitle")}
        </h1>
        <p className="opacity-90 text-white">
          {t("crmGuideSubtitle")}
        </p>
      </div>

      {isSMM ? (
        <>
          {/* SMM Instructions */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Globe className="w-6 h-6 mr-2 text-primary" />
                {t("socialMediaManagement")}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{t("socialMediaManagementSubtitle")}</p>
            </div>
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center text-sm uppercase tracking-wider">
                    <Search className="w-4 h-4 mr-2 text-primary" />
                    {t("contentStrategy")}
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-primary/10/30 rounded-xl border border-primary/20/50">
                      <p className="text-sm font-bold text-primary-dark mb-1">{t("linkedinB2B")}</p>
                      <p className="text-xs text-primary leading-relaxed">
                        {t("linkedinB2BDesc")}
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10/30 rounded-xl border border-primary/20/50">
                      <p className="text-sm font-bold text-primary-dark mb-1">{t("instagramMetaVisual")}</p>
                      <p className="text-xs text-primary leading-relaxed">
                        {t("instagramMetaVisualDesc")}
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10/30 rounded-xl border border-primary/20/50">
                      <p className="text-sm font-bold text-primary-dark mb-1">{t("tiktokEngagement")}</p>
                      <p className="text-xs text-primary leading-relaxed">
                        {t("tiktokEngagementDesc")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center text-sm uppercase tracking-wider">
                    <Target className="w-4 h-4 mr-2 text-primary" />
                    {t("keyObjectives")}
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{t("publicationCalendar")}</span>
                    </li>
                    <li className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{t("generateQualifiedLeads")}</span>
                    </li>
                    <li className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{t("increaseEngagement")}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Points System Section for SMM */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-amber-500" />
                {t("performanceSystem")} (SMM)
              </h2>
              <p className="text-sm text-gray-500 mt-1">{t("performanceSystemSubtitle")}</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center text-sm uppercase tracking-wider">
                    <Target className="w-4 h-4 mr-2 text-primary" />
                    {t("creationAndManagement")}
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center p-3 bg-primary/10/50 rounded-lg border border-primary/20">
                      <span className="text-sm text-gray-700">{t("createNewPost")}</span>
                      <span className="font-bold text-primary">+5 pts</span>
                    </li>
                    <li className="flex justify-between items-center p-3 bg-primary/10/50 rounded-lg border border-primary/20">
                      <span className="text-sm text-gray-700">{t("launchNewCampaign")}</span>
                      <span className="font-bold text-primary">+15 pts</span>
                    </li>
                    <li className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <span className="text-sm text-gray-700 font-medium">{t("generateLeadViaSocial")}</span>
                      <span className="font-bold text-emerald-600">+20 pts</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center text-sm uppercase tracking-wider">
                    <Clock className="w-4 h-4 mr-2 text-amber-500" />
                    {t("punctuality")}
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                      <span className="text-sm text-gray-700">{t("checkInOnTime")}</span>
                      <span className="font-bold text-amber-600">+10 pts</span>
                    </li>
                    <li className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                      <span className="text-sm text-gray-700">{t("checkInLate")}</span>
                      <span className="font-bold text-red-600">-10 pts</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Platform Usage Section for SMM */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500" />
                {t("smmBestPractices")}
              </h2>
              <ul className="space-y-4 text-sm text-gray-600">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3 mt-0.5 font-bold text-[10px]">1</div>
                  <p><strong>{t("planning")}</strong> {t("planningDesc")}</p>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3 mt-0.5 font-bold text-[10px]">2</div>
                  <p><strong>{t("kpiTracking")}</strong> {t("kpiTrackingDesc")}</p>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3 mt-0.5 font-bold text-[10px]">3</div>
                  <p><strong>{t("ideaBox")} :</strong> {t("ideaBoxDesc")}</p>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-primary" />
                {t("helpAndSupport")}
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {t("supportDescription")}
                </p>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">{t("contactManager")}</p>
                  <p className="text-sm font-bold text-gray-900">Mohamed Hachemi</p>
                  <p className="text-xs text-gray-500">contact@eventzone.pro</p>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Leads Sourcing Section */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Globe className="w-6 h-6 mr-2 text-primary" />
                  {t("sourcingWebsites")}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{t("sourcingWebsitesSubtitle")}</p>
              </div>
              {isManager && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-bold hover:bg-primary/20 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t("addWebsite")}
                </button>
              )}
            </div>

            <div className="p-6 space-y-8">
              {/* Sourcing Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center text-sm uppercase tracking-wider">
                    <Search className="w-4 h-4 mr-2 text-primary" />
                    {t("howToFindLeads")}
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-primary/10/30 rounded-xl border border-primary/20/50">
                      <p className="text-sm font-bold text-primary-dark mb-1">{t("searchBySector")}</p>
                      <p className="text-xs text-primary leading-relaxed">
                        {t("searchBySectorDesc")}
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10/30 rounded-xl border border-primary/20/50">
                      <p className="text-sm font-bold text-primary-dark mb-1">{t("linkedinSalesNavigator")}</p>
                      <p className="text-xs text-primary leading-relaxed">
                        {t("linkedinSalesNavigatorDesc")}
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10/30 rounded-xl border border-primary/20/50">
                      <p className="text-sm font-bold text-primary-dark mb-1">{t("eventMonitoring")}</p>
                      <p className="text-xs text-primary leading-relaxed">
                        {t("eventMonitoringDesc")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center text-sm uppercase tracking-wider">
                    <Globe className="w-4 h-4 mr-2 text-primary" />
                    Sites de Sourcing
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {(() => {
                      const uniqueWebsites = (data.sourcingWebsites || []).reduce((acc: typeof data.sourcingWebsites, current) => {
                        const isDuplicate = acc.some(
                          (item) => item.name.toLowerCase() === current.name.toLowerCase() ||
                                    item.url.toLowerCase() === current.url.toLowerCase() ||
                                    item.id === current.id
                        );
                        if (!isDuplicate) {
                          acc.push(current);
                        }
                        return acc;
                      }, []);

                      return uniqueWebsites.length > 0 ? (
                        uniqueWebsites.map((site) => (
                          <div key={site.id} className="group p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary/20 transition-all">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-tighter">
                                  {site.category}
                                </span>
                                <h4 className="font-bold text-gray-900">{site.name}</h4>
                              </div>
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isManager && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingWebsite(site);
                                        setFormData(site);
                                        setIsModalOpen(true);
                                      }}
                                      className="p-1 text-gray-400 hover:text-primary rounded-full"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => deleteSourcingWebsite(site.id)}
                                      className="p-1 text-gray-400 hover:text-red-600 rounded-full"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                <a
                                  href={site.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-gray-400 hover:text-primary rounded"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{site.description}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                          <p className="text-sm text-gray-400 italic">{t("noWebsitesFound")}</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Points System Section */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-amber-500" />
                {t("performanceSystem")}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{t("performanceSystemSubtitle")}</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Core Sales */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center text-sm uppercase tracking-wider">
                    <Target className="w-4 h-4 mr-2 text-primary" />
                    {t("salesAndPipeline")}
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center p-3 bg-primary/10/50 rounded-lg border border-primary/20">
                      <span className="text-sm text-gray-700">{t("addNewLead")}</span>
                      <span className="font-bold text-primary">+5 pts</span>
                    </li>
                    <li className="flex justify-between items-center p-3 bg-primary/10/50 rounded-lg border border-primary/20">
                      <span className="text-sm text-gray-700">{t("qualifyLead")}</span>
                      <span className="font-bold text-primary">+10 pts</span>
                    </li>
                    <li className="flex justify-between items-center p-3 bg-primary/10/50 rounded-lg border border-primary/20">
                      <span className="text-sm text-gray-700">{t("sendQuote")}</span>
                      <span className="font-bold text-primary">+10 pts</span>
                    </li>
                    <li className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <span className="text-sm text-gray-700 font-medium">{t("convertLeadToClient")}</span>
                      <span className="font-bold text-emerald-600">+30 pts</span>
                    </li>
                  </ul>
                </div>

                {/* Punctuality */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center text-sm uppercase tracking-wider">
                    <Clock className="w-4 h-4 mr-2 text-amber-500" />
                    {t("punctuality")}
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                      <span className="text-sm text-gray-700">{t("checkInOnTime")}</span>
                      <span className="font-bold text-amber-600">+10 pts</span>
                    </li>
                    <li className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                      <span className="text-sm text-gray-700">{t("checkInLate")}</span>
                      <span className="font-bold text-red-600">-10 pts</span>
                    </li>
                    <li className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <span className="text-sm text-gray-700">{t("overtime15min")}</span>
                      <span className="font-bold text-purple-600">+15 pts</span>
                    </li>
                    <li className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <span className="text-sm text-gray-700">{t("overtime1hour")}</span>
                      <span className="font-bold text-purple-600">+50 pts</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Special Challenges */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                  {t("specialChallenges")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                    <p className="font-bold text-amber-900 text-sm">{t("firstClientOfMonth")}</p>
                    <p className="text-2xl font-black text-amber-600">+100 pts</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-primary/20">
                    <p className="font-bold text-primary-dark text-sm">{t("threeClientsInOneWeek")}</p>
                    <p className="text-2xl font-black text-primary">+150 pts</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Platform Usage Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500" />
                {t("bestPractices")}
              </h2>
              <ul className="space-y-4 text-sm text-gray-600">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3 mt-0.5 font-bold text-[10px]">1</div>
                  <p><strong>{t("checkInArrival")}</strong> {t("checkInArrivalDesc")}</p>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3 mt-0.5 font-bold text-[10px]">2</div>
                  <p><strong>{t("updateLeads")}</strong> {t("updateLeadsDesc")}</p>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3 mt-0.5 font-bold text-[10px]">3</div>
                  <p><strong>{t("logCalls")}</strong> {t("logCallsDesc")}</p>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3 mt-0.5 font-bold text-[10px]">4</div>
                  <p><strong>{t("checkTasks")}</strong> {t("checkTasksDesc")}</p>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-primary" />
                {t("helpAndSupport")}
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {t("supportDescription")}
                </p>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">{t("contactManager")}</p>
                  <p className="text-sm font-bold text-gray-900">Mohamed Hachemi</p>
                  <p className="text-xs text-gray-500">contact@eventzone.pro</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingWebsite ? t("edit") : t("addWebsite")}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>{t("websiteName")}</Label>
                <Input
                  required
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: LinkedIn"
                />
              </div>
              <div>
                <Label>{t("websiteUrl")}</Label>
                <Input
                  required
                  type="url"
                  value={formData.url || ""}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>{t("category")}</Label>
                <Select
                  value={formData.category || t("directory")}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Annuaire">{t("directory")}</option>
                  <option value="Réseau Social">{t("socialNetwork")}</option>
                  <option value="Actualités">{t("news")}</option>
                  <option value="Autre">{t("other")}</option>
                </Select>
              </div>
              <div>
                <Label>{t("description")}</Label>
                <Textarea
                  rows={3}
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  {editingWebsite ? t("save") : t("add")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
