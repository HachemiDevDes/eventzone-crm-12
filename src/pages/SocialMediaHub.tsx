import React, { useState } from "react";
import { useStore } from "../store/StoreContext";
import { useTranslation } from "../hooks/useTranslation";
import { Calendar as CalendarIcon, Target, PieChart as PieChartIcon, ListTodo, Plus, Edit2, Trash2, Linkedin, Instagram, Facebook, X, PenTool } from "lucide-react";
import { SocialPost, Campaign, ContentIdea, SocialPlatform, PostStatus, ContentIdeaStatus, Priority } from "../types";
import { formatDZD, cn } from "../lib/utils";
import { v4 as uuidv4 } from "uuid";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import SocialStudio from "./SocialStudio";

export default function SocialMediaHub() {
  const { t } = useTranslation();
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<"calendar" | "campaigns" | "sources" | "ideas" | "studio">("calendar");

  const isManager = currentUser?.role === "Manager";
  const isSMM = currentUser?.role === "Social Media Manager";

  if (!isManager && !isSMM) {
    return <div className="p-8 text-center text-gray-500">{t("unauthorizedAccess")}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("socialStudio")}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <TabButton active={activeTab === "calendar"} onClick={() => setActiveTab("calendar")} icon={<CalendarIcon className="w-4 h-4" />} label={t("contentCalendar")} />
          <TabButton active={activeTab === "campaigns"} onClick={() => setActiveTab("campaigns")} icon={<Target className="w-4 h-4" />} label={t("campaignTracker")} />
          <TabButton active={activeTab === "sources"} onClick={() => setActiveTab("sources")} icon={<PieChartIcon className="w-4 h-4" />} label={t("leadSources")} />
          <TabButton active={activeTab === "ideas"} onClick={() => setActiveTab("ideas")} icon={<ListTodo className="w-4 h-4" />} label={t("ideaBox")} />
          <TabButton active={activeTab === "studio"} onClick={() => setActiveTab("studio")} icon={<PenTool className="w-4 h-4" />} label={t("socialStudio")} />
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {activeTab === "calendar" && <ContentCalendarTab />}
          {activeTab === "campaigns" && <CampaignTrackerTab />}
          {activeTab === "sources" && <LeadSourcesTab />}
          {activeTab === "ideas" && <ContentIdeasTab />}
          {activeTab === "studio" && <SocialStudio />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
        active ? "border-primary text-primary bg-primary/10/50" : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-gray-50"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function PlatformIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  if (platform === "LinkedIn") return <Linkedin className={cn("text-[#0077b5]", className)} />;
  if (platform === "Instagram") return <Instagram className={cn("text-[#E1306C]", className)} />;
  if (platform === "Facebook") return <Facebook className={cn("text-[#1877F2]", className)} />;
  return null;
}

function ContentCalendarTab() {
  const { t, lang } = useTranslation();
  const { data, addSocialPost, updateSocialPost, deleteSocialPost, currentUser } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handleSave = async (postData: Partial<SocialPost>) => {
    try {
      if (editingPost) {
        await updateSocialPost(editingPost.id, postData);
        toast.success(t("postUpdated"));
      } else {
        await addSocialPost({
          ...postData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.id || "",
        } as SocialPost);
        toast.success(t("postCreated"));
      }
      setIsModalOpen(false);
      setEditingPost(null);
    } catch (error: any) {
      toast.error(error.message || t("saveError"));
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm.id) {
      try {
        await deleteSocialPost(deleteConfirm.id);
        toast.success(t("postDeleted"));
        setIsModalOpen(false);
        setEditingPost(null);
      } catch (error: any) {
        toast.error(error.message || t("deleteError"));
      }
    }
    setDeleteConfirm({ open: false, id: null });
  };

  const handleDragStart = (e: React.DragEvent, postId: string) => {
    e.dataTransfer.setData("postId", postId);
  };

  const handleDrop = async (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData("postId");
    if (postId) {
      const post = data.socialPosts.find(p => p.id === postId);
      if (post) {
        try {
          // Keep the original time, just change the date
          const originalDate = new Date(post.scheduledDate);
          const newDate = new Date(day);
          newDate.setHours(originalDate.getHours());
          newDate.setMinutes(originalDate.getMinutes());
          newDate.setSeconds(originalDate.getSeconds());
          
          await updateSocialPost(postId, { scheduledDate: newDate.toISOString() });
          toast.success(t("postMoved"));
        } catch (error: any) {
          toast.error(error.message || t("moveError"));
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-900 capitalize">{format(currentDate, "MMMM yyyy", { locale: lang === "fr" ? fr : undefined })}</h2>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-gray-200 rounded-full">&lt;</Button>
            <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full">{t("today")}</Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-gray-200 rounded-full">&gt;</Button>
          </div>
        </div>
        <Button onClick={() => { setEditingPost(null); setIsModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-primary transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          <span>{t("newPost")}</span>
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {[t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat"), t("sun")].map((day) => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[120px]">
          {days.map((day, dayIdx) => {
            const dayPosts = data.socialPosts.filter(p => isSameDay(parseISO(p.scheduledDate), day));
            return (
              <div 
                key={day.toString()} 
                className={cn("border-b border-r border-gray-100 p-2 overflow-y-auto", !isSameMonth(day, monthStart) && "bg-gray-50 text-gray-400", isSameDay(day, new Date()) && "bg-primary/10/30")}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
              >
                <div className={cn("text-xs font-medium mb-1", isSameDay(day, new Date()) ? "text-primary font-bold" : "text-neutral-500")}>
                  {format(day, dateFormat)}
                </div>
                <div className="space-y-1">
                  {dayPosts.map(post => (
                    <div 
                      key={post.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, post.id)}
                      onClick={() => { setEditingPost(post); setIsModalOpen(true); }} 
                      className="text-xs p-1.5 rounded bg-white border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary transition-colors flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <PlatformIcon platform={post.platform} className="w-3 h-3" />
                        <span className={cn("w-2 h-2 rounded-full", post.status === "Draft" ? "bg-gray-400" : post.status === "Scheduled" ? "bg-primary" : "bg-emerald-500")} title={post.status} />
                      </div>
                      <div className="truncate text-gray-700">{post.caption.substring(0, 30)}{post.caption.length > 30 ? "..." : ""}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && <PostModal post={editingPost} onClose={() => setIsModalOpen(false)} onSave={handleSave} onDelete={editingPost ? () => handleDelete(editingPost.id) : undefined} />}

      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t("confirmDelete")}</h3>
            <p className="text-gray-600 mb-6">
              {t("confirmDeleteDescription")}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm({ open: false, id: null })}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 font-medium"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostModal({ post, onClose, onSave, onDelete }: { post: SocialPost | null; onClose: () => void; onSave: (data: Partial<SocialPost>) => void; onDelete?: () => void }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<SocialPost>>(post || {
    platform: "LinkedIn",
    caption: "",
    status: "Draft",
    scheduledDate: new Date().toISOString().slice(0, 16),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{post ? t("editPost") : t("newPost")}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></Button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <Label className="mb-1">{t("platform")}</Label>
            <Select value={formData.platform ?? "LinkedIn"} onChange={e => setFormData({ ...formData, platform: e.target.value as SocialPlatform })}>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
            </Select>
          </div>
          <div>
            <Label className="mb-1">{t("caption")}</Label>
            <Textarea required rows={4} value={formData.caption ?? ""} onChange={e => setFormData({ ...formData, caption: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1">{t("scheduledDate")}</Label>
            <Input type="datetime-local" required value={formData.scheduledDate?.slice(0, 16) ?? ""} onChange={e => setFormData({ ...formData, scheduledDate: new Date(e.target.value).toISOString() })} />
          </div>
          <div>
            <Label className="mb-1">{t("status")}</Label>
            <Select value={formData.status ?? "Draft"} onChange={e => setFormData({ ...formData, status: e.target.value as PostStatus })}>
              <option value="Draft">{t("draft")}</option>
              <option value="Scheduled">{t("scheduled")}</option>
              <option value="Published">{t("published")}</option>
            </Select>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          {onDelete ? (
            <Button variant="ghost" onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
              <Trash2 className="w-5 h-5" />
            </Button>
          ) : (
            <div></div>
          )}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full">{t("cancel")}</Button>
            <Button onClick={() => onSave(formData)} className="px-6 py-2 text-sm font-bold bg-primary text-white rounded-full hover:bg-primary">{t("save")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignTrackerTab() {
  const { t, lang } = useTranslation();
  const { data, addCampaign, updateCampaign, deleteCampaign, currentUser } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const totalBudget = data.campaigns.reduce((sum, c) => sum + c.budgetDZD, 0);
  const totalLeads = data.campaigns.reduce((sum, c) => sum + c.leadsGenerated, 0);
  const avgCpl = totalLeads > 0 ? totalBudget / totalLeads : 0;

  const handleSave = async (campaignData: Partial<Campaign>) => {
    try {
      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, campaignData);
        toast.success(t("campaignUpdated"));
      } else {
        await addCampaign({
          ...campaignData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.id || "",
        } as Campaign);
        toast.success(t("campaignCreated"));
      }
      setIsModalOpen(false);
      setEditingCampaign(null);
    } catch (error: any) {
      toast.error(error.message || t("saveError"));
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm.id) {
      try {
        await deleteCampaign(deleteConfirm.id);
        toast.success(t("campaignDeleted"));
      } catch (error: any) {
        toast.error(error.message || t("deleteError"));
      }
    }
    setDeleteConfirm({ open: false, id: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">{t("campaignTracker")}</h2>
        <button onClick={() => { setEditingCampaign(null); setIsModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-primary transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          <span>{t("newCampaign")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">{t("budgetSpent")}</div>
          <div className="text-2xl font-bold text-gray-900">{formatDZD(totalBudget)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">{t("totalLeadsGenerated")}</div>
          <div className="text-2xl font-bold text-gray-900">{totalLeads}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">{t("avgCpl")}</div>
          <div className="text-2xl font-bold text-gray-900">{formatDZD(avgCpl)}</div>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("name")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("status")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("platform")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("budget")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("leads")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("cpl")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("dates")}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.campaigns.length > 0 ? (
              data.campaigns.map((campaign) => {
                const cpl = campaign.leadsGenerated > 0 ? campaign.budgetDZD / campaign.leadsGenerated : 0;
                return (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campaign.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                          campaign.status === "Terminée" ? "bg-green-100 text-green-800" :
                          campaign.status === "En cours" ? "bg-primary/10 text-primary-dark" :
                          campaign.status === "Annulée" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        )}>
                          {campaign.status === "Terminée" ? t("completed") :
                           campaign.status === "En cours" ? t("inProgress") :
                           campaign.status === "Annulée" ? t("cancelled") :
                           campaign.status === "Planifiée" ? t("scheduled") : campaign.status}
                        </span>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                      <PlatformIcon platform={campaign.platform} className="w-4 h-4" />
                      {campaign.platform}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{formatDZD(campaign.budgetDZD)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{campaign.leadsGenerated}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{campaign.leadsGenerated > 0 ? formatDZD(cpl) : "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(parseISO(campaign.startDate), "dd MMM yyyy", { locale: lang === "fr" ? fr : undefined })} - {format(parseISO(campaign.endDate), "dd MMM yyyy", { locale: lang === "fr" ? fr : undefined })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => { setEditingCampaign(campaign); setIsModalOpen(true); }} className="text-gray-400 hover:text-primary mr-3"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(campaign.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Target className="w-12 h-12 text-gray-300 mb-3" />
                    <p>{t("noCampaigns")}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && <CampaignModal campaign={editingCampaign} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}

      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t("confirmDelete")}</h3>
            <p className="text-gray-600 mb-6">
              {t("confirmDeleteDescription")}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm({ open: false, id: null })}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 font-medium"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignModal({ campaign, onClose, onSave }: { campaign: Campaign | null; onClose: () => void; onSave: (data: Partial<Campaign>) => void }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Campaign>>(campaign || {
    name: "",
    status: "Planifiée",
    platform: "LinkedIn",
    contentType: "",
    budgetDZD: 0,
    paidAdsCost: 0,
    contentCreationCost: 0,
    otherCosts: 0,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    targetLeads: 0,
    targetClicks: 0,
    actualClicks: 0,
    leadsGenerated: 0,
    notes: "",
    url: "",
  });

  // Calculations
  const start = new Date(formData.startDate || "");
  const end = new Date(formData.endDate || "");
  const duration = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
  const durationDays = duration > 0 ? duration : 0;

  const totalBudget = formData.budgetDZD || 0;
  const targetLeads = formData.targetLeads || 0;
  const targetCpl = targetLeads > 0 ? totalBudget / targetLeads : 0;

  const actualLeads = formData.leadsGenerated || 0;
  const actualCpl = actualLeads > 0 ? totalBudget / actualLeads : 0;

  const actualClicks = formData.actualClicks || 0;
  const actualConversionRate = actualClicks > 0 ? (actualLeads / actualClicks) * 100 : 0;

  const paidAds = formData.paidAdsCost || 0;
  const contentCreation = formData.contentCreationCost || 0;
  const otherCosts = formData.otherCosts || 0;
  const budgetRemaining = totalBudget - (paidAds + contentCreation + otherCosts);

  const isResultsEditable = formData.status === "Terminée";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{campaign ? t("editCampaign") : t("newCampaign")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* 1. Campaign Identity */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">{t("campaignIdentity")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1">{t("campaignName")}</Label>
                <Input type="text" required value={formData.name ?? ""} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1">{t("status")}</Label>
                <Select value={formData.status ?? "Planifiée"} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                  <option value="Planifiée">{t("scheduled")}</option>
                  <option value="En cours">{t("inProgress")}</option>
                  <option value="Terminée">{t("completed")}</option>
                  <option value="Annulée">{t("cancelled")}</option>
                </Select>
              </div>
            </div>
          </section>

          {/* 2. Platform & Content */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">{t("platformContent")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1">{t("platform")}</Label>
                <Select value={formData.platform ?? "LinkedIn"} onChange={e => setFormData({ ...formData, platform: e.target.value as SocialPlatform })}>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="TikTok">TikTok</option>
                </Select>
              </div>
              <div>
                <Label className="mb-1">{t("contentType")}</Label>
                <Select value={formData.contentType ?? ""} onChange={e => setFormData({ ...formData, contentType: e.target.value })}>
                  <option value="">{t("selectType")}</option>
                  <option value="Vidéo">{t("video")}</option>
                  <option value="Image">{t("image")}</option>
                  <option value="Carrousel">{t("carousel")}</option>
                  <option value="Story">{t("story")}</option>
                  <option value="Reel">{t("reel")}</option>
                  <option value="Autre">{t("other")}</option>
                </Select>
              </div>
            </div>
          </section>

          {/* 3. Timeline */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">{t("calendar")}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="mb-1">{t("startDate")}</Label>
                <Input type="date" required value={formData.startDate?.slice(0, 10) ?? ""} onChange={e => setFormData({ ...formData, startDate: new Date(e.target.value).toISOString() })} />
              </div>
              <div>
                <Label className="mb-1">{t("endDate")}</Label>
                <Input type="date" required value={formData.endDate?.slice(0, 10) ?? ""} onChange={e => setFormData({ ...formData, endDate: new Date(e.target.value).toISOString() })} />
              </div>
              <div>
                <Label className="mb-1">{t("durationDays")}</Label>
                <Input type="text" disabled value={durationDays ?? 0} />
              </div>
            </div>
          </section>

          {/* 4. Budget */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">{t("budgetSection")}</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label className="mb-1">{t("totalBudget")}</Label>
                <Input type="number" required min="0" value={formData.budgetDZD ?? 0} onChange={e => setFormData({ ...formData, budgetDZD: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1">{t("paidAdsCost")}</Label>
                <Input type="number" min="0" value={formData.paidAdsCost ?? 0} onChange={e => setFormData({ ...formData, paidAdsCost: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1">{t("contentCreationCost")}</Label>
                <Input type="number" min="0" value={formData.contentCreationCost ?? 0} onChange={e => setFormData({ ...formData, contentCreationCost: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1">{t("otherCosts")}</Label>
                <Input type="number" min="0" value={formData.otherCosts ?? 0} onChange={e => setFormData({ ...formData, otherCosts: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1">{t("remainingBudget")}</Label>
                <Input type="text" disabled className={cn(budgetRemaining < 0 ? "bg-red-50 border-red-200 text-red-600" : "bg-gray-50 border-gray-200 text-gray-600")} value={formatDZD(budgetRemaining ?? 0)} />
              </div>
            </div>
          </section>

          {/* 5. Targets & KPIs */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">{t("objectivesKpis")}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="mb-1">{t("targetLeads")}</Label>
                <Input type="number" min="0" value={formData.targetLeads ?? 0} onChange={e => setFormData({ ...formData, targetLeads: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1">{t("targetClicks")}</Label>
                <Input type="number" min="0" value={formData.targetClicks ?? 0} onChange={e => setFormData({ ...formData, targetClicks: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1">{t("estimatedCpl")}</Label>
                <Input type="text" disabled value={formatDZD(targetCpl ?? 0)} />
              </div>
            </div>
          </section>

          {/* 6. Results */}
          <section className={cn("p-4 rounded-xl border transition-colors relative", isResultsEditable ? "bg-white border-gray-200" : "bg-gray-50 border-gray-200")}>
            {!isResultsEditable && (
              <div className="absolute inset-0 bg-gray-50/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                <span className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-gray-600 border border-gray-200">{t("fillAfterCampaign")}</span>
              </div>
            )}
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">{t("results")}</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label className="mb-1">{t("generatedLeads")}</Label>
                <Input type="number" min="0" disabled={!isResultsEditable} value={formData.leadsGenerated ?? 0} onChange={e => setFormData({ ...formData, leadsGenerated: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1">{t("actualClicks")}</Label>
                <Input type="number" min="0" disabled={!isResultsEditable} value={formData.actualClicks ?? 0} onChange={e => setFormData({ ...formData, actualClicks: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1">{t("actualCpl")}</Label>
                <Input type="text" disabled value={formatDZD(actualCpl ?? 0)} />
              </div>
              <div>
                <Label className="mb-1">{t("conversionRate")}</Label>
                <Input type="text" disabled value={`${(actualConversionRate ?? 0).toFixed(2)}%`} />
              </div>
            </div>
          </section>

          {/* 7. Notes & Links */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">{t("notesLinks")}</h3>
            <div className="space-y-4">
              <div>
                <Label className="mb-1">{t("campaignUrl")}</Label>
                <Input type="url" value={formData.url ?? ""} onChange={e => setFormData({ ...formData, url: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1">{t("notes")}</Label>
                <Textarea rows={3} value={formData.notes ?? ""} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>
            </div>
          </section>
        </div>

        {/* Real-time Preview Footer */}
        <div className="p-4 bg-primary/10 border-t border-primary/20 flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-primary-dark">{t("preview")}:</span>
              {formData.platform && <PlatformIcon platform={formData.platform} className="w-5 h-5" />}
            </div>
            {durationDays > 0 && (
              <div className="text-primary-dark">
                <span className="font-medium">{t("duration")}:</span> {durationDays} {t("days")}
              </div>
            )}
            {targetLeads > 0 && totalBudget > 0 && (
              <div className="text-primary-dark">
                <span className="font-medium">{t("targetCpl")}:</span> {formatDZD(targetCpl)}
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full">{t("cancel")}</Button>
            <Button onClick={() => onSave(formData)} className="px-6 py-2 text-sm font-bold bg-primary text-white rounded-full hover:bg-primary">{t("save")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadSourcesTab() {
  const { t } = useTranslation();
  const { data } = useStore();
  
  const sources = ["LinkedIn", "Instagram", "Facebook", "Google", "Cold Email", "Referral", "Salon", "Other", "Direct"];
  
  const sourceStats = sources.map(source => {
    const leads = data.leads.filter(l => (l.source || "Direct") === source);
    const clients = data.clients.filter(c => c.source === source);
    return {
      name: source,
      leads: leads.length,
      clients: clients.length,
    };
  }).filter(item => item.leads > 0);

  const totalLeads = sourceStats.reduce((sum, item) => sum + item.leads, 0);

  const COLORS: Record<string, string> = {
    "LinkedIn": "#0077b5",
    "Instagram": "#E1306C",
    "Facebook": "#1877F2",
    "Google": "#DB4437",
    "Cold Email": "#9CA3AF",
    "Referral": "#10B981",
    "Salon": "#F59E0B",
    "Other": "#D1D5DB",
    "Direct": "#4B5563"
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">{t("leadSources")}</h2>
      </div>
      
      {sourceStats.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-[400px] flex flex-col">
            <h3 className="text-sm font-medium text-gray-500 mb-4">{t("sourceDistribution")}</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={sourceStats} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="leads">
                    {sourceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS["Other"]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("source")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("leads")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("percentTotal")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("convertedToClients")}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sourceStats.sort((a, b) => b.leads - a.leads).map((stat) => (
                  <tr key={stat.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[stat.name] || COLORS["Other"] }} />
                      {stat.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.leads}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{((stat.leads / totalLeads) * 100).toFixed(1)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">{stat.clients}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 flex flex-col items-center">
          <PieChartIcon className="w-12 h-12 text-gray-300 mb-3" />
          <p>{t("noSourceData")}</p>
        </div>
      )}
    </div>
  );
}

function ContentIdeasTab() {
  const { t } = useTranslation();
  const { data, addContentIdea, updateContentIdea, deleteContentIdea, currentUser } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<ContentIdea | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const columns: ContentIdeaStatus[] = ["Idea", "In Progress", "Ready", "Published"];

  const handleDragStart = (e: React.DragEvent, ideaId: string) => {
    e.dataTransfer.setData("ideaId", ideaId);
  };

  const handleDrop = async (e: React.DragEvent, status: ContentIdeaStatus) => {
    e.preventDefault();
    const ideaId = e.dataTransfer.getData("ideaId");
    if (ideaId) {
      try {
        await updateContentIdea(ideaId, { status });
        toast.success(t("statusUpdated"));
      } catch (error: any) {
        toast.error(t("errorUpdatingStatus"));
      }
    }
  };

  const handleSave = async (ideaData: Partial<ContentIdea>) => {
    try {
      if (editingIdea) {
        await updateContentIdea(editingIdea.id, ideaData);
        toast.success(t("ideaUpdated"));
      } else {
        await addContentIdea({
          ...ideaData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.id || "",
        } as ContentIdea);
        toast.success(t("ideaCreated"));
      }
      setIsModalOpen(false);
      setEditingIdea(null);
    } catch (error: any) {
      toast.error(error.message || t("errorSavingIdea"));
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm.id) {
      try {
        await deleteContentIdea(deleteConfirm.id);
        toast.success(t("ideaDeleted"));
      } catch (error: any) {
        toast.error(error.message || t("errorDeletingIdea"));
      }
    }
    setDeleteConfirm({ open: false, id: null });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">{t("ideaBox")}</h2>
        <Button onClick={() => { setEditingIdea(null); setIsModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-primary transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          <span>{t("newIdea")}</span>
        </Button>
      </div>
      
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {columns.map(status => {
          const columnIdeas = data.contentIdeas.filter(i => i.status === status);
          return (
            <div 
              key={status} 
              className="flex-1 min-w-[300px] bg-gray-100 rounded-xl p-4 flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, status)}
            >
              <h3 className="font-bold text-gray-700 mb-4 flex items-center justify-between">
                {status === "Idea" ? t("idea") : status === "In Progress" ? t("inProgress") : status === "Ready" ? t("ready") : t("published")}
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{columnIdeas.length}</span>
              </h3>
              <div className="flex-1 space-y-3 overflow-y-auto">
                {columnIdeas.map(idea => (
                  <div 
                    key={idea.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, idea.id)}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1",
                        idea.platform === "LinkedIn" ? "bg-primary/10 text-primary" :
                        idea.platform === "Instagram" ? "bg-pink-50 text-pink-700" :
                        "bg-primary/10 text-primary-dark"
                      )}>
                        <PlatformIcon platform={idea.platform} className="w-3 h-3" />
                        {idea.platform}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingIdea(idea); setIsModalOpen(true); }} className="p-1 text-gray-400 hover:text-primary rounded-full"><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(idea.id); }} className="p-1 text-gray-400 hover:text-red-500 rounded-full"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{idea.title}</h4>
                    {idea.notes && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{idea.notes}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        idea.priority === "Haute" ? "bg-red-50 text-red-600" :
                        idea.priority === "Moyenne" ? "bg-amber-50 text-amber-600" :
                        "bg-emerald-50 text-emerald-600"
                      )}>
                        {idea.priority === "Haute" ? t("high") :
                         idea.priority === "Moyenne" ? t("medium") :
                         t("low")}
                      </span>
                    </div>
                  </div>
                ))}
                {columnIdeas.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                    {t("dropHere")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && <IdeaModal idea={editingIdea} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}

      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t("confirmDelete")}</h3>
            <p className="text-gray-600 mb-6">
              {t("confirmDeleteDescription")}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm({ open: false, id: null })}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 font-medium"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IdeaModal({ idea, onClose, onSave }: { idea: ContentIdea | null; onClose: () => void; onSave: (data: Partial<ContentIdea>) => void }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<ContentIdea>>(idea || {
    title: "",
    platform: "LinkedIn",
    priority: "Moyenne",
    status: "Idea",
    notes: "",
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{idea ? t("editIdea") : t("newIdea")}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></Button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <Label className="mb-1">{t("title")}</Label>
            <Input type="text" required value={formData.title ?? ""} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1">{t("platform")}</Label>
              <Select value={formData.platform ?? "LinkedIn"} onChange={e => setFormData({ ...formData, platform: e.target.value as SocialPlatform })}>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
              </Select>
            </div>
            <div>
              <Label className="mb-1">{t("priority")}</Label>
              <Select value={formData.priority ?? "Moyenne"} onChange={e => setFormData({ ...formData, priority: e.target.value as Priority })}>
                <option value="Haute">{t("high")}</option>
                <option value="Moyenne">{t("medium")}</option>
                <option value="Basse">{t("low")}</option>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1">{t("notes")}</Label>
            <Textarea rows={3} value={formData.notes ?? ""} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full">{t("cancel")}</Button>
          <Button onClick={() => onSave(formData)} className="px-6 py-2 text-sm font-bold bg-primary text-white rounded-full hover:bg-primary">{t("save")}</Button>
        </div>
      </div>
    </div>
  );
}
