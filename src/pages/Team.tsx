import React, { useState } from "react";
import { useStore } from "../store/StoreContext";
import { TeamMember } from "../types";
import { Plus, Search, User, Mail, Briefcase, Trash2, Edit2, TrendingUp, Target, Star, RotateCcw, Share2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { formatDZD, cn } from "../lib/utils";
import { useTranslation } from "../hooks/useTranslation";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";

export default function Team() {
  const { data, addTeamMember, updateTeamMember, deleteTeamMember, resetPoints, searchTarget, setSearchTarget } = useStore();
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [resetConfirmMember, setResetConfirmMember] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState<"Manager" | "Sales Agent" | "Social Media Manager">("Sales Agent");

  // Handle search target
  React.useEffect(() => {
    if (searchTarget && searchTarget.type === 'Team') {
      const member = data.team.find(m => m.id === searchTarget.id);
      if (member) {
        setActiveTab(member.role);
        setEditingMember(member);
        setIsModalOpen(true);
        setSearchTarget(null);
      }
    }
  }, [searchTarget, data.team, setSearchTarget]);

  const filteredTeam = (data.team || []).filter(
    (member) =>
      (member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase())) &&
      member.role === activeTab
  );

  const getMemberStats = (memberId: string) => {
    const memberLeads = data.leads.filter(l => l.assignedTo === memberId);
    const wonLeads = memberLeads.filter(l => l.stage === "Gagné");
    const conversionRate = memberLeads.length > 0 
      ? Math.round((wonLeads.length / memberLeads.length) * 100) 
      : 0;
    const revenueGenerated = wonLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0);

    return {
      totalLeads: memberLeads.length,
      conversionRate,
      revenueGenerated
    };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("teamAndPerformance")}</h1>
        <button
          onClick={() => {
            setEditingMember(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto bg-primary-gradient text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center justify-center space-x-1.5 md:space-x-2 hover:opacity-90 transition-all shadow-md shadow-primary/20 text-xs md:text-sm font-medium"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span>{t("addMember")}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide bg-gray-50/50">
          <TabButton 
            active={activeTab === "Manager"} 
            onClick={() => setActiveTab("Manager")} 
            icon={<Briefcase className="w-4 h-4" />} 
            label={t("managers")} 
          />
          <TabButton 
            active={activeTab === "Sales Agent"} 
            onClick={() => setActiveTab("Sales Agent")} 
            icon={<Target className="w-4 h-4" />} 
            label={t("salesAgents")} 
          />
          <TabButton 
            active={activeTab === "Social Media Manager"} 
            onClick={() => setActiveTab("Social Media Manager")} 
            icon={<Share2 className="w-4 h-4" />} 
            label={t("socialMediaManagers")} 
          />
        </div>

        <div className="p-4 border-b border-gray-200 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder={t("searchMemberPlaceholder")}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeam.map((member) => {
              const stats = getMemberStats(member.id);
              return (
                <div key={member.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-primary transition-colors flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-sm text-neutral-600">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setEditingMember(member);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-neutral-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTeamMember(member.id)}
                        className="p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center text-sm text-neutral-700">
                      <Mail className="w-4 h-4 mr-2 text-neutral-500" />
                      {member.email}
                    </div>

                    {member.role === "Sales Agent" && (
                      <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                          <span>{t("attendanceAndPoints")}</span>
                          <span className="text-primary">{t("today")}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-gray-700">{member.totalPointsBalance || 0} pts</span>
                              <button
                                onClick={() => setResetConfirmMember(member)}
                                className="p-1 text-neutral-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title={t("resetPoints")}
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            </div>
                            <div className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                              member.isCurrentlyCheckedIn 
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                                : "bg-gray-100 text-neutral-600 border border-gray-200"
                            )}>
                              {member.isCurrentlyCheckedIn ? t("checkedIn") : t("absent")}
                            </div>
                          </div>
                          {member.checkInTime && (
                            <div className="flex justify-between text-[10px] font-bold text-neutral-600">
                              <span>{t("arrival")}</span>
                              <span className="text-emerald-600">{new Date(member.checkInTime).toLocaleTimeString(lang === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                          {member.checkOutTime && (
                            <div className="flex justify-between text-[10px] font-bold text-neutral-600">
                              <span>{t("departure")}</span>
                              <span className="text-amber-600">{new Date(member.checkOutTime).toLocaleTimeString(lang === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-neutral-600 mb-1 flex items-center justify-center">
                        <Target className="w-3 h-3 mr-1" /> {t("leads")}
                      </div>
                      <div className="font-semibold text-gray-900">{stats.totalLeads}</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-600 mb-1 flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> {t("conv")}
                      </div>
                      <div className="font-semibold text-green-600">{stats.conversionRate}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-600 mb-1">{t("revenue")}</div>
                      <div className="font-semibold text-primary text-sm truncate" title={formatDZD(stats.revenueGenerated)}>
                        {formatDZD(stats.revenueGenerated)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredTeam.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                {t("noTeamMembersFound")}
              </div>
            )}
          </div>
        </div>
      </div>

      {resetConfirmMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t("confirmReset")}</h2>
            <p className="text-gray-600 mb-6">
              {t("confirmResetMessage")} <span className="font-bold">{resetConfirmMember.name}</span> ? {t("deleteConfirmMessage")}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setResetConfirmMember(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => {
                  resetPoints(resetConfirmMember.id);
                  setResetConfirmMember(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md shadow-red-200"
              >
                {t("reset")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <NewTeamMemberModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingMember(null);
          }}
          onSave={(member) => {
            if (editingMember) {
              updateTeamMember(editingMember.id, member);
            } else {
              addTeamMember(member);
            }
          }}
          initialData={editingMember}
        />
      )}
    </div>
  );
}

function NewTeamMemberModal({
  onClose,
  onSave,
  initialData
}: {
  onClose: () => void;
  onSave: (member: TeamMember) => void;
  initialData: TeamMember | null;
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<TeamMember>>(
    initialData || {
      totalPointsBalance: 0,
      lastResetDate: new Date().toISOString(),
      isActive: true,
      isCurrentlyCheckedIn: false,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: initialData?.id || uuidv4(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
    } as TeamMember);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {initialData ? t("editMember") : t("newMember")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("fullName")}</Label>
            <Input
              required
              type="text"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("role")}</Label>
            <Select
              required
              value={formData.role || ""}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as "Manager" | "Sales Agent" | "Social Media Manager" })}
            >
              <option value="">{t("selectRole")}</option>
              <option value="Manager">{t("manager")}</option>
              <option value="Sales Agent">{t("salesAgent")}</option>
              <option value="Social Media Manager">{t("socialMediaManager")}</option>
            </Select>
          </div>
          <div>
            <Label>{t("email")}</Label>
            <Input
              required
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("password")}</Label>
            <Input
              required={!initialData}
              type="password"
              placeholder={initialData ? t("leaveEmptyToKeep") : t("password")}
              value={formData.password || ""}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          {formData.role === "Sales Agent" && (
            <div>
              <Label>{t("monthlyTargetDZD")}</Label>
              <Input
                required
                type="number"
                value={formData.target || ""}
                onChange={(e) => setFormData({ ...formData, target: Number(e.target.value) })}
              />
            </div>
          )}

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
              {initialData ? t("save") : t("add")}
            </Button>
          </div>
        </form>
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
        active ? "border-primary text-primary bg-primary/10/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
