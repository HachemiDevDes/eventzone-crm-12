import React, { createContext, useContext, useEffect, useState } from "react";
import { AppData, Client, EventLog, ExpectedRevenue, Lead, Offer, Task, AppNotification, DocumentItem, TeamMember, NotificationType, Interaction, SourcingWebsite, SocialPost, Campaign, ContentIdea, AttendanceRecord, Supplier, SupplierOrder, Staff, StaffAssignment, CompanySettings, Page, StaffApplication, BasePrice } from "../types";
import { Language } from "../lib/i18n";
import { supabase } from "../utils/supabaseClient";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { isBefore, parseISO, isToday } from "date-fns";

interface StoreContextType {
  data: AppData;
  loading: boolean;
  isInitialFetchDone: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  currentUser: TeamMember | null;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  addLead: (lead: Lead) => Promise<void>;
  bulkAddLeads: (leads: Lead[]) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addClient: (client: Client) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  updateCompanySettings: (settings: CompanySettings) => Promise<void>;
  addOffer: (offer: Offer) => Promise<void>;
  updateOffer: (id: string, updates: Partial<Offer>) => Promise<void>;
  deleteOffer: (id: string) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  reorderTasks: (tasks: Task[]) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addEvent: (event: EventLog) => Promise<void>;
  updateEvent: (id: string, updates: Partial<EventLog>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addExpectedRevenue: (revenue: ExpectedRevenue) => Promise<void>;
  updateExpectedRevenue: (id: string, updates: Partial<ExpectedRevenue>) => Promise<void>;
  deleteExpectedRevenue: (id: string) => Promise<void>;
  addNotification: (notification: Omit<AppNotification, "id" | "createdAt" | "read">) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  addDocument: (doc: DocumentItem) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  uploadFile: (file: File) => Promise<string | null>;
  addTeamMember: (member: TeamMember) => Promise<void>;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  updateCurrentUser: (updates: Partial<TeamMember>) => Promise<void>;
  notifyManagers: (title: string, message: string, type?: NotificationType, sourceId?: string, sourceType?: AppNotification["sourceType"]) => Promise<void>;
  logInteraction: (interaction: Omit<Interaction, "id" | "createdAt" | "actionBy">) => Promise<void>;
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  addSourcingWebsite: (website: SourcingWebsite) => Promise<void>;
  updateSourcingWebsite: (id: string, updates: Partial<SourcingWebsite>) => Promise<void>;
  deleteSourcingWebsite: (id: string) => Promise<void>;
  addSocialPost: (post: SocialPost) => Promise<void>;
  updateSocialPost: (id: string, updates: Partial<SocialPost>) => Promise<void>;
  deleteSocialPost: (id: string) => Promise<void>;
  addCampaign: (campaign: Campaign) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  addContentIdea: (idea: ContentIdea) => Promise<void>;
  updateContentIdea: (id: string, updates: Partial<ContentIdea>) => Promise<void>;
  deleteContentIdea: (id: string) => Promise<void>;
  resetPoints: (userId: string) => Promise<void>;
  addSupplier: (supplier: Supplier) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addSupplierOrder: (order: SupplierOrder) => Promise<void>;
  updateSupplierOrder: (id: string, updates: Partial<SupplierOrder>) => Promise<void>;
  deleteSupplierOrder: (id: string) => Promise<void>;
  addBasePrice: (basePrice: BasePrice) => Promise<void>;
  updateBasePrice: (id: string, updates: Partial<BasePrice>) => Promise<void>;
  deleteBasePrice: (id: string) => Promise<void>;
  addStaff: (staff: Staff) => Promise<void>;
  updateStaff: (id: string, updates: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  addStaffAssignment: (assignment: StaffAssignment) => Promise<void>;
  updateStaffAssignment: (id: string, updates: Partial<StaffAssignment>) => Promise<void>;
  deleteStaffAssignment: (id: string) => Promise<void>;
  submitStaffApplication: (application: any) => Promise<any>;
  fetchData: (silent?: boolean | string) => Promise<void>;
  searchTarget: { id: string; type: string } | null;
  setSearchTarget: (target: { id: string; type: string } | null) => void;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const initialData: AppData = {
  leads: [],
  clients: [],
  offers: [],
  tasks: [],
  events: [],
  expectedRevenues: [],
  notifications: [],
  documents: [],
  team: [],
  interactions: [],
  sourcingWebsites: [],
  socialPosts: [],
  campaigns: [],
  contentIdeas: [],
  attendance: [],
  suppliers: [],
  supplierOrders: [],
  basePrices: [],
  staff: [],
  staffAssignments: [],
};

const toSnakeCase = (obj: any) => {
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = obj[key] === undefined ? null : toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

const toCamelCase = (obj: any) => {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("crm_language") as Language) || "fr";
  });

  useEffect(() => {
    localStorage.setItem("crm_language", language);
  }, [language]);
  const [loading, setLoading] = useState(true);
  const [isInitialFetchDone, setIsInitialFetchDone] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [data, setData] = useState<AppData>(initialData);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [searchTarget, setSearchTarget] = useState<{ id: string; type: string } | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("Dashboard");
  const submitStaffApplication = async (application: Omit<StaffApplication, "id" | "createdAt" | "status">) => {
    const newStaff: Staff = {
      id: uuidv4(),
      firstName: application.firstName,
      lastName: application.lastName,
      gender: application.gender,
      staffType: "Hôte/Hôtesse",
      phone: application.phone,
      email: application.email,
      age: application.age,
      wilaya: application.wilaya,
      experienceYears: parseInt(application.experience) || 0,
      availability: "Disponible",
      rating: 0,
      totalEvents: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      profilePhotoUrl: application.photoUrls[0] || `https://ui-avatars.com/api/?name=${application.firstName}+${application.lastName}&background=random`,
    };

    setData(prev => ({
      ...prev,
      staff: [...prev.staff, newStaff],
    }));
    return newStaff;
  };

  const [currentUser, setCurrentUser] = useState<TeamMember | null>(() => {
    try {
      const stored = localStorage.getItem("eventzone_user");
      return stored ? toCamelCase(JSON.parse(stored)) : null;
    } catch (e) {
      console.error("Error parsing stored user:", e);
      return null;
    }
  });

  const getUsersByRole = async (role: string) => {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('role', role);
    if (error) {
      console.error(`Error fetching users by role ${role}:`, error);
      return [];
    }
    return toCamelCase(users || []);
  };

  useEffect(() => {
    if (connectionError) {
      toast.error(connectionError, {
        id: 'connection-error',
        duration: 5000
      });
    }
  }, [connectionError]);

  const fetchData = async (silent: boolean | string = false) => {
    // Only show loading spinner for the very first fetch if not silent
    if (!silent && !isInitialFetchDone) setLoading(true);
    
    try {
      const fetchTable = async (table: string) => {
        let query = supabase.from(table).select('*');
        
        if (table === 'attendance') {
          query = query.order('date', { ascending: false });
        }
        
        const { data, error } = await query;
        if (error) {
          console.error(`Error fetching ${table}:`, error);
          if (error.message === 'TypeError: Failed to fetch' || error.message?.includes('fetch')) {
            setConnectionError("Impossible de se connecter à la base de données. Veuillez vérifier votre connexion internet ou les paramètres Supabase.");
          }
          return null;
        }
        setConnectionError(null);
        return toCamelCase(data || []);
      };

      const fetchNotifications = async () => {
        if (!currentUser || (currentUser.role?.toLowerCase() !== "manager" && currentUser.role?.toLowerCase() !== "admin")) return [];
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching notifications:", error);
          return null;
        }
        return toCamelCase(data || []);
      };

      // Optimization: If a specific table is provided, only fetch that one
      if (typeof silent === 'string') {
        const table = silent;
        const result = table === 'notifications' ? await fetchNotifications() : await fetchTable(table);
        
        if (result === null) return; // Don't clear state on error
        if (isImporting && table === 'leads') return; // Don't overwrite during import

        setData(prev => ({
          ...prev,
          [table === 'company_settings' ? 'companySettings' : 
           table === 'expected_revenues' ? 'expectedRevenues' :
           table === 'sourcing_websites' ? 'sourcingWebsites' :
           table === 'social_posts' ? 'socialPosts' :
           table === 'content_ideas' ? 'contentIdeas' :
           table === 'supplier_orders' ? 'supplierOrders' :
           table === 'base_prices' ? 'basePrices' :
           table === 'staff_assignments' ? 'staffAssignments' :
           table === 'users' ? 'team' :
           table]: table === 'company_settings' ? result[0] : result
        }));
        return;
      }

      const [
        leads,
        clients,
        offers,
        tasks,
        events,
        expectedRevenues,
        notifications,
        documents,
        team,
        interactions,
        sourcingWebsites,
        socialPosts,
        campaigns,
        contentIdeas,
        attendance,
        suppliers,
        supplierOrders,
        basePrices,
        staff,
        staffAssignments,
        companySettings
      ] = await Promise.all([
        fetchTable('leads'),
        fetchTable('clients'),
        fetchTable('offers'),
        fetchTable('tasks'),
        fetchTable('events'),
        fetchTable('expected_revenues'),
        fetchNotifications(),
        fetchTable('documents'),
        fetchTable('users'),
        fetchTable('interactions'),
        fetchTable('sourcing_websites'),
        fetchTable('social_posts'),
        fetchTable('campaigns'),
        fetchTable('content_ideas'),
        fetchTable('attendance'),
        fetchTable('suppliers'),
        fetchTable('supplier_orders'),
        fetchTable('base_prices'),
        fetchTable('staff'),
        fetchTable('staff_assignments'),
        fetchTable('company_settings')
      ]);

      let finalTeam = team !== null ? (team || []) : null;

      // Auto-seed admin if team is empty
      if (finalTeam !== null && finalTeam.length === 0) {
        const defaultAdmin = {
          id: uuidv4(),
          name: "Mohamed Hachemi",
          role: "Manager",
          email: "contact@eventzone.pro",
          password: import.meta.env.VITE_INITIAL_ADMIN_PASSWORD || "Ben10?40", // Use env var if available
          isActive: true,
          createdAt: new Date().toISOString()
        };
        const { error: seedError } = await supabase.from('users').insert([toSnakeCase(defaultAdmin)]);
        if (!seedError) {
          finalTeam = [defaultAdmin];
        }
      }

      const finalClients = clients !== null ? (clients || []).map((c: any) => ({
        ...c,
        documents: (documents || []).filter((d: any) => d.clientId === c.id)
      })) : null;

      let finalSourcingWebsites = sourcingWebsites !== null ? (sourcingWebsites || []) : null;

      // Auto-seed sourcing websites if empty
      if (finalSourcingWebsites !== null && finalSourcingWebsites.length === 0) {
        const defaultWebsites = [
          {
            id: uuidv4(),
            name: "LinkedIn",
            url: "https://www.linkedin.com",
            description: "Le meilleur outil pour trouver des décideurs (Marketing, Com, RH).",
            category: "Réseau Social",
            createdAt: new Date().toISOString()
          },
          {
            id: uuidv4(),
            name: "Kompass",
            url: "https://dz.kompass.com",
            description: "Annuaire d'entreprises algériennes avec filtres par secteur.",
            category: "Annuaire",
            createdAt: new Date().toISOString()
          },
          {
            id: uuidv4(),
            name: "Pages Jaunes Algérie",
            url: "https://www.pagesjaunes-dz.com",
            description: "Trouvez les coordonnées directes des entreprises par wilaya.",
            category: "Annuaire",
            createdAt: new Date().toISOString()
          }
        ];
        const { error: seedError } = await supabase.from('sourcing_websites').insert(toSnakeCase(defaultWebsites));
        if (!seedError) {
          finalSourcingWebsites = defaultWebsites;
        }
      }

      if (finalSourcingWebsites !== null) {
        const uniqueSites: any[] = [];
        finalSourcingWebsites.forEach((site: any) => {
          const isDuplicate = uniqueSites.some(
            (s) => s.name.toLowerCase() === site.name.toLowerCase() || s.url.toLowerCase() === site.url.toLowerCase()
          );
          if (!isDuplicate) {
            uniqueSites.push(site);
          }
        });
        finalSourcingWebsites = uniqueSites;
      }

      setData(prev => ({
        ...prev,
        leads: leads !== null ? leads : prev.leads,
        clients: finalClients !== null ? finalClients : prev.clients,
        offers: offers !== null ? offers : prev.offers,
        tasks: tasks !== null ? tasks : prev.tasks,
        events: events !== null ? events : prev.events,
        expectedRevenues: expectedRevenues !== null ? expectedRevenues : prev.expectedRevenues,
        notifications: notifications !== null ? notifications : prev.notifications,
        documents: documents !== null ? documents : prev.documents,
        team: finalTeam !== null ? finalTeam : prev.team,
        interactions: interactions !== null ? interactions : prev.interactions,
        sourcingWebsites: finalSourcingWebsites !== null ? finalSourcingWebsites : prev.sourcingWebsites,
        socialPosts: socialPosts !== null ? socialPosts : prev.socialPosts,
        campaigns: campaigns !== null ? campaigns : prev.campaigns,
        contentIdeas: contentIdeas !== null ? contentIdeas : prev.contentIdeas,
        attendance: attendance !== null ? attendance : prev.attendance,
        suppliers: suppliers !== null ? suppliers : prev.suppliers,
        supplierOrders: supplierOrders !== null ? supplierOrders : prev.supplierOrders,
        basePrices: basePrices !== null ? basePrices : prev.basePrices,
        staff: staff !== null ? staff : prev.staff,
        staffAssignments: staffAssignments !== null ? staffAssignments : prev.staffAssignments,
        companySettings: companySettings !== null ? companySettings[0] : prev.companySettings
      }));
      
    } catch (error) {
      console.error("Error fetching data:", error);
      // Don't show toast for background refreshes unless it's the initial one
      if (!isInitialFetchDone) {
        toast.error("Erreur lors du chargement des données. Vérifiez votre console.");
      }
    } finally {
      setLoading(false);
      setIsInitialFetchDone(true);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time listeners
    const leadsChannel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchData('leads');
      })
      .subscribe();

