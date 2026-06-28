export type LeadStage =
  | "Nouveau"
  | "Contacté"
  | "Démo Planifiée"
  | "Devis Envoyé"
  | "Négociation"
  | "Gagné"
  | "Perdu";

export type ServiceType =
  | "Plateforme uniquement"
  | "Opérations sur site"
  | "Package complet";

export type Priority = "Haute" | "Moyenne" | "Basse";

export type OfferStatus = "En attente" | "Accepté" | "Rejeté";

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  additionalEmails?: string[];
  eventDate: string;
  estimatedValue: number;
  serviceType: ServiceType;
  stage: LeadStage;
  createdAt: string;
  convertedToClientId?: string;
  notes?: string;
  notesHistory?: { id: string; text: string; createdAt: string; createdBy: string; }[];
  score?: number;
  assignedTo?: string;
  createdBy?: string;
  source?: "Direct" | "LinkedIn" | "Referral" | "Other" | "Instagram" | "Facebook" | "Google" | "Cold Email" | "Salon";
  pointsAwardedForQualification?: boolean;
  pointsAwardedForOfferStage?: boolean;
  website?: string;
  eventName?: string;
  // Financial details
  rc?: string;
  nif?: string;
  nis?: string;
  art?: string;
  rib?: string;
  bankName?: string;
}

export interface Client {
  id: string;
  companyName: string;
  sector: string;
  contactPerson: string;
  phone: string;
  email: string;
  additionalEmails?: string[];
  wilaya: string;
  notes: string;
  notesHistory?: { id: string; text: string; createdAt: string; createdBy: string; }[];
  createdAt: string;
  convertedFromLeadId?: string;
  documents?: DocumentItem[];
  revenue?: number;
  assignedTo?: string;
  // Financial details
  rc?: string;
  nif?: string;
  nis?: string;
  art?: string;
  rib?: string;
  bankName?: string;
  address?: string;
}

export type DocumentType = "Devis" | "Facture" | "Facture Proforma";

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  rc?: string;
  nif?: string;
  nis?: string;
  art?: string;
  rib?: string;
  bankName?: string;
  logoUrl?: string;
}

export interface Offer {
  id: string;
  relatedToId: string;
  relatedToType: "Client" | "Lead";
  documentType?: DocumentType;
  eventName?: string;
  eventDate?: string;
  attendees?: number;
  servicesIncluded: string[];
  customServices?: { name: string; price: number; quantity: number }[];
  price: number;
  status: OfferStatus;
  followUpDate: string;
  createdAt: string;
  attachmentName?: string;
  attachmentUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  relatedToId?: string; // Lead ID, Client ID, or Platform Name
  relatedToType?: "Lead" | "Client" | "Plateforme";
  dueDate: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
  assignedTo?: string;
  order?: number;
}

export interface EventLog {
  id: string;
  clientId: string;
  eventName: string;
  date: string;
  wilaya: string;
  attendees: number;
  badgesPrinted: number;
  servicesDelivered: string[];
  satisfactionRating: number; // 1-5
  createdAt: string;
}

export interface ExpectedRevenue {
  id: string;
  year: number;
  month: number;
  amount: number;
}

export type NotificationType = "info" | "success" | "warning" | "error";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  userId?: string; // Target user ID
  sourceId?: string; // ID of the related entity
  sourceType?: "Lead" | "Client" | "Task" | "Offer" | "Event";
  actionBy?: string; // User ID who triggered the notification
}

export type Page =
  | "Dashboard"
  | "Leads"
  | "Clients"
  | "FinancialDocuments"
  | "Events"
  | "Tasks"
  | "Settings"
  | "Documents"
  | "Team"
  | "Instructions"
  | "SocialMediaHub"
  | "SocialStudio"
  | "Suppliers"
  | "Recruitment";

export interface DocumentItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  createdAt: string;
  clientId?: string;
  relatedToId?: string;
  relatedToType?: "Lead" | "Client" | "Event" | "Offer" | "Task";
}

export type CallOutcome = 
  | "Reached" 
  | "No Answer" 
  | "Not Interested" 
  | "Interested" 
  | "Meeting Scheduled" 
  | "Busy" 
  | "Wrong Number";

