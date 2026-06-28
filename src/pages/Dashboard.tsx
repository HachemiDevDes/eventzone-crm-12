import React, { useState, useRef } from "react";
import { useStore } from "../store/StoreContext";
import { cn, formatDZD } from "../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Users, DollarSign, TrendingUp, Calendar as CalendarIcon, Clock, Target, Trophy, Zap, Phone, Star, Mail, LogIn, LogOut as LogOutIcon, CheckCircle2, Plus, Activity, ListChecks, FileText, ChevronRight, AlertCircle, History, X, Calendar, Edit2, Save, Trash2, Eye } from "lucide-react";
import { isAfter, isBefore, addDays, parseISO, isToday } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { ExpectedRevenue } from "../types";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";

import { useTranslation } from "../hooks/useTranslation";
import { Page } from "../App";

export default function Dashboard({ setCurrentPage }: { setCurrentPage: (page: Page) => void }) {
  const { data, currentUser, loading, isInitialFetchDone, checkIn, checkOut, addExpectedRevenue, updateExpectedRevenue, deleteExpectedRevenue } = useStore();
  const { t, lang } = useTranslation();
  const [chartTab, setChartTab] = useState<"comparison" | "expected" | "actual" | "team">("comparison");
  const [isAttendanceHistoryOpen, setIsAttendanceHistoryOpen] = useState(false);
  const [isExpectedRevenueModalOpen, setIsExpectedRevenueModalOpen] = useState(false);
  const [editingRevenueId, setEditingRevenueId] = useState<string | null>(null);
  const [editRevenueAmount, setEditRevenueAmount] = useState<number>(0);
  const [deletingRevenueId, setDeletingRevenueId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const isManager = currentUser?.role === "Manager";
  const isSMM = currentUser?.role === "Social Media Manager";

  // Filter leads based on role
  const visibleLeads = isManager || isSMM
    ? data.leads 
    : data.leads.filter(l => l.assignedTo === currentUser?.id);

  const totalLeads = visibleLeads.length;
  const wonLeads = visibleLeads.filter((l) => l.stage === "Gagné").length;
  const conversionRate = totalLeads ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0";

  const totalRevenueWon = data.clients
    .filter(c => isManager || c.assignedTo === currentUser?.id)
    .reduce((sum, client) => {
      const clientEvents = data.events.filter((e) => e.clientId === client.id);
      const calculatedRevenue = clientEvents.reduce((eventSum, e) => {
        const offer = data.offers.find(
          (o) => o.relatedToType === "Client" && o.relatedToId === client.id && o.eventName === e.eventName
        );
        return eventSum + (offer ? offer.price : 0);
      }, 0);
      const revenue = client.revenue !== undefined ? client.revenue : calculatedRevenue;
      return sum + revenue;
    }, 0);

  const pipelineValue = visibleLeads
    .filter((l) => l.stage !== "Gagné" && l.stage !== "Perdu")
    .reduce((sum, l) => sum + l.estimatedValue, 0);

  // Top 5 clients by revenue
  const topClients = [...data.clients]
    .map((c) => {
      const revenue = data.events
        .filter((e) => e.clientId === c.id)
        .reduce((sum, e) => {
          // Find associated offer for price
          const offer = data.offers.find((o) => o.relatedToType === "Client" && o.relatedToId === c.id && o.eventName === e.eventName);
          return sum + (offer ? offer.price : 0);
        }, 0);
      return { ...c, revenue };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Upcoming events next 30 days
  const today = new Date();
  const next30Days = addDays(today, 30);
  const upcomingEvents = data.events
    .filter((e) => {
      // If agent, only show events for their clients
      if (!isManager) {
        const client = data.clients.find(c => c.id === e.clientId);
        if (client?.assignedTo !== currentUser?.id) return false;
      }
      const eventDate = parseISO(e.date);
      return isAfter(eventDate, today) && isBefore(eventDate, next30Days);
    })
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  // Overdue tasks
  const overdueTasks = data.tasks.filter(
    (t) => {
      if (!isManager && t.assignedTo !== currentUser?.id) return false;
      return !t.completed && isBefore(parseISO(t.dueDate), today);
    }
  );

  // Team Performance
  const teamStats = (data.team || [])
    .map((member) => {
      const memberLeads = data.leads.filter((l) => l.assignedTo === member.id);
      const wonLeads = memberLeads.filter((l) => l.stage === "Gagné");
      const revenue = wonLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
      return { ...member, revenue, leadsCount: memberLeads.length };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Calculate actual vs expected revenue per month for the current year
  const currentYear = new Date().getFullYear();
  const months = [
    t("jan"), t("feb"), t("mar"), t("apr"), t("may"), t("jun"),
    t("jul"), t("aug"), t("sep"), t("oct"), t("nov"), t("dec")
  ];
  
  const monthlyData = months.map((month, index) => {
    const monthLeads = data.leads.filter(l => {
      if (!l.eventDate) return false;
      const d = new Date(l.eventDate);
      return d.getFullYear() === currentYear && d.getMonth() === index;
    });

    const actual = monthLeads
      .filter(l => l.stage === "Gagné")
      .reduce((sum, l) => sum + l.estimatedValue, 0);

    const expectedRev = data.expectedRevenues.find(r => r.year === currentYear && r.month === index);
    const expected = expectedRev ? expectedRev.amount : 0;

    return {
      name: month,
      [t("actual")]: actual,
      [t("expected")]: expected
    };
  });

  // Team Performance Data for Chart
  const teamPerformanceData = (data.team || [])
    .filter(m => m.role === "Sales Agent")
    .map(member => {
      return {
        name: member.name.split(' ')[0],
        points: member.totalPointsBalance || 0
      };
    });

  // Leaderboard
  const leaderboard = (data.team || [])
    .filter(m => m.role === "Sales Agent")
    .sort((a, b) => (b.totalPointsBalance || 0) - (a.totalPointsBalance || 0))
    .slice(0, 5);


  const internalStages = ["Nouveau", "Contacté", "Démo Planifiée", "Devis Envoyé", "Négociation", "Gagné", "Perdu"];
  const pipelineDistribution = internalStages.map((stage, index) => ({
    name: [
      t("new"), 
      t("contacted"), 
      t("demoScheduled"), 
      t("quoteSent"), 
      t("negotiation"), 
      t("won"), 
      t("lost")
    ][index],
    value: visibleLeads.filter(l => l.stage === stage).length
  })).filter(item => item.value > 0);

  const COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#10B981', '#F43F5E'];

  const totalPipelineLeads = pipelineDistribution.reduce((sum, item) => sum + item.value, 0);

  // Recent Activity
  const recentInteractions = [...data.interactions]
    .filter(i => isManager || i.actionBy === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Expected Revenue Logic
  const sortedRevenues = [...data.expectedRevenues].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const handleEditRevenue = (rev: ExpectedRevenue) => {
    setEditingRevenueId(rev.id);
    setEditRevenueAmount(rev.amount);
  };

  const handleSaveEditRevenue = (id: string) => {
    updateExpectedRevenue(id, { amount: editRevenueAmount });
    setEditingRevenueId(null);
  };

  const confirmDeleteRevenue = (id: string) => {
    deleteExpectedRevenue(id);
    setDeletingRevenueId(null);
  };

  if (isSMM) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const socialLeadsThisMonth = data.leads.filter(l => {
      const d = new Date(l.createdAt);
      return d.getMonth() === currentMonth && 
             d.getFullYear() === currentYear && 
             ["LinkedIn", "Instagram", "Facebook"].includes(l.source || "");
    }).length;

    const scheduledPostsToday = data.socialPosts.filter(p => {
      return p.status === "Scheduled" && isToday(parseISO(p.scheduledDate));
    }).length;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{t("socialDashboard")}</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("socialLeadsMonth")}
            value={socialLeadsThisMonth.toString()}
            icon={<Users />}
            color="blue"
          />
          <StatCard
            title={t("scheduledPostsToday")}
            value={scheduledPostsToday.toString()}
            icon={<CalendarIcon />}
            color="purple"
          />
          <StatCard
            title={t("activeCampaigns")}
            value={data.campaigns.filter(c => isBefore(new Date(), parseISO(c.endDate))).length.toString()}
            icon={<Target />}
            color="green"
          />
          <StatCard
            title={t("pendingIdeas")}
            value={data.contentIdeas.filter(i => i.status === "Idea").length.toString()}
            icon={<Zap />}
            color="orange"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {lang === 'fr' ? 'Bonjour' : 'Hello'} {currentUser?.name} 👋
          </h1>
          <p className="text-gray-500 mt-0 -translate-y-1">
            {lang === 'fr' ? 'Il est temps de convertir vos prospects en clients !' : 'Time to convert prospects into clients!'}
          </p>
        </div>
        
        {/* Check In / Out Section for Agents */}
        {!isManager && !isSMM && (
          <div className="flex items-center bg-white p-1 rounded-xl shadow-sm border border-gray-200">
            {!currentUser?.isCurrentlyCheckedIn ? (
              <Button
                onClick={checkIn}
                variant="primary"
                className="flex items-center space-x-2 font-bold text-sm shadow-soft"
              >
                <LogIn className="w-4 h-4" />
                <span>{t("checkIn")}</span>
              </Button>
            ) : (
              <div className="flex items-center space-x-4 px-2">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-success uppercase tracking-widest">{t("arrivedAt")}</span>
                  <span className="text-sm font-black text-neutral-900">
                    {currentUser.checkInTime ? new Date(currentUser.checkInTime).toLocaleTimeString(lang === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </span>
                </div>
                <Button
                  onClick={checkOut}
                  variant="ghost"
                  className="flex items-center space-x-2 text-neutral-600 hover:text-danger font-bold text-sm"
                >
                  <LogOutIcon className="w-4 h-4" />
                  <span>{t("checkOut")}</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !isInitialFetchDone ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title={t("totalLeads")}
              value={totalLeads.toString()}
              icon={<Users />}
              trend={`${conversionRate}% ${t("conversion")}`}
              color="blue"
            />
            <StatCard
              title={t("wonRevenue")}
              value={formatDZD(totalRevenueWon)}
              icon={<DollarSign />}
              color="green"
            />
            <StatCard
              title={t("pipelineValue")}
              value={formatDZD(pipelineValue)}
              icon={<TrendingUp />}
              color="purple"
            />
            <StatCard
              title={t("overdueTasksTitle")}
              value={overdueTasks.length.toString()}
              icon={<AlertCircle />}
              color="red"
              onClick={() => setCurrentPage('Tasks')}
            />
          </>
        )}
      </div>

      {/* Current Objective Row */}
      <div className="grid grid-cols-1 gap-6">
        {!isManager && (
          <div className="card-standard p-6 bg-white border-neutral-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-neutral-900">{t("currentObjective")}</h2>
                    <p className="text-sm text-neutral-500 font-medium">{t("trackYourProgress")}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{t("achieved")}</p>
                      <p className="text-2xl font-black text-primary">{formatDZD(totalRevenueWon)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{t("monthlyTarget")}</p>
                      <p className="text-lg font-bold text-neutral-700">{formatDZD(currentUser?.target || 1000000)}</p>
                    </div>
                  </div>
                  
                  <div className="relative h-4 bg-neutral-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="absolute inset-y-0 left-0 bg-primary-gradient rounded-full transition-all duration-1000 ease-out shadow-lg shadow-primary/20"
                      style={{ width: `${Math.min(100, (totalRevenueWon / (currentUser?.target || 1000000)) * 100)}%` }}
                    >
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-primary">{Math.round((totalRevenueWon / (currentUser?.target || 1000000)) * 100)}% {t("completed")}</span>
                    <span className="text-neutral-500">{formatDZD(Math.max(0, (currentUser?.target || 1000000) - totalRevenueWon))} {t("remaining")}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-soft border border-neutral-100 min-w-[200px]">
                <div className="relative w-24 h-24 mb-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-neutral-100"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * Math.min(100, (totalRevenueWon / (currentUser?.target || 1000000)) * 100)) / 100}
                      className="text-primary transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-warning" />
                  </div>
                </div>
                <p className="text-xs font-black text-neutral-900 uppercase tracking-widest mb-1">{t("points")}</p>
                <p className="text-2xl font-black text-primary">{currentUser?.totalPointsBalance || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Charts Row / Sales Agent Leaderboard */}
      {isManager ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue/Points Chart */}
          <div className="lg:col-span-2 card-standard p-6 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <h2 className="text-lg font-bold text-neutral-900">{t("performanceAnalysis")}</h2>
              <div className="flex space-x-2 bg-neutral-100 p-1 rounded-xl self-start">
                {isManager && (
                  <button
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
                      chartTab === "team" ? "bg-white text-neutral-900 shadow-soft" : "text-neutral-500 hover:text-neutral-900"
                    }`}
                    onClick={() => setChartTab("team")}
                  >
                    {t("teamPoints")}
                  </button>
                )}
                <button
                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
                    chartTab === "comparison" ? "bg-white text-neutral-900 shadow-soft" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                  onClick={() => setChartTab("comparison")}
                >
                  {t("comparison")}
                </button>
                <button
                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
                    chartTab === "actual" ? "bg-white text-neutral-900 shadow-soft" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                  onClick={() => setChartTab("actual")}
                >
                  {t("actual")}
                </button>
              </div>
            </div>
            <div className="h-64 w-full min-h-[256px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                {chartTab === "team" ? (
                  <BarChart data={teamPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="points" name={t("points")} fill="#0052B4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#6B7280'}}
                      tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatDZD(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    {(chartTab === "comparison" || chartTab === "actual") && (
                      <Bar dataKey={t("actual")} fill="#10B981" radius={[4, 4, 0, 0]} />
                    )}
                    {(chartTab === "comparison" || chartTab === "expected") && (
                      <Bar dataKey={t("expected")} fill="#0052B4" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pipeline Distribution */}
          <div className="card-standard p-6 flex flex-col">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">{t("pipelineDistribution")}</h2>
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-56 w-full relative min-h-[224px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={pipelineDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {pipelineDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-neutral-900">{totalPipelineLeads}</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-600">{t("leads")}</span>
                </div>
              </div>
              
              <div 
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className={cn(
                  "mt-2 flex flex-nowrap overflow-x-auto scrollbar-hide gap-2 pb-2 cursor-grab active:cursor-grabbing select-none",
                  isDragging && "cursor-grabbing"
                )}
              >
                {pipelineDistribution.map((item, index) => (
                  <div 
                    key={item.name} 
                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-neutral-50 border border-neutral-100 rounded-full shrink-0 hover:border-primary/30 transition-colors group"
                  >
                    <div 
                      className="w-1.5 h-1.5 rounded-full shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-bold text-neutral-700 group-hover:text-neutral-900 whitespace-nowrap">
                        {item.name}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] font-black text-primary">{item.value}</span>
                        <span className="text-[8px] font-bold text-neutral-400">
                          {Math.round((item.value / totalPipelineLeads) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-standard p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-warning" />
              <h2 className="text-lg font-bold text-neutral-900">{t("leaderboard")}</h2>
            </div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{t("thisMonth")}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {leaderboard.slice(0, 3).map((member, index) => (
              <div key={member.id} className={cn(
                "p-4 rounded-2xl border flex items-center space-x-4",
                index === 0 ? "bg-primary/5 border-primary/20" : "bg-neutral-50 border-neutral-100"
              )}>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-white shadow-soft flex items-center justify-center text-primary font-black">
                    {member.name.charAt(0)}
                  </div>
                  <div className={cn(
                    "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white",
                    index === 0 ? "bg-warning" : index === 1 ? "bg-neutral-400" : "bg-orange-400"
                  )}>
                    {index + 1}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-neutral-900">{member.name}</p>
                  <p className="text-xs font-bold text-primary">{member.totalPointsBalance || 0} pts</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaderboard.slice(3, 9).map((member, index) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50/50 border border-neutral-100">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-neutral-400 w-4">#{index + 4}</span>
                  <span className="text-xs font-bold text-neutral-900 truncate max-w-[120px]">{member.name}</span>
                </div>
                <span className="text-xs font-black text-primary">{member.totalPointsBalance || 0} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions & Team Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance / My Progress */}
        <div className="card-standard p-5 flex flex-col">
          {isManager ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-success" />
                  <h3 className="text-sm font-bold text-neutral-900">{t("attendanceTeam")}</h3>
                  <button 
                    onClick={() => setIsAttendanceHistoryOpen(true)}
                    className="p-1 text-neutral-500 hover:text-primary transition-colors"
                    title={t("attendanceHistory")}
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{t("today")}</span>
              </div>
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {(data.team || []).filter(m => m.role === "Sales Agent").map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-xl bg-neutral-50/50 border border-neutral-100">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white",
                          member.isCurrentlyCheckedIn ? "bg-success" : "bg-neutral-300"
                        )} />
                      </div>
                      <span className="text-xs font-bold text-neutral-900 truncate max-w-[80px]">{member.name.split(' ')[0]}</span>
                    </div>
                    <div className="text-right">
                      {member.checkInTime ? (
                        <span className="text-[9px] font-bold text-success uppercase">{new Date(member.checkInTime).toLocaleTimeString(lang === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      ) : (
                        <span className="text-[9px] font-bold text-neutral-500 uppercase italic">{t("absent")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-bold text-neutral-900">{t("myAttendance")}</h3>
                </div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{t("today")}</span>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <span className="text-xs font-bold text-neutral-600">{t("status")}</span>
                  <span className={cn(
                    "text-xs font-black uppercase",
                    currentUser?.isCurrentlyCheckedIn ? "text-success" : "text-neutral-400"
                  )}>
                    {currentUser?.isCurrentlyCheckedIn ? t("checkedIn") : t("notCheckedIn")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white border border-neutral-100 shadow-soft text-center">
                    <p className="text-[8px] font-black text-neutral-400 uppercase mb-1">{t("arrival")}</p>
                    <p className="text-sm font-black text-neutral-900">
                      {currentUser?.checkInTime ? new Date(currentUser.checkInTime).toLocaleTimeString(lang === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-neutral-100 shadow-soft text-center">
                    <p className="text-[8px] font-black text-neutral-400 uppercase mb-1">{t("departure")}</p>
                    <p className="text-sm font-black text-neutral-900">
                      {currentUser?.checkOutTime ? new Date(currentUser.checkOutTime).toLocaleTimeString(lang === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Leaderboard / Team Stats - Hidden for Sales Agents here as it's moved up */}
        {isManager && (
          <div className="card-standard p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-warning" />
                <h3 className="text-sm font-bold text-neutral-900">{t("leaderboard")}</h3>
              </div>
            </div>
            <div className="space-y-2">
              {leaderboard.map((member, index) => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className={cn(
                      "text-xs font-black",
                      index === 0 ? "text-warning" : index === 1 ? "text-neutral-600" : index === 2 ? "text-orange-400" : "text-neutral-400"
                    )}>#{index + 1}</span>
                    <span className="text-xs font-bold text-neutral-900 truncate max-w-[100px]">{member.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-primary">{member.totalPointsBalance || 0} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card-standard p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-warning" />
              <h3 className="text-sm font-bold text-neutral-900">{t("quickActions")}</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1">
            <button 
              onClick={() => setCurrentPage('Leads')}
              className="flex flex-col items-center justify-center p-3 rounded-full bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors group h-full"
            >
              <Plus className="w-5 h-5 text-primary mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-primary">{t("newLead")}</span>
            </button>
            <button 
              onClick={() => setCurrentPage('Tasks')}
              className="flex flex-col items-center justify-center p-3 rounded-full bg-success/5 border border-success/10 hover:bg-success/10 transition-colors group h-full"
            >
              <ListChecks className="w-5 h-5 text-success mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-success">{t("newTask")}</span>
            </button>
            <button 
              onClick={() => setCurrentPage('FinancialDocuments')}
              className="flex flex-col items-center justify-center p-3 rounded-full bg-secondary/5 border border-secondary/10 hover:bg-secondary/10 transition-colors group h-full"
            >
              <FileText className="w-5 h-5 text-secondary mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-secondary">{t("createOffer")}</span>
            </button>
            <button 
              onClick={() => setCurrentPage('Instructions')}
              className="flex flex-col items-center justify-center p-3 rounded-full bg-warning/5 border border-warning/10 hover:bg-warning/10 transition-colors group h-full"
            >
              <Star className="w-5 h-5 text-warning mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-warning">{t("guide")}</span>
            </button>
          </div>
        </div>
      </div>

      {isAttendanceHistoryOpen && (
        <AttendanceHistoryModal 
          onClose={() => setIsAttendanceHistoryOpen(false)} 
        />
      )}

      {isExpectedRevenueModalOpen && (
        <NewExpectedRevenueModal
          onClose={() => setIsExpectedRevenueModalOpen(false)}
          onSave={addExpectedRevenue}
          currentYear={currentYear}
          t={t}
        />
      )}

      {/* Expected Revenue Row */}
      {isManager && (
        <div className="grid grid-cols-1 gap-6">
          <div className="card-standard p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                {t("expectedRevenueTitle")}
              </h2>
              <Button
                onClick={() => setIsExpectedRevenueModalOpen(true)}
                variant="primary"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>{t("addRevenue")}</span>
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-neutral-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("year")}</th>
                    <th className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("month")}</th>
                    <th className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("amount")}</th>
                    <th className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider text-right">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {sortedRevenues.map((rev) => (
                    <tr key={rev.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900">{rev.year}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">{months[rev.month]}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-primary">
                        {editingRevenueId === rev.id ? (
                          <Input
                            type="number"
                            value={editRevenueAmount}
                            onChange={(e) => setEditRevenueAmount(Number(e.target.value))}
                            className="w-24 h-8"
                            autoFocus
                          />
                        ) : (
                          formatDZD(rev.amount)
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        {editingRevenueId === rev.id ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => handleSaveEditRevenue(rev.id)} className="text-success hover:text-success/80">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingRevenueId(null)} className="text-neutral-400 hover:text-neutral-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => handleEditRevenue(rev)} className="text-primary hover:text-primary/80">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeletingRevenueId(rev.id)} className="text-danger hover:text-danger/80">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sortedRevenues.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-neutral-500 italic">
                        {t("noForecastFound")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRevenueId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-hard border border-neutral-100">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">{t("deleteConfirmTitle")}</h3>
            <p className="text-neutral-600 mb-6">{t("confirmDeleteForecastMessage")}</p>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setDeletingRevenueId(null)}
                variant="ghost"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={() => confirmDeleteRevenue(deletingRevenueId)}
                variant="primary"
                className="bg-danger hover:bg-danger/90 text-white shadow-soft"
              >
                {t("delete")}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function StatCardSkeleton() {
  const cookieMaskStyle = {
    maskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50,0 C15,0 0,15 0,50 C0,85 15,100 50,100 C85,100 100,85 100,50 C100,15 85,0 50,0 Z'/%3E%3C/svg%3E")`,
    maskSize: 'contain',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50,0 C15,0 0,15 0,50 C0,85 15,100 50,100 C85,100 100,85 100,50 C100,15 85,0 50,0 Z'/%3E%3C/svg%3E")`,
    WebkitMaskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center'
  };

  return (
    <div className="card-standard p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-neutral-100" style={cookieMaskStyle}></div>
        <div className="w-16 h-4 bg-neutral-50 rounded"></div>
      </div>
      <div className="w-24 h-8 bg-neutral-100 rounded mb-2"></div>
      <div className="w-32 h-4 bg-neutral-50 rounded"></div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  color = "blue",
  onClick
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  color?: "blue" | "green" | "purple" | "orange" | "red";
  onClick?: () => void;
}) {
  const colors = {
    blue: "bg-primary/10 text-primary",
    green: "bg-success/10 text-success",
    purple: "bg-secondary/10 text-secondary",
    orange: "bg-warning/10 text-warning",
    red: "bg-danger/10 text-danger",
  };

  const cookieMaskStyle = {
    maskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50,0 C15,0 0,15 0,50 C0,85 15,100 50,100 C85,100 100,85 100,50 C100,15 85,0 50,0 Z'/%3E%3C/svg%3E")`,
    maskSize: 'contain',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50,0 C15,0 0,15 0,50 C0,85 15,100 50,100 C85,100 100,85 100,50 C100,15 85,0 50,0 Z'/%3E%3C/svg%3E")`,
    WebkitMaskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center'
  };

  return (
    <div 
      className={cn(
        "card-standard p-6 hover:shadow-medium transition-all duration-300 group relative overflow-hidden",
        onClick && "cursor-pointer active:scale-95"
      )}
      onClick={onClick}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div 
            className={cn("p-4 transition-transform duration-300 group-hover:scale-110", colors[color])}
            style={cookieMaskStyle}
          >
            {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
          </div>
          {trend && (
            <div className="flex items-center space-x-1 bg-success/10 border border-success/20 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-[10px] font-bold text-success">{trend}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</h3>
        </div>
      </div>
      
      {/* Decorative background blob */}
      <div 
        className={cn("absolute -right-6 -bottom-6 w-24 h-24 opacity-5 group-hover:scale-150 transition-transform duration-500 ease-out", 
          color === 'blue' ? 'bg-primary' : 
          color === 'green' ? 'bg-success' : 
          color === 'purple' ? 'bg-secondary' : 
          color === 'red' ? 'bg-danger' :
          'bg-warning'
        )} 
        style={cookieMaskStyle}
      />
    </div>
  );
}

function AttendanceHistoryModal({ onClose }: { onClose: () => void }) {
  const { data, currentUser } = useStore();
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isManager = currentUser?.role === "Manager";

  const filteredAttendance = (data.attendance || [])
    .filter(record => {
      // Filter by user role
      if (!isManager && record.userId !== currentUser?.id) return false;

      const matchesName = (record.userName || "").toLowerCase().includes(searchTerm.toLowerCase());
      const recordDate = new Date(record.date);
      const matchesStart = startDate ? recordDate >= new Date(startDate) : true;
      const matchesEnd = endDate ? recordDate <= new Date(endDate) : true;
      return matchesName && matchesStart && matchesEnd;
    })
    .sort((a, b) => {
      // Sort by date descending
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      
      // Secondary sort by check-in time
      const timeA = a.checkIn ? new Date(a.checkIn).getTime() : 0;
      const timeB = b.checkIn ? new Date(b.checkIn).getTime() : 0;
      return timeB - timeA;
    });

  const totalHours = filteredAttendance.reduce((total, record) => {
    if (record.checkIn && record.checkOut) {
      const start = new Date(record.checkIn).getTime();
      const end = new Date(record.checkOut).getTime();
      return total + (end - start) / (1000 * 60 * 60);
    }
    return total;
  }, 0);

  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return "--";
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diff = endTime - startTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <History className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t("attendanceHistory")}</h2>
              <p className="text-sm text-gray-500">
                {t("attendanceTracking")} {isManager ? t("teamGenitive") : t("personal")}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 bg-white space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isManager && (
              <div className="relative">
                <History className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={t("searchEmployee")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            <div>
              <input 
                type="date" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <input 
                type="date" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm font-medium text-emerald-800">{t("totalHoursWorked")}</span>
            <span className="text-lg font-black text-emerald-600">{totalHours.toFixed(1)}h</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {filteredAttendance.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">{t("agent")}</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">{t("date")}</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">{t("arrival")}</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">{t("departure")}</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">{t("duration")}</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">{t("points")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {(record.userName || "?").charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{record.userName || t("unknown")}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {record.date ? new Date(record.date).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-bold">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString(lang === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-bold">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString(lang === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </td>
                    <td className="p-4 text-center text-sm font-medium text-gray-700">
                      {calculateDuration(record.checkIn, record.checkOut)}
                    </td>
                    <td className="p-4 text-right">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold",
                        (record.pointsEarned || 0) >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      )}>
                        {(record.pointsEarned || 0) > 0 ? "+" : ""}{record.pointsEarned || 0} pts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">{t("noHistoryFound")}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewExpectedRevenueModal({
  onClose,
  onSave,
  currentYear,
  t
}: {
  onClose: () => void;
  onSave: (revenue: ExpectedRevenue) => void;
  currentYear: number;
  t: any;
}) {
  const [formData, setFormData] = useState<Partial<ExpectedRevenue>>({
    year: currentYear,
    month: new Date().getMonth(),
    amount: 0,
  });

  const months = [
    t("jan"), t("feb"), t("mar"), t("apr"), t("mayShort"), t("jun"), 
    t("jul"), t("aug"), t("sep"), t("oct"), t("nov"), t("dec")
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: uuidv4(),
    } as ExpectedRevenue);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Modern Header */}
        <div className="px-8 pt-8 pb-6 flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                {t("addRevenue")}
              </h2>
              <p className="text-neutral-500 text-sm font-medium">
                Prévisions mensuelles
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full h-10 w-10 p-0 transition-all"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700 ml-1">
                {t("year")}
              </Label>
              <Input
                required
                type="number"
                value={formData.year ?? currentYear}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700 ml-1">
                {t("month")}
              </Label>
              <Select
                required
                value={formData.month ?? 0}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
              >
                {months.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral-700 ml-1">
              {t("amount")} (DZD)
            </Label>
            <Input
              required
              type="number"
              min="0"
              placeholder="0.00"
              value={formData.amount ?? 0}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            />
          </div>
          
          <div className="pt-4 flex justify-end space-x-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-900"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              className="rounded-full px-8 shadow-lg shadow-primary/20"
            >
              {t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