    const clientsChannel = supabase
      .channel('clients-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        fetchData('clients');
      })
      .subscribe();

    const tasksChannel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchData('tasks');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(clientsChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("eventzone_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("eventzone_user");
    }
  }, [currentUser]);

  useEffect(() => {
    const checkReset = async () => {
      if (!currentUser || currentUser.role?.toLowerCase() !== "sales agent") return;

      const now = new Date();
      const resetTime = new Date();
      resetTime.setHours(8, 0, 0, 0);

      const lastReset = new Date(currentUser.lastResetDate || 0);
      
      // If we haven't reset today after 8 AM
      if (lastReset < resetTime && now >= resetTime) {
        await updateCurrentUser({
          lastResetDate: now.toISOString(),
          checkInTime: undefined,
          checkOutTime: undefined,
          isCurrentlyCheckedIn: false
        });
      }
    };

    checkReset();
    
    // Check every minute to handle the 8 AM transition while logged in
    const interval = setInterval(checkReset, 60000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.lastResetDate]); // Use specific properties to avoid unnecessary re-runs

  const login = async (email: string, password?: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        toast.error("Email ou mot de passe incorrect");
        return false;
      }

      if (user.password !== password) {
        toast.error("Email ou mot de passe incorrect");
        return false;
      }

      setCurrentUser(toCamelCase(user));
      toast.success(`Bienvenue, ${user.name}`);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Une erreur est survenue lors de la connexion");
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const triggerNotification = async (
    event: string,
    payload: {
      title: string;
      message: string;
      type?: NotificationType;
      userId?: string;
      sourceId?: string;
      sourceType?: AppNotification["sourceType"];
      actionBy?: string | null;
    }
  ) => {
    const { title, message, type = "info", userId, sourceId, sourceType, actionBy = currentUser?.id } = payload;

    const addIfNotSelf = async (targetUserId: string) => {
      // HARD BLOCK — never send notification to the person who triggered it
      if (actionBy && targetUserId === actionBy) return;
      
      await addNotification({
        title,
        message,
        type,
        userId: targetUserId,
        sourceId,
        sourceType,
        actionBy: actionBy || undefined
      });
    };

    const managers = data.team.filter(m => m.role?.toLowerCase() === "manager" || m.role?.toLowerCase() === "admin");

    // RULE 1, 4, 6, 8 — Manager Notifications
    const managerEvents = [
      "lead_created",
      "lead_converted",
      "devis_waiting",
      "satisfaction_score",
      "campaign_completed",
      "Check-in Agent"
    ];

    if (managerEvents.includes(event)) {
      for (const manager of managers) {
        await addIfNotSelf(manager.id);
      }
    }

    // Specific User Notifications - ONLY IF MANAGER
    if (userId) {
      const targetUser = data.team.find(u => u.id === userId);
      if (targetUser?.role === "Manager") {
        await addIfNotSelf(userId);
      }
    }
  };

  // CRUD Operations
  const addLead = async (lead: Lead) => {
    // Duplicate check
    const isDuplicate = data.leads.some(l => 
      l.phone === lead.phone && l.companyName.toLowerCase() === lead.companyName.toLowerCase()
    );

    if (isDuplicate) {
      toast.error("Un lead avec ce numéro de téléphone et ce nom d'entreprise existe déjà.");
      return;
    }

    // Optimistic update
    setData(prev => ({ ...prev, leads: [...prev.leads, lead] }));
    
    const { error } = await supabase.from('leads').insert([toSnakeCase(lead)]);
    if (error) {
      console.error(error);
      toast.error("Erreur lors de l'ajout du lead");
      fetchData('leads'); // Rollback/Sync
    } else {
      // BUG 2 FIX: Notify all managers when a lead is created
      await notifyManagers(
        "Nouveau lead ajouté",
        `${currentUser?.name} a ajouté le lead : ${lead.companyName}`,
        "info",
        lead.id,
        "Lead"
      );

      if (lead.assignedTo && lead.assignedTo !== currentUser?.id) {
        await triggerNotification("lead_assigned", {
          title: "Nouveau Lead Assigné",
          message: `Le lead ${lead.companyName} vous a été assigné`,
          userId: lead.assignedTo,
          sourceId: lead.id,
          sourceType: "Lead"
        });
      }

      if (currentUser?.role === "Sales Agent") {
        const updates: any = {};
        updates.totalPointsBalance = (currentUser.totalPointsBalance || 0) + 5;
        await updateCurrentUser(updates);

        const followUpTask: Task = {
          id: uuidv4(),
          title: `Premier contact : ${lead.companyName}`,
          description: `Effectuer le premier contact avec ${lead.contactName} (${lead.phone})`,
          relatedToId: lead.id,
          relatedToType: "Lead",
          dueDate: new Date().toISOString(),
          priority: "Haute",
          completed: false,
          createdAt: new Date().toISOString(),
          assignedTo: currentUser.id
        };
        await addTask(followUpTask);
      }
      fetchData('leads');
    }
  };

  const bulkAddLeads = async (leads: Lead[]) => {
    if (leads.length === 0) return;

    setIsImporting(true);
    // Optimistic update
    setData(prev => ({ ...prev, leads: [...prev.leads, ...leads] }));

    try {
      const { error } = await supabase.from('leads').insert(leads.map(l => toSnakeCase(l)));
      
      if (error) {
        console.error("Bulk Add Leads Error:", error);
        toast.error("Erreur lors de l'importation massive des leads. Vérifiez que vous avez exécuté le code SQL fourni.");
        // Revert optimistic update by fetching fresh data
        await fetchData('leads');
      } else {
        // Success - fetch fresh data to sync with DB (IDs, etc)
        await fetchData('leads');
      }
    } catch (err) {
      console.error("Bulk Add Leads Exception:", err);
      await fetchData('leads');
    } finally {
      setIsImporting(false);
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const oldLead = data.leads.find(l => l.id === id);
    if (!oldLead) return;
    
    let pointsToAward = 0;
    const finalUpdates = { ...updates };
    
    if (currentUser?.role === "Sales Agent" && updates.stage === "Démo Planifiée" && !oldLead.pointsAwardedForQualification) {
      pointsToAward = 10;
      finalUpdates.pointsAwardedForQualification = true;
    } else if (currentUser?.role === "Sales Agent" && updates.stage === "Devis Envoyé" && !oldLead.pointsAwardedForOfferStage) {
      pointsToAward = 10;
      finalUpdates.pointsAwardedForOfferStage = true;
    }
    
    setData(prev => ({
      ...prev,
      leads: prev.leads.map(l => l.id === id ? { ...l, ...finalUpdates } : l)
    }));

    const { id: _, ...cleanUpdates } = finalUpdates as any;
    const { error } = await supabase.from('leads').update(toSnakeCase(cleanUpdates)).eq('id', id);
    
    if (error) {
      console.error("Update Lead Error:", error);
      fetchData('leads');
    } else {
      if (pointsToAward > 0) {
        await updateCurrentUser({ totalPointsBalance: (currentUser.totalPointsBalance || 0) + pointsToAward });
        toast.success(`Points attribués ! +${pointsToAward} pts`);
      }

      if (updates.stage === "Gagné" && oldLead.stage !== "Gagné") {
        await triggerNotification("lead_converted", {
          title: "Lead Converti",
          message: `${currentUser?.name} a converti le lead ${oldLead.companyName} en client`,
          type: "success",
          sourceId: id,
          sourceType: "Lead"
        });
      }
      
      if (updates.assignedTo && updates.assignedTo !== oldLead.assignedTo) {
        await triggerNotification("lead_assigned", {
          title: "Lead Assigné",
          message: `Le lead ${oldLead.companyName} vous a été assigné`,
          userId: updates.assignedTo,
          sourceId: id,
          sourceType: "Lead"
        });
      }

      if (currentUser?.role === "Manager" && updates.notes && updates.notes !== oldLead.notes) {
        if (oldLead.assignedTo) {
          await triggerNotification("comment_added", {
            title: "Nouveau commentaire",
            message: `Le manager a laissé une note sur le lead ${oldLead.companyName}`,
            userId: oldLead.assignedTo,
            sourceId: id,
            sourceType: "Lead"
          });
        }
      }
      fetchData('leads');
    }
  };

  const deleteLead = async (id: string) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      leads: prev.leads.filter(l => l.id !== id)
    }));

    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      console.error("Delete Lead Error:", error);
      toast.error("Erreur lors de la suppression du lead");
      fetchData('leads'); // Rollback/Sync
    }
  };

  const addClient = async (client: Client) => {
    // Optimistic update
    setData(prev => ({ ...prev, clients: [...prev.clients, client] }));

    const { documents, ...cleanClient } = client as any;
    const { error } = await supabase.from('clients').insert([toSnakeCase(cleanClient)]);
    
    if (error) {
      console.error("Add Client Error:", error);
      toast.error("Erreur lors de l'ajout du client");
      fetchData('clients'); // Rollback
      return;
    }

    // Points for converting a lead to a client
    if (currentUser?.role === "Sales Agent") {
      // Check if points were already awarded for this lead conversion
      const alreadyConverted = client.convertedFromLeadId && data.clients.some(c => 
        c.id !== client.id && 
        c.convertedFromLeadId === client.convertedFromLeadId
      );

      if (alreadyConverted) {
        toast.info("Points de conversion déjà attribués pour ce lead.");
        fetchData('clients');
        return;
      }

      let pointsToAdd = 30; // Base points for conversion
      
      // Bonus: First client of the month
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const clientsThisMonth = data.clients.filter(c => new Date(c.createdAt) >= firstOfMonth);
      if (clientsThisMonth.length === 0) {
        pointsToAdd += 100;
        toast.success("Bonus : Premier client du mois ! +100 pts");
      }

      // Bonus: 3 clients closed in one week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const clientsThisWeek = data.clients.filter(c => new Date(c.createdAt) >= oneWeekAgo && c.assignedTo === currentUser.id);
      if (clientsThisWeek.length === 2) { // Already 2, this is the 3rd
        pointsToAdd += 150;
        toast.success("Bonus : 3 clients en une semaine ! +150 pts");
      }

      await updateCurrentUser({
        totalPointsBalance: (currentUser.totalPointsBalance || 0) + pointsToAdd
      });
      
      toast.success(`Client converti ! +${pointsToAdd} pts`);
    }

    // Save associated documents
    if (documents && documents.length > 0) {
      const docsToSave = documents.map((doc: any) => toSnakeCase({
        ...doc,
        clientId: client.id
      }));
      const { error: docError } = await supabase.from('documents').insert(docsToSave);
      if (docError) console.error("Error saving client documents:", docError);
    }

    fetchData(true);
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === id ? { ...c, ...updates } : c)
    }));

    const { id: _, documents, ...cleanUpdates } = updates as any;
    const { error } = await supabase.from('clients').update(toSnakeCase(cleanUpdates)).eq('id', id);
    
    if (error) {
      console.error("Update Client Error:", error);
      toast.error("Erreur lors de la mise à jour du client");
      fetchData('clients'); // Rollback
      return;
    }

    // Sync documents (this is a simple implementation: delete old and add new)
    // In a real app, you'd diff them
    if (documents) {
      await supabase.from('documents').delete().eq('client_id', id);
      if (documents.length > 0) {
        const docsToSave = documents.map((doc: any) => toSnakeCase({
          ...doc,
          clientId: id
        }));
        await supabase.from('documents').insert(docsToSave);
      }
    }

    fetchData('clients');
  };

  const deleteClient = async (id: string) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id)
    }));

    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      console.error("Delete Client Error:", error);
      toast.error("Erreur lors de la suppression du client");
      fetchData('clients'); // Rollback
    }
  };

  const updateCompanySettings = async (settings: CompanySettings) => {
    const fixedId = '00000000-0000-0000-0000-000000000000';
    const { error } = await supabase
      .from('company_settings')
      .upsert(toSnakeCase({ ...settings, id: fixedId }));

    if (error) {
      console.error("Error updating company settings:", error);
      toast.error("Erreur lors de la mise à jour des paramètres");
    } else {
      setData(prev => ({
        ...prev,
        companySettings: settings
      }));
      toast.success("Paramètres de l'entreprise mis à jour");
    }
  };

  const addOffer = async (offer: Offer) => {
    const { error } = await supabase.from('offers').insert([toSnakeCase(offer)]);
    if (error) {
      console.error("Add Offer Error:", error);
      toast.error("Erreur lors de l'ajout de l'offre");
    } else {
      // Notify managers if devis sent
      await triggerNotification("devis_waiting", {
        title: "Devis en attente",
        message: `${currentUser?.name} a envoyé un devis pour ${offer.eventName}`,
        sourceId: offer.id,
        sourceType: "Offer"
      });

      if (currentUser?.role === "Sales Agent") {
        const client = offer.relatedToType === "Client" ? data.clients.find(c => c.id === offer.relatedToId) : null;
        const lead = offer.relatedToType === "Lead" ? data.leads.find(l => l.id === offer.relatedToId) : (client?.convertedFromLeadId ? data.leads.find(l => l.id === client.convertedFromLeadId) : null);
        const hasExistingOffer = data.offers.some(o => o.relatedToId === offer.relatedToId && o.relatedToType === offer.relatedToType);
        const alreadyAwardedViaLead = lead?.pointsAwardedForOfferStage;

        if (!hasExistingOffer && !alreadyAwardedViaLead) {
          await updateCurrentUser({ totalPointsBalance: (currentUser.totalPointsBalance || 0) + 10 });
          toast.success("Première offre envoyée ! +10 pts");
        }
      }
      fetchData('offers');
    }
  };

  const updateOffer = async (id: string, updates: Partial<Offer>) => {
    const oldOffer = data.offers.find(o => o.id === id);
    const { id: _, ...cleanUpdates } = updates as any;
    const { error } = await supabase.from('offers').update(toSnakeCase(cleanUpdates)).eq('id', id);
    if (error) {
      console.error("Update Offer Error:", error);
      toast.error("Erreur lors de la mise à jour de l'offre");
    } else {
      if (updates.status && updates.status !== oldOffer?.status) {
        const related = oldOffer?.relatedToType === "Client" 
          ? data.clients.find(c => c.id === oldOffer?.relatedToId)
          : data.leads.find(l => l.id === oldOffer?.relatedToId);
        if (related?.assignedTo) {
          await triggerNotification(updates.status === "Accepté" ? "devis_approved" : "devis_rejected", {
            title: `Devis ${updates.status}`,
            message: `Votre devis pour ${oldOffer?.eventName} a été ${updates.status.toLowerCase()}`,
            type: updates.status === "Accepté" ? "success" : "error",
            userId: related.assignedTo,
            sourceId: id,
            sourceType: "Offer"
          });
        }
      }
      fetchData('offers');
    }
  };

  const deleteOffer = async (id: string) => {
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) {
      console.error("Delete Offer Error:", error);
      toast.error("Erreur lors de la suppression de l'offre");
    } else fetchData(true);
  };

  const addTask = async (task: Task) => {
    // Calculate order if not present
    if (task.order === undefined) {
      const maxOrder = data.tasks.reduce((max, t) => (t.order || 0) > max ? (t.order || 0) : max, 0);
      task.order = maxOrder + 1;
    }

    // Optimistic update
    setData(prev => ({ ...prev, tasks: [...prev.tasks, task] }));

    const { error } = await supabase.from('tasks').insert([toSnakeCase(task)]);
    if (error) {
      console.error("Add Task Error:", error);
      toast.error("Erreur lors de l'ajout de la tâche");
      fetchData(true);
    } else {
      if (task.assignedTo && task.assignedTo !== currentUser?.id) {
        await triggerNotification("task_assigned", {
          title: "Nouvelle Tâche Assignée",
          message: `La tâche "${task.title}" vous a été assignée`,
          userId: task.assignedTo,
          sourceId: task.id,
          sourceType: "Task"
        });
      }
      fetchData(true);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const oldTask = data.tasks.find(t => t.id === id);
    
    // Optimistic update
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));

    const { id: _, ...cleanUpdates } = updates as any;
    const { error } = await supabase.from('tasks').update(toSnakeCase(cleanUpdates)).eq('id', id);
    if (error) {
      console.error("Update Task Error:", error);
      toast.error("Erreur lors de la mise à jour de la tâche");
      fetchData(true);
    } else {
      if (updates.completed && !oldTask?.completed) {
        await triggerNotification("task_completed", {
          title: "Tâche Terminée",
          message: `${currentUser?.name} a terminé la tâche : ${oldTask?.title}`,
          type: "success",
          sourceId: id,
          sourceType: "Task"
        });
      }
      
      if (updates.assignedTo && updates.assignedTo !== oldTask?.assignedTo) {
        await triggerNotification("task_assigned", {
          title: "Tâche Réassignée",
          message: `La tâche "${oldTask?.title}" vous a été assignée`,
          userId: updates.assignedTo,
          sourceId: id,
          sourceType: "Task"
        });
      }
      fetchData(true);
    }
  };

  const reorderTasks = async (tasks: Task[]) => {
    // Optimistic update
    const updatedTasks = tasks.map((t, index) => ({ ...t, order: index }));
    
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        const updated = updatedTasks.find(ut => ut.id === t.id);
        return updated ? updated : t;
      })
    }));

    const tasksToUpsert = updatedTasks.map(t => toSnakeCase(t));

    const { error } = await supabase.from('tasks').upsert(tasksToUpsert);
    
    if (error) {
        console.error("Reorder Tasks Error:", error);
        toast.error("Erreur lors de la réorganisation des tâches");
        fetchData(true);
    }
  };

  const deleteTask = async (id: string) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error("Delete Task Error:", error);
      toast.error("Erreur lors de la suppression de la tâche");
      fetchData(true);
    }
  };

  const addEvent = async (event: EventLog) => {
    const { error } = await supabase.from('events').insert([toSnakeCase(event)]);
    if (error) {
      console.error("Add Event Error:", error);
      toast.error("Erreur lors de l'ajout de l'événement");
    } else {
      await triggerNotification("satisfaction_score", {
        title: "Nouveau Score de Satisfaction",
        message: `Un score de ${event.satisfactionRating}/5 a été soumis pour ${event.eventName}`,
        type: event.satisfactionRating >= 4 ? "success" : "warning",
        sourceId: event.id,
        sourceType: "Event"
      });
      
      await triggerNotification("new_event", {
        title: "Nouvel Événement Client",
        message: `Un nouvel événement "${event.eventName}" a été ajouté.`,
        sourceId: event.id,
        sourceType: "Event"
      });

      fetchData(true);
    }
  };

  const updateEvent = async (id: string, updates: Partial<EventLog>) => {
    const { id: _, ...cleanUpdates } = updates as any;
    const { error } = await supabase.from('events').update(toSnakeCase(cleanUpdates)).eq('id', id);
    if (error) {
      console.error("Update Event Error:", error);
      toast.error("Erreur lors de la mise à jour de l'événement");
    } else fetchData(true);
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      console.error("Delete Event Error:", error);
      toast.error("Erreur lors de la suppression de l'événement");
    } else fetchData(true);
  };

  const addExpectedRevenue = async (revenue: ExpectedRevenue) => {
    const { error } = await supabase.from('expected_revenues').insert([toSnakeCase(revenue)]);
    if (error) {
      console.error("Add Revenue Error:", error);
      toast.error("Erreur lors de l'ajout du revenu attendu");
    } else fetchData(true);
  };

  const updateExpectedRevenue = async (id: string, updates: Partial<ExpectedRevenue>) => {
    const { id: _, ...cleanUpdates } = updates as any;
    const { error } = await supabase.from('expected_revenues').update(toSnakeCase(cleanUpdates)).eq('id', id);
    if (error) {
      console.error("Update Revenue Error:", error);
      toast.error("Erreur lors de la mise à jour du revenu attendu");
    } else fetchData(true);
  };

  const deleteExpectedRevenue = async (id: string) => {
    const { error } = await supabase.from('expected_revenues').delete().eq('id', id);
    if (error) {
      console.error("Delete Revenue Error:", error);
      toast.error("Erreur lors de la suppression du revenu attendu");
    } else fetchData(true);
  };

  const isUUID = (val: any) => {
    if (!val || typeof val !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  };

  const addNotification = async (notif: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    if (!notif.userId) return;
    // HARD BLOCK — never send notification to the person who triggered it
    if (notif.userId === notif.actionBy) return;

    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: notif.userId,
        action_by: isUUID(notif.actionBy) ? notif.actionBy : null,
        title: notif.title || "Notification",
        message: notif.message || notif.title || "Notification sans message",
        type: notif.type || "info",
        source_id: isUUID(notif.sourceId) ? notif.sourceId : null,
        source_type: notif.sourceType || null,
        read: false,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error("Add Notification Error:", error.message);
      toast.error("Erreur lors de l'ajout de la notification");
    } else fetchData(true);
  };

  const notifyManagers = async (title: string, message: string, type: NotificationType = "info", sourceId?: string, sourceType?: AppNotification["sourceType"]) => {
    const managers = data.team.filter(m => m.role === "Manager");
    for (const manager of managers) {
      await addNotification({
        title,
        message,
        type,
        userId: manager.id,
        sourceId,
        sourceType,
        actionBy: currentUser?.id
      });
    }
  };

  const logInteraction = async (interaction: Omit<Interaction, "id" | "createdAt" | "actionBy">) => {
    if (!currentUser) return;

    const newInteraction: Interaction = {
      ...interaction,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      actionBy: currentUser.id
    };

    const { error } = await supabase.from('interactions').insert([toSnakeCase(newInteraction)]);
    
    if (error) {
      console.error("Log Interaction Error:", error);
      toast.error("Erreur lors de l'enregistrement de l'interaction");
      return;
    }

    // Manager comment notification
    if (currentUser.role === "Manager" && interaction.type === "Note") {
      if (interaction.leadId) {
        const lead = data.leads.find(l => l.id === interaction.leadId);
        if (lead?.assignedTo) {
          await triggerNotification("comment_added", {
            title: "Nouveau commentaire",
            message: `Le manager a laissé une note sur le lead ${lead.companyName}`,
            userId: lead.assignedTo,
            sourceId: lead.id,
            sourceType: "Lead"
          });
        }
      } else if (interaction.clientId) {
        const client = data.clients.find(c => c.id === interaction.clientId);
        if (client?.assignedTo) {
          await triggerNotification("comment_added", {
            title: "Nouveau commentaire",
            message: `Le manager a laissé une note sur le client ${client.companyName}`,
            userId: client.assignedTo,
            sourceId: client.id,
            sourceType: "Client"
          });
        }
      }
    }

    // Gamification Logic
    if (currentUser.role === "Sales Agent") {
      if (interaction.type === "Phone Call") {
        // Award points for quality outcomes
        if (interaction.outcome === "Interested" || interaction.outcome === "Meeting Scheduled") {
          const pointsToAdd = 10;
          await updateCurrentUser({
            totalPointsBalance: (currentUser.totalPointsBalance || 0) + pointsToAdd
          });
          toast.success(`Interaction enregistrée ! +${pointsToAdd} pts`);
        }
      }
    }

    fetchData(true);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      const msg = error.message || "";
      if (msg.includes('row-level security') || msg.includes('RLS')) {
        toast.error("Sécurité Supabase (RLS) : Veuillez exécuter le script SQL fourni pour autoriser les uploads.");
      } else {
        toast.error("Erreur lors de l'envoi du fichier. Vérifiez que le bucket 'documents' existe.");
      }
      return null;
    }
  };

  const markNotificationAsRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) {
      console.error("Mark Notification Error:", error);
      toast.error("Erreur lors de la mise à jour de la notification");
    } else fetchData(true);
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', currentUser.id)
      .eq('read', false);
      
    if (error) {
      console.error("Mark All As Read Error:", error);
      toast.error("Erreur lors de la mise à jour des notifications");
    } else fetchData(true);
  };

  const clearNotifications = async () => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', currentUser.id);
      
    if (error) {
      console.error("Clear Notifications Error:", error);
      toast.error("Erreur lors de la suppression des notifications");
    } else fetchData(true);
  };

  const addDocument = async (doc: DocumentItem) => {
    const { error } = await supabase.from('documents').insert([toSnakeCase(doc)]);
    if (error) {
      console.error("Add Document Error:", error);
      toast.error("Erreur lors de l'ajout du document");
    } else fetchData(true);
  };

  const deleteDocument = async (id: string) => {
    // Find the document to get its storage path
    const doc = data.documents.find(d => d.id === id);
    
    // Optimistic update
    setData(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.id !== id),
      clients: prev.clients.map(c => ({
        ...c,
        documents: (c.documents || []).filter(d => d.id !== id)
      }))
    }));

    try {
      // 1. Delete from database
      const { error: dbError } = await supabase.from('documents').delete().eq('id', id);
      if (dbError) throw dbError;

      // 2. Try to delete from storage if we have a URL
      if (doc?.url) {
        // Extract filename from URL (assuming it's a Supabase public URL)
        const fileName = doc.url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('documents').remove([fileName]);
        }
      }

      toast.success("Document supprimé");
      fetchData(true);
    } catch (error) {
      console.error("Delete Document Error:", error);
      toast.error("Erreur lors de la suppression du document");
      fetchData(true); // Rollback
    }
  };

  const addTeamMember = async (member: TeamMember) => {
    const { error } = await supabase.from('users').insert([toSnakeCase(member)]);
    if (error) {
      console.error("Add Team Member Error:", error);
      toast.error("Erreur lors de l'ajout du membre");
    } else fetchData(true);
  };

  const updateTeamMember = async (id: string, updates: Partial<TeamMember>) => {
    const { id: _, ...cleanUpdates } = updates as any;
    const { error } = await supabase.from('users').update(toSnakeCase(cleanUpdates)).eq('id', id);
    if (error) {
      console.error("Update Team Member Error:", error);
      toast.error("Erreur lors de la mise à jour du membre");
    } else fetchData(true);
  };

  const deleteTeamMember = async (id: string) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error("Delete Team Member Error:", error);
      toast.error("Erreur lors de la suppression du membre");
    } else fetchData(true);
  };

  const updateCurrentUser = async (updates: Partial<TeamMember>) => {
    if (!currentUser) return;
    
    // Optimistic update
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);

    const { id: _, ...cleanUpdates } = updates as any;
    const { error } = await supabase.from('users').update(toSnakeCase(cleanUpdates)).eq('id', currentUser.id);
    
    if (error) {
      console.error("Update Current User Error:", error);
      toast.error("Erreur lors de la mise à jour de votre profil");
      // Rollback
      const { data: user } = await supabase.from('users').select('*').eq('id', currentUser.id).single();
      if (user) setCurrentUser(toCamelCase(user));
    } else {
      if (!updates.checkInTime && !updates.checkOutTime) {
        toast.success("Profil mis à jour");
      }
      fetchData(true);
    }
  };

  const checkIn = async () => {
    if (!currentUser) return;
    const now = new Date();
    const checkInTime = now.toISOString();
    const date = now.toISOString().split('T')[0];
    
    let pointsToAdd = 0;
    
    // Punctuality rules
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    // On time: 7:00 AM (420 min) to 8:10 AM (490 min)
    if (timeInMinutes >= 420 && timeInMinutes <= 490) {
      pointsToAdd = 10;
      toast.success("Ponctuel ! +10 pts");
    } 
    // Late: 8:11 AM (491 min) to 4:00 PM (960 min)
    else if (timeInMinutes > 490 && timeInMinutes <= 960) {
      pointsToAdd = -10;
      toast.error("En retard ! -10 pts");
    }

    await updateCurrentUser({
      checkInTime,
      isCurrentlyCheckedIn: true,
      totalPointsBalance: (currentUser.totalPointsBalance || 0) + pointsToAdd
    });

    // Log history
    try {
      await supabase.from('attendance').insert(toSnakeCase({
        id: uuidv4(),
        userId: currentUser.id,
        userName: currentUser.name,
        checkIn: checkInTime,
        date,
        pointsEarned: pointsToAdd
      }));
    } catch (e) {
      console.error("Error logging attendance:", e);
    }

    await notifyManagers(
      "Check-in Agent",
      `${currentUser.name} vient de pointer à ${now.toLocaleTimeString('fr-DZ')} (${pointsToAdd >= 0 ? '+' : ''}${pointsToAdd} pts)`,
      pointsToAdd >= 0 ? "info" : "warning"
    );
    
    toast.success("Pointage effectué ! Bonne journée.");
    fetchData(true);
  };

  const checkOut = async () => {
    if (!currentUser) return;
    const now = new Date();
    const checkOutTime = now.toISOString();
    const date = now.toISOString().split('T')[0];

    let pointsToAdd = 0;
    
    // Overtime rules (Working hours end at 4:00 PM / 16:00)
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    const endOfDayMinutes = 16 * 60; // 4:00 PM

    const overtimeMinutes = timeInMinutes - endOfDayMinutes;

    if (overtimeMinutes >= 60) {
      pointsToAdd = 50;
      toast.success("Overtime (1h+) ! +50 pts");
    } else if (overtimeMinutes >= 30) {
      pointsToAdd = 30;
      toast.success("Overtime (30m+) ! +30 pts");
    } else if (overtimeMinutes >= 15) {
      pointsToAdd = 15;
      toast.success("Overtime (15m+) ! +15 pts");
    }

    await updateCurrentUser({
      checkOutTime,
      isCurrentlyCheckedIn: false,
      totalPointsBalance: (currentUser.totalPointsBalance || 0) + pointsToAdd
    });

    // Update history
    try {
      const { data: existing } = await supabase
        .from('attendance')
        .select('id, points_earned')
        .eq('user_id', currentUser.id)
        .eq('date', date)
        .order('check_in', { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase.from('attendance').update(toSnakeCase({
          checkOut: checkOutTime,
          pointsEarned: (existing[0].points_earned || 0) + pointsToAdd
        })).eq('id', existing[0].id);
      }
    } catch (e) {
      console.error("Error updating attendance:", e);
    }

    await notifyManagers(
      "Check-out Agent",
      `${currentUser.name} a terminé sa journée à ${now.toLocaleTimeString('fr-DZ')} (+${pointsToAdd} pts overtime)`,
      "info"
    );

    toast.success("Dépointage effectué. À demain !");
  };

  const addSourcingWebsite = async (website: SourcingWebsite) => {
    const { error } = await supabase.from('sourcing_websites').insert([toSnakeCase(website)]);
    if (error) {
      console.error("Add Sourcing Website Error:", error);
      toast.error("Erreur lors de l'ajout du site");
    } else fetchData(true);
  };

  const updateSourcingWebsite = async (id: string, updates: Partial<SourcingWebsite>) => {
    const { error } = await supabase.from('sourcing_websites').update(toSnakeCase(updates)).eq('id', id);
    if (error) {
      console.error("Update Sourcing Website Error:", error);
      toast.error("Erreur lors de la mise à jour du site");
    } else fetchData(true);
  };

  const deleteSourcingWebsite = async (id: string) => {
    const { error } = await supabase.from('sourcing_websites').delete().eq('id', id);
    if (error) {
      console.error("Delete Sourcing Website Error:", error);
      toast.error("Erreur lors de la suppression du site");
    } else fetchData(true);
  };

  const addSocialPost = async (post: SocialPost) => {
    const { error } = await supabase.from('social_posts').insert([toSnakeCase(post)]);
    if (error) {
      console.error("Add Social Post Error:", error);
      toast.error("Erreur lors de l'ajout du post");
    } else fetchData(true);
  };

  const updateSocialPost = async (id: string, updates: Partial<SocialPost>) => {
    const oldPost = data.socialPosts.find(p => p.id === id);
    const { error } = await supabase.from('social_posts').update(toSnakeCase(updates)).eq('id', id);
    if (error) {
      console.error("Update Social Post Error:", error);
      toast.error("Erreur lors de la mise à jour du post");
    } else {
      if (updates.status && updates.status !== oldPost?.status) {
        if (oldPost?.createdBy && currentUser?.role === "Manager") {
          await triggerNotification(updates.status === "Scheduled" ? "draft_approved" : "draft_rejected", {
            title: `Post ${updates.status === "Scheduled" ? "Approuvé" : "Mis à jour"}`,
            message: `Votre post pour ${oldPost.platform} a été ${updates.status === "Scheduled" ? "approuvé" : "modifié"} par le manager`,
            type: updates.status === "Scheduled" ? "success" : "info",
            userId: oldPost.createdBy,
            sourceId: id,
            sourceType: "Task"
          });
        }
      }
      fetchData(true);
    }
  };

  const deleteSocialPost = async (id: string) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      socialPosts: prev.socialPosts.filter(p => p.id !== id)
    }));

    const { error } = await supabase.from('social_posts').delete().eq('id', id);
    if (error) {
      console.error("Delete Social Post Error:", error);
      toast.error("Erreur lors de la suppression du post");
      fetchData(true); // Rollback
      throw error;
    } else fetchData(true);
  };

  const addCampaign = async (campaign: Campaign) => {
    // Optimistic update
    setData(prev => ({ ...prev, campaigns: [...prev.campaigns, campaign] }));

    const { error } = await supabase.from('campaigns').insert([toSnakeCase(campaign)]);
    if (error) {
      console.error("Add Campaign Error:", error);
      toast.error("Erreur lors de l'ajout de la campagne");
      fetchData(true); // Rollback
    } else fetchData(true);
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    const oldCampaign = data.campaigns.find(c => c.id === id);
    // Optimistic update
    setData(prev => ({
      ...prev,
      campaigns: prev.campaigns.map(c => c.id === id ? { ...c, ...updates } : c)
    }));

    const { error } = await supabase.from('campaigns').update(toSnakeCase(updates)).eq('id', id);
    if (error) {
      console.error("Update Campaign Error:", error);
      toast.error("Erreur lors de la mise à jour de la campagne");
      fetchData(true); // Rollback
    } else {
      if (updates.status === "Terminée" && oldCampaign?.status !== "Terminée") {
        await triggerNotification("campaign_completed", {
          title: "Campagne Terminée",
          message: `La campagne "${oldCampaign?.name}" a été marquée comme terminée par l'SMM`,
          type: "success",
          sourceId: id,
          sourceType: "Event"
        });
      }
      
      // Budget alert (80%)
      if (updates.budgetDZD && updates.paidAdsCost) {
        const spent = (updates.paidAdsCost || 0) + (updates.contentCreationCost || 0) + (updates.otherCosts || 0);
        if (spent >= updates.budgetDZD * 0.8) {
          await triggerNotification("budget_alert", {
            title: "Alerte Budget Campagne",
            message: `Le budget de la campagne "${oldCampaign?.name}" est utilisé à plus de 80%`,
            type: "warning",
            userId: currentUser?.id, // SMM themselves should see this
            sourceId: id,
            sourceType: "Event"
          });
        }
      }
      fetchData(true);
    }
  };

  const deleteCampaign = async (id: string) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      campaigns: prev.campaigns.filter(c => c.id !== id)
    }));

    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) {
      console.error("Delete Campaign Error:", error);
      toast.error("Erreur lors de la suppression de la campagne");
      fetchData(true); // Rollback
    } else fetchData(true);
  };

  const addContentIdea = async (idea: ContentIdea) => {
    // Optimistic update
    setData(prev => ({ ...prev, contentIdeas: [...prev.contentIdeas, idea] }));

    const { error } = await supabase.from('content_ideas').insert([toSnakeCase(idea)]);
    if (error) {
      console.error("Add Content Idea Error:", error);
      toast.error("Erreur lors de l'ajout de l'idée");
      fetchData(true); // Rollback
    } else fetchData(true);
  };

  const updateContentIdea = async (id: string, updates: Partial<ContentIdea>) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      contentIdeas: prev.contentIdeas.map(i => i.id === id ? { ...i, ...updates } : i)
    }));

    const { error } = await supabase.from('content_ideas').update(toSnakeCase(updates)).eq('id', id);
    if (error) {
      console.error("Update Content Idea Error:", error);
      toast.error("Erreur lors de la mise à jour de l'idée");
      fetchData(true); // Rollback
    } else fetchData(true);
  };

  const deleteContentIdea = async (id: string) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      contentIdeas: prev.contentIdeas.filter(i => i.id !== id)
    }));

    const { error } = await supabase.from('content_ideas').delete().eq('id', id);
    if (error) {
      console.error("Delete Content Idea Error:", error);
      toast.error("Erreur lors de la suppression de l'idée");
      fetchData(true); // Rollback
      throw error;
    } else fetchData(true);
  };

  const resetPoints = async (userId: string) => {
    if (currentUser?.role !== "Manager") return;

    const user = data.team.find(u => u.id === userId);
    if (!user) return;

    const currentPoints = user.totalPointsBalance || 0;
    const now = new Date().toISOString();

    // Optimistic update
    setData(prev => ({
      ...prev,
      team: prev.team.map(u => u.id === userId ? { ...u, totalPointsBalance: 0, lastResetDate: now } : u)
    }));

    // 1. Update user
    const { error: userError } = await supabase.from('users').update({
      total_points_balance: 0,
      last_reset_date: now
    }).eq('id', userId);

    if (userError) {
      console.error("Reset Points Error:", userError);
      toast.error("Erreur lors de la réinitialisation des points");
      fetchData(true); // Rollback
      return;
    }

    // 2. Log history (if points_history table exists, otherwise skip or handle error gracefully)
    // Assuming points_history table exists as per prompt requirement
    try {
      await supabase.from('points_history').insert({
        id: uuidv4(),
        user_id: userId,
        action: "Points réinitialisés par le manager",
        points: -currentPoints,
        source_type: "reset",
        created_at: now
      });
    } catch (e) {
      console.warn("Could not log points history (table might not exist yet)", e);
    }

    toast.success(`Points de ${user.name} réinitialisés avec succès`);
    fetchData(true);
  };

  const addSupplier = async (supplier: Supplier) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .insert([toSnakeCase(supplier)]);

      if (error) throw error;
      
      setData((prev) => ({ ...prev, suppliers: [...prev.suppliers, supplier] }));
      
      // Notify manager about new supplier
      if (currentUser?.role !== 'Manager') {
        await notifyManagers(
          "Nouveau Fournisseur",
          `${currentUser?.name || 'Un utilisateur'} a ajouté le fournisseur ${supplier.companyName}`,
          "info"
        );
      }
      
      toast.success("Fournisseur ajouté avec succès");
    } catch (error: any) {
      console.error("Error adding supplier:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update(toSnakeCase(updates))
        .eq('id', id);

      if (error) throw error;
      
      setData((prev) => ({
        ...prev,
        suppliers: prev.suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      }));
      toast.success("Fournisseur mis à jour");
    } catch (error: any) {
      console.error("Error updating supplier:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setData((prev) => ({
        ...prev,
        suppliers: prev.suppliers.filter((s) => s.id !== id),
        supplierOrders: prev.supplierOrders.filter((o) => o.supplierId !== id)
      }));
      toast.success("Fournisseur supprimé");
    } catch (error: any) {
      console.error("Error deleting supplier:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const addSupplierOrder = async (order: SupplierOrder) => {
    try {
      const { error } = await supabase
        .from('supplier_orders')
        .insert([toSnakeCase(order)]);

      if (error) throw error;
      
      setData((prev) => {
        // Update supplier stats
        const supplier = prev.suppliers.find(s => s.id === order.supplierId);
        const updatedSuppliers = prev.suppliers.map(s => {
          if (s.id === order.supplierId) {
            return {
              ...s,
              totalOrders: (s.totalOrders || 0) + 1,
              totalSpent: (s.totalSpent || 0) + order.totalAmount
            };
          }
          return s;
        });

        return { 
          ...prev, 
          supplierOrders: [...prev.supplierOrders, order],
          suppliers: updatedSuppliers
        };
      });
      
      // Update supplier stats in DB
      const supplier = data.suppliers.find(s => s.id === order.supplierId);
      if (supplier) {
        await supabase
          .from('suppliers')
          .update({
            total_orders: (supplier.totalOrders || 0) + 1,
            total_spent: (supplier.totalSpent || 0) + order.totalAmount
          })
          .eq('id', order.supplierId);
      }

      toast.success("Commande ajoutée avec succès");
    } catch (error: any) {
      console.error("Error adding supplier order:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const updateSupplierOrder = async (id: string, updates: Partial<SupplierOrder>) => {
    try {
      const oldOrder = data.supplierOrders.find(o => o.id === id);
      
      const { error } = await supabase
        .from('supplier_orders')
        .update(toSnakeCase(updates))
        .eq('id', id);

      if (error) throw error;
      
      setData((prev) => {
        let updatedSuppliers = prev.suppliers;
        
        // If amount changed, update supplier total spent
        if (updates.totalAmount !== undefined && oldOrder && oldOrder.totalAmount !== updates.totalAmount) {
          const diff = updates.totalAmount - oldOrder.totalAmount;
          updatedSuppliers = prev.suppliers.map(s => {
            if (s.id === oldOrder.supplierId) {
              return {
                ...s,
                totalSpent: (s.totalSpent || 0) + diff
              };
            }
            return s;
          });
          
          // Update in DB
          const supplier = prev.suppliers.find(s => s.id === oldOrder.supplierId);
          if (supplier) {
            supabase
              .from('suppliers')
              .update({ total_spent: (supplier.totalSpent || 0) + diff })
              .eq('id', oldOrder.supplierId);
          }
        }
        
        return {
          ...prev,
          supplierOrders: prev.supplierOrders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
          suppliers: updatedSuppliers
        };
      });
      
      // Notify if order is late
      if (updates.status && updates.status !== 'Livré' && oldOrder?.deliveryDate) {
        const { isBefore, isToday } = await import('date-fns');
        const deliveryDate = new Date(oldOrder.deliveryDate);
        if (isBefore(deliveryDate, new Date()) && !isToday(deliveryDate)) {
          const supplier = data.suppliers.find(s => s.id === oldOrder.supplierId);
          await notifyManagers(
            "Commande Fournisseur en Retard",
            `La commande pour ${supplier?.companyName || 'un fournisseur'} prévue le ${deliveryDate.toLocaleDateString()} est en retard.`,
            "warning"
          );
        }
      }

      toast.success("Commande mise à jour");
    } catch (error: any) {
      console.error("Error updating supplier order:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const deleteSupplierOrder = async (id: string) => {
    try {
      const oldOrder = data.supplierOrders.find(o => o.id === id);
      
      const { error } = await supabase
        .from('supplier_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setData((prev) => {
        let updatedSuppliers = prev.suppliers;
        
        // Update supplier stats
        if (oldOrder) {
          updatedSuppliers = prev.suppliers.map(s => {
            if (s.id === oldOrder.supplierId) {
              return {
                ...s,
                totalOrders: Math.max(0, (s.totalOrders || 0) - 1),
                totalSpent: Math.max(0, (s.totalSpent || 0) - oldOrder.totalAmount)
              };
            }
            return s;
          });
          
          // Update in DB
          const supplier = prev.suppliers.find(s => s.id === oldOrder.supplierId);
          if (supplier) {
            supabase
              .from('suppliers')
              .update({ 
                total_orders: Math.max(0, (supplier.totalOrders || 0) - 1),
                total_spent: Math.max(0, (supplier.totalSpent || 0) - oldOrder.totalAmount)
              })
              .eq('id', oldOrder.supplierId);
          }
        }

        return {
          ...prev,
          supplierOrders: prev.supplierOrders.filter((o) => o.id !== id),
          suppliers: updatedSuppliers
        };
      });
      toast.success("Commande supprimée");
    } catch (error: any) {
      console.error("Error deleting supplier order:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const addBasePrice = async (basePrice: BasePrice) => {
    try {
      const { error } = await supabase
        .from('base_prices')
        .insert([toSnakeCase(basePrice)]);

      if (error) throw error;
      
      setData((prev) => ({ ...prev, basePrices: [...prev.basePrices, basePrice] }));
      toast.success("Prix de base ajouté");
    } catch (error: any) {
      console.error("Error adding base price:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const updateBasePrice = async (id: string, updates: Partial<BasePrice>) => {
    try {
      const { error } = await supabase
        .from('base_prices')
        .update(toSnakeCase(updates))
        .eq('id', id);

      if (error) throw error;
      
      setData((prev) => ({
        ...prev,
        basePrices: prev.basePrices.map((bp) => (bp.id === id ? { ...bp, ...updates } : bp)),
      }));
      toast.success("Prix de base mis à jour");
    } catch (error: any) {
      console.error("Error updating base price:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const deleteBasePrice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('base_prices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setData((prev) => ({
        ...prev,
        basePrices: prev.basePrices.filter((bp) => bp.id !== id),
      }));
      toast.success("Prix de base supprimé");
    } catch (error: any) {
      console.error("Error deleting base price:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const addStaff = async (staff: Staff) => {
    try {
      const { error } = await supabase
        .from('staff')
        .insert([toSnakeCase(staff)]);

      if (error) throw error;
      
      setData((prev) => ({ ...prev, staff: [...prev.staff, staff] }));
      toast.success("Membre du staff ajouté avec succès");
    } catch (error: any) {
      console.error("Add Staff Error:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const updateStaff = async (id: string, updates: Partial<Staff>) => {
    try {
      const { id: _, ...cleanUpdates } = updates as any;
      const { error } = await supabase
        .from('staff')
        .update(toSnakeCase(cleanUpdates))
        .eq('id', id);

      if (error) throw error;
      
      setData((prev) => ({
        ...prev,
        staff: prev.staff.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      }));
      toast.success("Profil staff mis à jour");
    } catch (error: any) {
      console.error("Update Staff Error:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setData((prev) => ({
        ...prev,
        staff: prev.staff.filter((s) => s.id !== id),
        staffAssignments: prev.staffAssignments.filter((a) => a.staffId !== id)
      }));
      toast.success("Membre du staff supprimé");
    } catch (error: any) {
      console.error("Delete Staff Error:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const addStaffAssignment = async (assignment: StaffAssignment) => {
    try {
      const { error } = await supabase
        .from('staff_assignments')
        .insert([toSnakeCase(assignment)]);

      if (error) throw error;
      
      setData((prev) => {
        const staffMember = prev.staff.find(s => s.id === assignment.staffId);
        const updatedStaff = prev.staff.map(s => {
          if (s.id === assignment.staffId) {
            return {
              ...s,
              totalEvents: (s.totalEvents || 0) + 1
            };
          }
          return s;
        });

        if (staffMember) {
          supabase
            .from('staff')
            .update({ total_events: (staffMember.totalEvents || 0) + 1 })
            .eq('id', assignment.staffId);
        }

        return {
          ...prev,
          staffAssignments: [...prev.staffAssignments, assignment],
          staff: updatedStaff
        };
      });
      toast.success("Affectation ajoutée avec succès");
    } catch (error: any) {
      console.error("Add Staff Assignment Error:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const updateStaffAssignment = async (id: string, updates: Partial<StaffAssignment>) => {
    try {
      const { id: _, ...cleanUpdates } = updates as any;
      const { error } = await supabase
        .from('staff_assignments')
        .update(toSnakeCase(cleanUpdates))
        .eq('id', id);

      if (error) throw error;
      
      setData((prev) => ({
        ...prev,
        staffAssignments: prev.staffAssignments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      }));
      toast.success("Affectation mise à jour");
    } catch (error: any) {
      console.error("Update Staff Assignment Error:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const deleteStaffAssignment = async (id: string) => {
    try {
      const oldAssignment = data.staffAssignments.find(a => a.id === id);
      const { error } = await supabase
        .from('staff_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setData((prev) => {
        let updatedStaff = prev.staff;
        if (oldAssignment) {
          updatedStaff = prev.staff.map(s => {
            if (s.id === oldAssignment.staffId) {
              return {
                ...s,
                totalEvents: Math.max(0, (s.totalEvents || 0) - 1)
              };
            }
            return s;
          });

          const staffMember = prev.staff.find(s => s.id === oldAssignment.staffId);
          if (staffMember) {
            supabase
              .from('staff')
              .update({ total_events: Math.max(0, (staffMember.totalEvents || 0) - 1) })
              .eq('id', oldAssignment.staffId);
          }
        }

        return {
          ...prev,
          staffAssignments: prev.staffAssignments.filter((a) => a.id !== id),
          staff: updatedStaff
        };
      });
      toast.success("Affectation supprimée");
    } catch (error: any) {
      console.error("Delete Staff Assignment Error:", error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const checkAutomatedNotifications = async () => {
    if (!currentUser || data.team.length === 0) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Inactive Leads (14+ days)
    for (const lead of data.leads) {
      if (lead.stage === "Gagné" || lead.stage === "Perdu") continue;
      
      const lastInteraction = data.interactions
        .filter(i => i.leadId === lead.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      const lastDate = lastInteraction ? new Date(lastInteraction.createdAt) : new Date(lead.createdAt);
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 14) {
        const alreadyNotified = data.notifications.some(n => 
          n.userId === lead.assignedTo && 
          n.sourceId === lead.id && 
          n.title === "Lead Inactif" &&
          n.createdAt.startsWith(todayStr)
        );

        if (!alreadyNotified && lead.assignedTo) {
          await triggerNotification("inactive_lead", {
            title: "Lead Inactif",
            message: `Le lead ${lead.companyName} est inactif depuis ${diffDays} jours`,
            userId: lead.assignedTo,
            sourceId: lead.id,
            sourceType: "Lead",
            type: "warning",
            actionBy: null // System notification
          });
        }
      }
    }

    // 2. Tasks Due Today & Overdue
    for (const task of data.tasks) {
      if (task.completed) continue;
      
      const dueDate = new Date(task.dueDate);
      const isDueToday = dueDate.toISOString().split('T')[0] === todayStr;
      const isOverdue = dueDate < now && !isDueToday;

      if (isDueToday) {
        const alreadyNotified = data.notifications.some(n => 
          n.userId === task.assignedTo && 
          n.sourceId === task.id && 
          n.title === "Tâche à faire aujourd'hui" &&
          n.createdAt.startsWith(todayStr)
        );

        if (!alreadyNotified && task.assignedTo) {
          await triggerNotification("task_assigned", {
            title: "Tâche à faire aujourd'hui",
            message: `La tâche "${task.title}" est à faire aujourd'hui`,
            userId: task.assignedTo,
            sourceId: task.id,
            sourceType: "Task",
            actionBy: null // System notification
          });
        }
      } else if (isOverdue) {
        const alreadyNotified = data.notifications.some(n => 
          n.userId === task.assignedTo && 
          n.sourceId === task.id && 
          n.title === "Tâche en retard" &&
          n.createdAt.startsWith(todayStr)
        );

        if (!alreadyNotified && task.assignedTo) {
          await triggerNotification("task_assigned", {
            title: "Tâche en retard",
            message: `La tâche "${task.title}" est en retard !`,
            userId: task.assignedTo,
            sourceId: task.id,
            sourceType: "Task",
            type: "error",
            actionBy: null // System notification
          });
        }
      }
    }

    // 3. Events 7 days away (incomplete checklist)
    for (const event of data.events) {
      const eventDate = new Date(event.date);
      const diffDays = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 7) {
        const alreadyNotified = data.notifications.some(n => 
          n.sourceId === event.id && 
          n.title === "Événement proche" &&
          n.createdAt.startsWith(todayStr)
        );

        if (!alreadyNotified) {
          const client = data.clients.find(c => c.id === event.clientId);
          await triggerNotification("event_checklist_incomplete", {
            title: "Événement proche",
            message: `L'événement "${event.eventName}" est dans 7 jours. Vérifiez la checklist !`,
            userId: client?.assignedTo,
            sourceId: event.id,
            sourceType: "Event",
            type: "warning",
            actionBy: null // System notification
          });
        }
      }
    }

    // 4. SMM Reminders
    if (currentUser.role === "Social Media Manager") {
      for (const post of data.socialPosts) {
        if (post.status !== "Scheduled") continue;
        const postDate = new Date(post.scheduledDate);
        const diffHours = (postDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (diffHours > 0 && diffHours <= 2) {
          const alreadyNotified = data.notifications.some(n => 
            n.sourceId === post.id && 
            n.title === "Rappel de publication" &&
            n.createdAt.startsWith(todayStr)
          );

          if (!alreadyNotified) {
            await triggerNotification("post_reminder", {
              title: "Rappel de publication",
              message: `Votre post est prévu dans moins de 2 heures`,
              userId: currentUser.id,
              sourceId: post.id,
              sourceType: "Task",
              actionBy: null // System notification
            });
          }
        }
      }
    }

    // 5. Client Event 14 days away (reminder to push promotional content)
    for (const event of data.events) {
      const eventDate = new Date(event.date);
      const diffDays = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 14) {
        const alreadyNotified = data.notifications.some(n => 
          n.sourceId === event.id && 
          n.title === "Promotion Événement" &&
          n.createdAt.startsWith(todayStr)
        );

        if (!alreadyNotified) {
          const smms = data.team.filter(m => m.role === "Social Media Manager");
          for (const smm of smms) {
            await triggerNotification("new_event", {
              title: "Promotion Événement",
              message: `L'événement "${event.eventName}" est dans 14 jours. Pensez à la promotion !`,
              userId: smm.id,
              sourceId: event.id,
              sourceType: "Event",
              actionBy: null // System notification
            });
          }
        }
      }
    }
  };

  useEffect(() => {
    const cleanupNotifications = async () => {
      // RULE 9 — Clean up existing wrong notifications in the database
      // Fetch all to check self-notifications and wrong recipients
      const { data: badNotifs } = await supabase
        .from('notifications')
        .select('id, user_id, action_by, title');
      
      if (badNotifs) {
        const toDelete = badNotifs.filter(n => 
          n.user_id === n.action_by || 
          (n.title === 'Nouveau Lead' && !data.team.find(u => u.id === n.user_id && u.role === 'Manager'))
        ).map(n => n.id);
        
        if (toDelete.length > 0) {
          await supabase.from('notifications').delete().in('id', toDelete);
          fetchData(true);
        }
      }
    };

    if (!loading && data.team.length > 0) {
      cleanupNotifications();
    }
  }, [loading, data.team.length]);

  useEffect(() => {
    if (!loading && data.team.length > 0) {
      checkAutomatedNotifications();
    }
  }, [loading, data.team.length]);

  return (
    <StoreContext.Provider
      value={{
        data,
        loading,
        isInitialFetchDone,
        language,
        setLanguage,
        currentUser,
        login,
        logout,
        addLead,
        bulkAddLeads,
        updateLead,
        deleteLead,
        addClient,
        updateClient,
        deleteClient,
        updateCompanySettings,
        addOffer,
        updateOffer,
        deleteOffer,
        addTask,
        updateTask,
        reorderTasks,
        deleteTask,
        addEvent,
        updateEvent,
        deleteEvent,
        addExpectedRevenue,
        updateExpectedRevenue,
        deleteExpectedRevenue,
        addNotification,
        markNotificationAsRead,
        markAllAsRead,
        clearNotifications,
        addDocument,
        deleteDocument,
        uploadFile,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        updateCurrentUser,
        getUsersByRole,
        notifyManagers,
        logInteraction,
        checkIn,
        checkOut,
        addSourcingWebsite,
        updateSourcingWebsite,
        deleteSourcingWebsite,
        addSocialPost,
        updateSocialPost,
        deleteSocialPost,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        addContentIdea,
        updateContentIdea,
        deleteContentIdea,
        resetPoints,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addSupplierOrder,
        updateSupplierOrder,
        deleteSupplierOrder,
        addBasePrice,
        updateBasePrice,
        deleteBasePrice,
        addStaff,
        updateStaff,
        deleteStaff,
        addStaffAssignment,
        updateStaffAssignment,
        deleteStaffAssignment,
        submitStaffApplication,
        fetchData,
        searchTarget,
        setSearchTarget,
        currentPage,
        setCurrentPage
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