export interface Interaction {
  id: string;
  leadId?: string;
  clientId?: string;
  type: "Phone Call" | "Email" | "Meeting" | "Note" | "LinkedIn Message";
  outcome?: CallOutcome;
  notes: string;
  actionBy: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: "Manager" | "Sales Agent" | "Social Media Manager";
  email: string;
  password?: string;
  avatar?: string;
  target?: number;
  isActive?: boolean;
  createdAt: string;
  // Gamification fields
  totalPointsBalance: number;
  lastResetDate: string; // ISO date string
  checkInTime?: string; // ISO string
  checkOutTime?: string; // ISO string
  isCurrentlyCheckedIn: boolean;
}

export interface SourcingWebsite {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  createdAt: string;
}

export type SocialPlatform = "LinkedIn" | "Instagram" | "Facebook";
export type PostStatus = "Draft" | "Scheduled" | "Published";
export type ContentIdeaStatus = "Idea" | "In Progress" | "Ready" | "Published";

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  caption: string;
  attachmentUrl?: string;
  scheduledDate: string; // ISO string
  status: PostStatus;
  createdAt: string;
  createdBy: string;
}

export type CampaignStatus = "Planifiée" | "En cours" | "Terminée" | "Annulée";

export interface Campaign {
  id: string;
  name: string;
  platform: SocialPlatform;
  status: CampaignStatus;
  contentType?: string;
  budgetDZD: number;
  paidAdsCost?: number;
  contentCreationCost?: number;
  otherCosts?: number;
  startDate: string;
  endDate: string;
  targetLeads?: number;
  targetClicks?: number;
  actualClicks?: number;
  leadsGenerated: number;
  notes?: string;
  url?: string;
  createdAt: string;
  createdBy: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  platform: SocialPlatform;
  priority: Priority;
  status: ContentIdeaStatus;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  category: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  wilaya?: string;
  website?: string;
  description?: string;
  servicesProvided: string[];
  contractStatus: "Aucun" | "Actif" | "En négociation" | "Expiré" | "Résilié";
  contractStartDate?: string;
  contractEndDate?: string;
  contractUrl?: string;
  paymentTerms?: string;
  priceList: { serviceName: string; unit: string; price: number; notes?: string }[];
  rating: number;
  totalOrders: number;
  totalSpent: number;
  isPreferred: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface SupplierOrder {
  id: string;
  supplierId: string;
  eventId?: string;
  orderDate: string;
  deliveryDate?: string;
  items: { itemName: string; quantity: number; unitPrice: number; total: number }[];
  totalAmount: number;
  status: "En attente" | "Confirmé" | "En livraison" | "Livré" | "Annulé";
  paymentStatus: "Non payé" | "Partiellement payé" | "Payé";
  invoiceUrl?: string;
  contractUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface BasePrice {
  id: string;
  name: string;
  category: string;
  price: number;
  supplierId: string;
  notes?: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  staffType: string;
  phone: string;
  email?: string;
  age?: number;
  wilaya?: string;
  address?: string;
  profilePhotoUrl?: string;
  idCardNumber?: string;
  languages?: string[];
  clothingSize?: string;
  shoeSize?: string;
  experienceYears: number;
  specializations?: string[];
  availability: string;
  dailyRateDzd?: number;
  halfDayRateDzd?: number;
  rating: number;
  totalEvents: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface StaffAssignment {
  id: string;
  staffId: string;
  eventId?: string;
  eventName: string;
  eventDate: string;
  eventLocation?: string;
  roleAtEvent?: string;
  performanceRating?: number;
  managerNotes?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  checkIn: string;
  checkOut?: string;
  date: string; // YYYY-MM-DD
  pointsEarned: number;
}

export interface AppData {
  leads: Lead[];
  clients: Client[];
  offers: Offer[];
  tasks: Task[];
  events: EventLog[];
  expectedRevenues: ExpectedRevenue[];
  notifications: AppNotification[];
  documents: DocumentItem[];
  team: TeamMember[];
  interactions: Interaction[];
  sourcingWebsites: SourcingWebsite[];
  socialPosts: SocialPost[];
  campaigns: Campaign[];
  contentIdeas: ContentIdea[];
  attendance: AttendanceRecord[];
  suppliers: Supplier[];
  supplierOrders: SupplierOrder[];
  basePrices: BasePrice[];
  staff: Staff[];
  staffAssignments: StaffAssignment[];
  companySettings?: CompanySettings;
}

export interface StaffApplication {
  id: string;
  firstName: string;
  lastName: string;
  gender: "Homme" | "Femme";
  phone: string;
  email: string;
  age: number;
  wilaya: string;
  height?: number;
  weight?: number;
  languages: string[];
  experience: string;
  photoUrls: string[];
  status: "Nouveau" | "En attente" | "Accepté" | "Rejeté";
  createdAt: string;
}
