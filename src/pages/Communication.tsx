import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "../store/StoreContext";
import { useTranslation } from "../hooks/useTranslation";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import { Select } from "../components/ui/Select";
import {
  Mail,
  Search,
  Plus,
  Copy,
  Check,
  Edit2,
  Trash2,
  Send,
  Monitor,
  Smartphone,
  Eye,
  ChevronRight,
  Info,
  Layers,
  CheckCircle,
  Clock,
  User,
  Sparkles,
  ArrowRight,
  Globe
} from "lucide-react";

interface EmailTemplate {
  id: string;
  title: string;
  subject: string;
  category: "leads" | "clients" | "followup" | "postevent" | "other";
  content: string;
  language: "fr" | "ar" | "en";
  isDefault?: boolean;
}

const PRESET_TEMPLATES: EmailTemplate[] = [
  {
    id: "preset-welcome-fr",
    title: "Premier Contact - Salon / Suivi Expo (FR)",
    subject: "Suivi d'entretien — Eventzone x {companyName}",
    category: "leads",
    language: "fr",
    isDefault: true,
    content: `Bonjour {contactName},

Ce fut un plaisir de vous rencontrer sur notre stand lors du récent salon professionnel à Alger.

Comme convenu, je vous envoie de la documentation sur Eventzone, la première solution de billetterie en ligne et d'impression de badges instantanée en Algérie par SPASU Eventzone. Grâce à notre système de contrôle d'accès ultra-rapide (3 secondes par badge), nous éliminons définitivement les files d'attente lors de vos congrès et salons.

Nos points forts pour votre projet :
- Formulaire d'inscription bilingue (Français/Arabe) s'adaptant à votre charte
- Envoi automatique de billets numériques avec code QR sécurisé
- Équipe de techniciens sur site le jour J avec matériel professionnel dédié

Pouvons-nous fixer un appel de 10 minutes ce lundi ou mardi afin de qualifier vos besoins ?

Bien cordialement,
{agentName}
Équipe Commerciale — Eventzone Alger
contact@eventzone.pro | +213 781 457 511`
  },
  {
    id: "preset-welcome-ar",
    title: "متابعة أولية وترحيب - باللغة العربية (AR)",
    subject: "إيفنت زون Eventzone — متابعة بخصوص خطط فعاليتكم القادمة {companyName}",
    category: "leads",
    language: "ar",
    isDefault: true,
    content: `السيد(ة) {contactName} المحترم(ة)،

سعدنا كثيراً بالتواصل معكم ونشكركم على اهتمامكم بخدمات إيفنت زون (Eventzone) من SPASU لتنظيم وإدارة الفعاليات في الجزائر.

نحن نقدم حلاً احترافياً للمؤتمرات والمنتديات الخاصة بكم:
- استمارات تسجيل مخصصة ثنائية اللغة (العربية والفرنسية) متطابقة مع هويتكم البصرية
- إرسال تذاكر رقمية فورية مجهة برمز الاستجابة السريعة (QR Code) المؤمن
- طباعة الشارات (Badges) في عين المكان خلال 3 ثوانٍ فقط لتجنب الطوابير عند الدخول
- لوحة تحكم فورية لمتابعة الإحصائيات ونسبة الحضور بصفة حية

هل يمكننا ترتيب مكالمة قصيرة (10 دقائق) هذا الأسبوع لمناقشة التفاصيل وتقديم عرض تقني لـ {eventName}؟

تقبلوا منا فائق التقدير والاحترام،
{agentName}
فريق إيفنت زون الجزائر
contact@eventzone.pro | +213 781 457 511`
  },
  {
    id: "preset-firstcall-social-fr",
    title: "Premier Contact - Profil Réseaux Sociaux (FR)",
    subject: "Opportunité d'optimisation de vos événements — {companyName}",
    category: "leads",
    language: "fr",
    isDefault: true,
    content: `Bonjour {contactName},

J'ai récemment suivi les publications de {companyName} sur les réseaux sociaux, notamment concernant vos initiatives et événements corporate à venir. Votre dynamisme sur le marché algérien est remarquable !

Chez Eventzone (par SPASU Eventzone), nous accompagnons les entreprises et institutions en Algérie dans la digitalisation complète de l'accueil de leurs événements (congrès, lancements de produits, salons).

Grâce à notre technologie exclusive :
- Libérez-vous de la gestion des enregistrements avec notre formulaire d'inscription bilingue sur-mesure (Français/Arabe).
- Offrez une expérience premium dès le hall d'entrée avec la génération de billets QR-code et l'impression de badges personnalisés sur site en seulement 3 secondes.
- Suivez en temps réel les statistiques de fréquentation sur votre dashboard sécurisé.

Je serais ravi de vous présenter brièvement comment nous pourrions collaborer sur l'un de vos prochains projets comme {eventName}. Seriez-vous disponible cette semaine pour un échange téléphonique de 5 minutes ?

Bien cordialement,
{agentName}
SPASU Eventzone — Alger
contact@eventzone.pro | +213 781 457 511`
  },
  {
    id: "preset-firstcall-social-ar",
    title: "اتصال أولي - وسائل التواصل الاجتماعي (AR)",
    subject: "تطوير تجربة زوار فعالياتكم — {companyName}",
    category: "leads",
    language: "ar",
    isDefault: true,
    content: `السيد(ة) {contactName} المحترم(ة)،

لقد تابعت باهتمام منشوراتكم الأخيرة على منصات التواصل الاجتماعي بخصوص المبادرات والفعalيات المميزة لشركة {companyName} في الجزائر، وأود أن أهنئكم على هذا النشاط المتميز.

أنا {agentName} من شركة إيفنت زون (Eventzone) التابعة لـ SPASU، رائدة الحلول الرقمية لتنظيم الفعاليات والمؤتمرات بالجزائر. نحن ندرك أهمية الانطباع الأول لضيوفكم، لذا قمنا بتطوير نظام متكامل يضمن :

- تسجيلاً رقمياً سلساً عبر استمارات ثنائية اللغة متوافقة تماماً مع هويتكم البصرية.
- تذاكر ذكية فورية مزودة بـ رمز QR آمن تصل مباشرة للمشاركين.
- طباعة شارات الدخول (Badges) في عين المكان فوراً خلال 3 ثوانٍ فقط، مما يقضي تماماً على طوابير الانتظار.

يسعدني جداً مناقشة كيف يمكننا دعمكم في إنجاح تظاهرتكم القادمة {eventName}. هل يناسبكم إجراء مكالمة هاتفية قصيرة (5 دقائق) هذا الأسبوع لاستعراض حلولنا؟

تقبلوا منا فائق التقدير والاحترام،
{agentName}
إيفنت زون الجزائر
contact@eventzone.pro | +213 781 457 511`
  },
  {
    id: "preset-firstcall-website-fr",
    title: "Premier Contact - Découverte Site Web / Digital (FR)",
    subject: "Digitalisation de la billetterie et accueil — {companyName}",
    category: "leads",
    language: "fr",
    isDefault: true,
    content: `Bonjour {contactName},

En visitant le site internet de {companyName}, j'ai noté que vous organisez régulièrement des rencontres professionnelles, des formations ou des séminaires d'envergure. Dans ce cadre, la gestion manuelle des inscriptions et l'accueil des participants peuvent rapidement de venir chronophages.

C'est pourquoi nous avons créé Eventzone. Notre plateforme full-stack, d'ores et déjà adoptée par de nombreuses entreprises à Alger et Oran, automatise l'ensemble du processus pour faire de l'accueil un moment fluide et valorisant :

1. Formulaire d'inscription bilingue embarqué directement sur votre site ou via une landing page dédiée.
2. Système de billetterie électronique avec envoi automatique de QR-codes par mail et SMS.
3. Accueil physique ultra-rapide avec impression instantanée des badges (3 secondes chrono).

Pouvez-vous m'indiquer vos disponibilités ce mardi ou mercredi pour un rapide appel afin de voir si Eventzone pourrait faciliter vos futurs événements comme {eventName} ?

Bien cordialement,
{agentName}
Équipe Commerciale — SPASU Eventzone
eventzone.pro | +213 781 457 511`
  },
  {
    id: "preset-firstcall-website-ar",
    title: "اتصال أولي - عبر الموقع الإلكتروني للمؤسسة (AR)",
    subject: "رقمنة نظام التسجيل والتحكم في الدخول لـ {companyName}",
    category: "leads",
    language: "ar",
    isDefault: true,
    content: `السيد(ة) {contactName} المحترم(ة)،

أثناء زيارتي للموقع الإلكتروني لشركة {companyName}، لاحظت تنظيمكم المستمر لملتقيات، دورات تدريبية أو ندوات هامة. وكما تعلمون، فإن التنظيم التقليدي واليدوي لعمليات التسجيل واستقبل الضيوف يتطلب الكثير من الجهد والوقت.

تقدم لكم إيفنت زون (Eventzone) حلاً رقمياً متكاملاً لتسهيل وتحسين هذه التجربة في الجزائر :

1. استمارة تسجيل إلكترونية ثنائية اللغة يمكن دمجها مباشرة في موقعكم الإلكتروني أو صفحة مخصصة.
2. إرسال تلقائي للتذاكر الإلكترونية مع رمز استجابة سريع (QR) عبر البريد الإلكتروني.
3. استقبال الحضور في الموقع مع طباعة فورية للشارات الاحترافية في غغون 3 ثوانٍ فقط.

هل يمكننا جدولة مكالمة موجزة هذا الأسبوع لتبادل الأفكار حول إمكانية تسيير تظاهرتكم القادمة {eventName} بنجاح تام؟

تحياتي الحارة،
{agentName}
فريق إيفنت زون الجزائر
contact@eventzone.pro | +213 781 457 511`
  },
  {
    id: "preset-firstcall-eventview-fr",
    title: "Premier Contact - Suite Rencontre Événementiel (FR)",
    subject: "Ravi de notre brève rencontre — Eventzone x {companyName}",
    category: "leads",
    language: "fr",
    isDefault: true,
    content: `Bonjour {contactName},

Ravi d'avoir pu échanger brièvement avec vous lors de notre rencontre à Alger. Votre projet de développement au sein de {companyName} est passionnant.

Comme discuté, je vous adresse notre présentation commerciale d'Eventzone, la solution optimale de gestion et de contrôle d'accès événementiel du groupe SPASU. Que ce soit pour un salon professionnel de 5 000 personnes ou un séminaire VIP, nous garantissons l'élimination des files d'attente à l'entrée grâce à nos terminaux industriels d'impression thermique de badge en 3 secondes.

En résumé, notre pack comprend :
- Conception du parcours d'enregistrement multilingue (Français, Arabe, Anglais)
- Suivi analytique en temps réel des flux d'entrées (Dashboard live)
- Mise à disposition du matériel haut de gamme et présence d'un support technique dédié sur site

Quand seriez-vous disponible pour que nous planifiions une démonstration personnalisée en visioconférence pour votre prochain événement {eventName} ?

Bien cordialement,
{agentName}
SPASU Eventzone Algeria
contact@eventzone.pro | +213 781 457 511`
  },
  {
    id: "preset-firstcall-eventview-ar",
    title: "اتصال أولي - بعد لقاء سريع في صالون (AR)",
    subject: "سعدت بلقائكم — إيفنت زون لرقمنة فعاليات {companyName}",
    category: "leads",
    language: "ar",
    isDefault: true,
    content: `السيد(ة) {contactName} المحترم(ة)،

سعدنا بلقائكم وتبادل أطراف الحديث معكم وجيزاً خلال فعاليات الصالون الأخير في الجزائر العاصمة، وأحييكم على رؤيتكم الطموحة لتطوير أعمال {companyName}.

كما اتفقنا، أرسل لكم هذا البريد للتعريف بمنصة إيفنت زون (Eventzone) من SPASU، الشريك التكنولوجي الأمثل للتحكم الرقمي وإدارة دخول الفعاليات في الجزائر. نحن نضمن لشركائنا دخولاً فائق السرعة والموثوقية بفضل طابعاتنا الحرارية الصناعية التي تطبع شارة كل ضيف مجاناً في 3 ثوانٍ فقط عند وصوله.

يتضمن عرضنا الاحترافي:
- تصميم مسار تسجيل متكامل بمختلف اللغات (العربية، الفرنسية، الإنجليزية).
- لوحة تحكم ومتابعة حية وفورية لإحصائيات ونسب حضور الفعالية.
- توفير الأجهزة المتطورة وحضور فريق دعم تقني ميداني مخصص لضمان استقرار التشغيل يوم الفعالية.

هل أنتم متاحون هذا الأسبوع لعرض توضيحي تفاعلي مدته 10 دقائق عبر الإنترنت لمناقشة تظاهرتكم القادمة {eventName}؟

أطيب التحيات،
{agentName}
فريق إيفنت زون الجزائر
contact@eventzone.pro | +213 781 457 511`
  },
  {
    id: "preset-quotation-fr",
    title: "Envoi de Proposition & Devis (FR)",
    subject: "Proposition commerciale d'Eventzone — {eventName}",
    category: "leads",
    language: "fr",
    isDefault: true,
    content: `Bonjour {contactName},

Suite à notre enrichissant entretien téléphonique, je vous prie de trouver ci-joint notre proposition commerciale ainsi que le devis correspondant pour votre événement : {eventName}.

Pour le volume de participants prévu et les options retenues, le montant global estimé s'élève à {estimatedValue}. Ce tarif comprend :
1. La mise en ligne et l'optimisation cosmétique du formulaire d'inscription
2. Notre outil d'envoi automatique de billets numériques avec code QR
3. La fourniture d'imprimantes thermiques industrielles pour impression instantanée lors de l'accueil
4. La présence d'agents supports de SPASU Eventzone pour encadrer le desk d'accueil

Je reste à votre entière disposition pour planifier une visioconférence technique de démonstration ou pour adapter cette proposition selon votre budget.

Cordialement,
{agentName}
SPASU Eventzone Algeria
Website: eventzone.pro`
  },
  {
    id: "preset-followup-fr",
    title: "Relance Devis Inactif (FR)",
    subject: "Suivi du projet de billetterie — Eventzone — {companyName}",
    category: "followup",
    language: "fr",
    isDefault: true,
    content: `Bonjour {contactName},

Je me permets de revenir vers vous concernant la proposition commerciale que je vous ai adressée pour l'événement {eventName}.

Avez-vous pu l'analyser avec vos collaborateurs ? Nos équipes logistiques amorcent la planification du matériel d'impression pour la période demandée. C'est pourquoi nous aimerions réserver vos terminaux d'impression thermique ainsi que nos techniciens d'accueil pour sécuriser cette date.

S'il vous faut des ajustements sur le devis ou des précisions d'ordre administratif (modalités de paiement ou détails pour la facturation), n'hésitez pas à m'en faire part directement.

Cordialement,
{agentName}
Département Commercial — SPASU Eventzone
+213 781 457 511`
  },
  {
    id: "preset-thankyou-fr",
    title: "Félicitations & Remerciements Post-Événement (FR)",
    subject: "Félicitations pour le succès de l'événement {eventName} !",
    category: "postevent",
    language: "fr",
    isDefault: true,
    content: `Bonjour {contactName},

Au nom de toute l'équipe de SPASU Eventzone, je tiens à vous féliciter chaleureusement pour le franc succès de : {eventName} !

Ce fut un honneur de collaborer avec vos équipes sur l'accueil, l'enregistrement des participants et l'impression en temps réel de leurs badges. Grâce à notre synergie, nous avons enregistré un temps de check-in moyen impressionnant de 3 secondes par invité, éliminant totalement les files d'attente à l'entrée.

Vous recevrez dans un courriel distinct les statistiques complètes de fréquentation, mais l'intégralité du fichier consolidé des participants est d'ores et déjà disponible en téléchargement sécurisé sur votre espace CRM Eventzone.

Nous espérons vous accompagner de nouveau pour vos projets à Alger et partout en Algérie.

Bien cordialement,
{agentName}
Customer Service — Eventzone`
  }
];

export default function Communication() {
  const { data, currentUser, logInteraction } = useStore();
  const { t } = useTranslation();

  // Local state for templates (defaults + user-defined templates)
  const [templates, setTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem("eventzone_email_templates");
    if (saved) {
      try {
        const parsed: EmailTemplate[] = JSON.parse(saved);
        // keep user custom templates (non-default or not belonging to PRESET_TEMPLATES ids)
        const userCustoms = parsed.filter(t => !t.isDefault && !PRESET_TEMPLATES.some(p => p.id === t.id));
        // combine original PRESET_TEMPLATES + user custom templates
        return [...PRESET_TEMPLATES, ...userCustoms];
      } catch (e) {
        return PRESET_TEMPLATES;
      }
    }
    return PRESET_TEMPLATES;
  });

  useEffect(() => {
    localStorage.setItem("eventzone_email_templates", JSON.stringify(templates));
  }, [templates]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("fr");

  // Selected template & dynamic binding targets
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || ""
  );
  const [targetType, setTargetType] = useState<"lead" | "client" | "none">("none");
  const [targetId, setTargetId] = useState<string>("");

  // Editor states (Subject and Content are customized from selected template)
  const [editedSubject, setEditedSubject] = useState("");
  const [editedContent, setEditedContent] = useState("");

  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || null;
  }, [templates, selectedTemplateId]);

  // Automatically synchronize template selection with active filter language
  useEffect(() => {
    if (activeTemplate && activeTemplate.language !== selectedLanguage) {
      const match = templates.find((t) => t.language === selectedLanguage && (selectedCategory === "all" || t.category === selectedCategory));
      const fallback = templates.find((t) => t.language === selectedLanguage);
      const targetTpl = match || fallback;
      if (targetTpl) {
        setSelectedTemplateId(targetTpl.id);
      }
    }
  }, [selectedLanguage, selectedCategory, templates, activeTemplate]);

  // When changing templates, reset custom editor text
  useEffect(() => {
    if (activeTemplate) {
      setEditedSubject(activeTemplate.subject);
      setEditedContent(activeTemplate.content);
    }
  }, [activeTemplate]);

  // Dynamic dropdown list combining Leads & Clients
  const recipientList = useMemo(() => {
    const leads = (data.leads || []).map((l) => ({
      id: l.id,
      name: `${l.contactName} (${l.companyName}) — Prospect`,
      type: "lead" as const,
      original: l
    }));
    const clients = (data.clients || []).map((c) => ({
      id: c.id,
      name: `${c.contactPerson} (${c.companyName}) — Client`,
      type: "client" as const,
      original: c
    }));
    return [...leads, ...clients];
  }, [data.leads, data.clients]);

  // Current selected recipient full object
  const currentRecipient = useMemo(() => {
    if (targetId === "" || targetType === "none") return null;
    return recipientList.find((r) => r.id === targetId && r.type === targetType) || null;
  }, [recipientList, targetId, targetType]);

  // On selecting a recipient, auto-configure targetType to match
  const handleRecipientChange = (val: string) => {
    if (!val) {
      setTargetType("none");
      setTargetId("");
      return;
    }
    const parts = val.split(":");
    const type = parts[0] as "lead" | "client";
    const id = parts[1];
    setTargetType(type);
    setTargetId(id);
  };

  // Compile specific string variables in real time
  const compileText = (text: string) => {
    if (!text) return "";
    let raw = text;
    const recipient = currentRecipient?.original as any;

    const contactName =
      targetType === "lead"
        ? recipient?.contactName || "M./Mme le Directeur"
        : recipient?.contactPerson || "M./Mme le Directeur";
    const companyName = recipient?.companyName || "votre entreprise";
    const eventName =
      recipient?.eventName ||
      (targetType === "lead" ? `Séminaire ${companyName}` : "Séminaire Annuel");
    const valAmount = recipient?.estimatedValue || recipient?.revenue || 250000;
    const estimatedValue = `${valAmount.toLocaleString("fr-DZ")} DZD`;
    const agentName = currentUser?.name || "Conseiller SPASU Eventzone";

    raw = raw.replace(/{contactName}/g, contactName);
    raw = raw.replace(/{companyName}/g, companyName);
    raw = raw.replace(/{eventName}/g, eventName);
    raw = raw.replace(/{estimatedValue}/g, estimatedValue);
    raw = raw.replace(/{agentName}/g, agentName);

    return raw;
  };

  // Compiled output for previews
  const compiledSubjectOutput = useMemo(() => {
    return compileText(editedSubject);
  }, [editedSubject, currentRecipient, targetType, currentUser]);

  const compiledBodyOutput = useMemo(() => {
    return compileText(editedContent);
  }, [editedContent, currentRecipient, targetType, currentUser]);

  // Detect which variables are used/needed
  const variableStatus = useMemo(() => {
    const list = [
      { placeholder: "{contactName}", label: "Contact", exists: false },
      { placeholder: "{companyName}", label: "Entreprise", exists: false },
      { placeholder: "{eventName}", label: "Événement", exists: false },
      { placeholder: "{estimatedValue}", label: "Montant", exists: false },
      { placeholder: "{agentName}", label: "Expéditeur", exists: false }
    ];
    const rawTemplateText = `${editedSubject} ${editedContent}`;
    return list.map((item) => ({
      ...item,
      exists: rawTemplateText.includes(item.placeholder)
    }));
  }, [editedSubject, editedContent]);

  // Preview Mode: desktop vs mobile
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">("desktop");

  // Email simulation modal and process triggers
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorStep, setSimulatorStep] = useState(1);
  const [simulatorLogs, setSimulatorLogs] = useState<string[]>([]);
  const [isSimulatingSending, setIsSimulatingSending] = useState(false);

  // Modal forms for adding/editing a template
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [templateForm, setTemplateForm] = useState<Partial<EmailTemplate>>({
    title: "",
    subject: "",
    category: "leads",
    content: "",
    language: "fr"
  });

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setTemplateForm({
      title: "",
      subject: "",
      category: "leads",
      content: "",
      language: "fr"
    });
    setShowTemplateModal(true);
  };

  const handleOpenEditModal = (tpl: EmailTemplate) => {
    setModalMode("edit");
    setTemplateForm(tpl);
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.title || !templateForm.subject || !templateForm.content) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (modalMode === "create") {
      const newTpl: EmailTemplate = {
        id: uuidv4(),
        title: templateForm.title,
        subject: templateForm.subject,
        category: templateForm.category || "other",
        content: templateForm.content,
        language: templateForm.language || "fr"
      };
      setTemplates((prev) => [...prev, newTpl]);
      setSelectedTemplateId(newTpl.id);
      toast.success("Modèle créé avec succès !");
    } else {
      setTemplates((prev) =>
        prev.map((t) => (t.id === templateForm.id ? (templateForm as EmailTemplate) : t))
      );
      toast.success("Modèle de courriel mis à jour !");
    }
    setShowTemplateModal(false);
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tpl = templates.find((t) => t.id === id);
    if (tpl?.isDefault) {
      toast.error("Les modèles système par défaut ne peuvent pas être supprimés.");
      return;
    }
    if (confirm("Voulez-vous vraiment supprimer ce modèle de communication ?")) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (selectedTemplateId === id) {
        const remaining = templates.filter((t) => t.id !== id);
        setSelectedTemplateId(remaining[0]?.id || "");
      }
      toast.success("Modèle supprimé.");
    }
  };

  // Logic to simulate SMTP delivery and emit real storage interactions
  const startSimulation = () => {
    if (targetType === "none" || !targetId) {
      toast.error("Veuillez sélectionner un destinataire (Prospect ou Client) pour simuler l'envoi.");
      return;
    }

    setSimulatorStep(1);
    setIsSimulatingSending(true);
    setShowSimulator(true);
    setSimulatorLogs(["Initialisation de la connexion SMTP sécurisée...", "Validation des protocoles SPF, DKIM et DMARC d'Eventzone..."]);

    setTimeout(() => {
      setSimulatorLogs((prev) => [
        ...prev,
        `Connexion SMTP établie : smtp.eventzone.pro:465...`,
        `Génération du message MIME pour ${currentRecipient?.original.email || "destinataire"}...`
      ]);
      setSimulatorStep(2);
    }, 1000);

    setTimeout(() => {
      setSimulatorLogs((prev) => [
        ...prev,
        `Mise en page CSS bilingue embarquée injectée...`,
        `Évaluation anti-spam de l'objet : score favorable...`,
        `Acheminement via la passerelle d'envoi SPASU Algérie...`
      ]);
      setSimulatorStep(3);
    }, 2000);

    setTimeout(() => {
      const recipientEmail = currentRecipient?.original.email || "contact@client.dz";
      setSimulatorLogs((prev) => [
        ...prev,
        `Message accepté par le serveur de messagerie distant de l'Algérie Telecom / Client !`,
        `ID de transaction e-mail : msg-sps-2026-${Math.floor(Math.random() * 90000) + 10000}`,
        `[SUCCÈS] Courriel envoyé à ${recipientEmail}`
      ]);
      setSimulatorStep(4);
      setIsSimulatingSending(false);

      // Save interaction logically to StoreContext databases!
      logInteraction({
        leadId: targetType === "lead" ? targetId : undefined,
        clientId: targetType === "client" ? targetId : undefined,
        type: "Email",
        outcome: "Reached",
        notes: `Courriel envoyé de manière programmée via le hub Communication (Modèle: "${activeTemplate?.title}").\nObjet : ${compiledSubjectOutput}\nContenu : \n${compiledBodyOutput}`
      }).then(() => {
        toast.success(`Interaction enregistrée pour ${currentRecipient?.original.companyName}!`);
      }).catch((e) => {
        console.error(e);
      });
    }, 3500);
  };

  // Filter templates list
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchesSearch =
        tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || tpl.category === selectedCategory;
      const matchesLanguage = selectedLanguage === "all" || tpl.language === selectedLanguage;
      return matchesSearch && matchesCategory && matchesLanguage;
    });
  }, [templates, searchQuery, selectedCategory, selectedLanguage]);

  // Helper translations for categories inside interface (can't define keyof fr dynamically if keys don't exist, we fallback)
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "leads":
        return "Prospects (Leads)";
      case "clients":
        return "Clients";
      case "followup":
        return "Relances & Suivi";
      case "postevent":
        return "Post-Événement";
      default:
        return "Autre";
    }
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case "fr":
        return "Français";
      case "ar":
        return "العربية";
      case "en":
        return "English";
      default:
        return;
    }
  };

  // Helper copy functionalities
  const handleCopy = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${description} copié dans le presse-papiers !`);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <Mail className="w-8 h-8 text-primary" />
            <span>Communication & Courriels</span>
          </h1>
          <p className="text-neutral-600 mt-1">
            Gérez vos modèles d'e-mails institutionnels Eventzone et envoyez des messages bilingues personnalisés en temps réel.
          </p>
        </div>
        <Button
          onClick={handleOpenCreateModal}
          variant="primary"
          size="md"
          className="flex-shrink-0 bg-primary hover:bg-primary-dark text-white font-bold px-6 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau modèle
        </Button>
      </div>

      {/* Main Grid: Left filters and templates list, Right workspace preview & dynamics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 min-h-0">
        
        {/* LEFT COLUMN: List & Filters (5 grid units) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col h-[calc(100vh-14rem)] bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm overflow-hidden min-h-0">
          <div>
            <h2 className="text-lg font-bold text-neutral-800 flex items-center space-x-2 mb-4">
              <Layers className="w-5 h-5 text-neutral-400" />
              <span>Modèles Disponibles ({filteredTemplates.length})</span>
            </h2>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Rechercher un modèle ou mot-clé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm border-neutral-200"
              />
            </div>

            {/* Category Filters row (wrap) */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {[
                { id: "all", label: "Tout" },
                { id: "leads", label: "Prospects" },
                { id: "clients", label: "Clients" },
                { id: "followup", label: "Relances" },
                { id: "postevent", label: "Post-Event" }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all border ${
                    selectedCategory === cat.id
                      ? "bg-neutral-900 border-neutral-900 text-white"
                      : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Language Selection Row */}
            <div className="flex items-center space-x-3 pb-3 border-b border-neutral-100 mb-2">
              <Globe className="w-4 h-4 text-neutral-400" />
              <span className="text-xs text-neutral-500 font-medium">Langue :</span>
              <div className="flex space-x-1">
                {[
                  { id: "fr", label: "FR" },
                  { id: "ar", label: "AR" },
                  { id: "en", label: "EN" }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLanguage(lang.id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                      selectedLanguage === lang.id
                        ? "bg-primary-light text-primary border border-primary/20"
                        : "text-neutral-500 hover:bg-neutral-100 border border-transparent"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scrolling Templates List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 -mr-2 pr-2">
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="w-8 h-8 text-neutral-300 stroke-[1.5] mb-2" />
                <p className="text-sm font-medium text-neutral-400">Aucun modèle ne correspond à vos filtres.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedLanguage("fr");
                  }}
                  className="text-xs text-primary font-bold underline mt-1"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              filteredTemplates.map((tpl) => {
                const isActive = tpl.id === selectedTemplateId;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`relative p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      isActive
                        ? "bg-primary-light/40 border-primary shadow-sm ring-1 ring-primary/20"
                        : "bg-neutral-50 hover:bg-neutral-100/60 border-neutral-200"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <span className="font-bold text-sm text-neutral-950 truncate max-w-[70%]">
                        {tpl.title}
                      </span>
                      <div className="flex space-x-1 flex-shrink-0">
                        {tpl.isDefault && (
                          <span className="bg-neutral-200 text-neutral-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase">
                            Système
                          </span>
                        )}
                        <span className="bg-white border text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                          {tpl.language}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-neutral-500 line-clamp-1 mb-3">
                      Sujet : {tpl.subject}
                    </p>

                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-neutral-100/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        {getCategoryLabel(tpl.category)}
                      </span>
                      
                      <div className="flex space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(tpl);
                          }}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                          title="Modifier le modèle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!tpl.isDefault && (
                          <button
                            onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                            className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Dynamics, Live Compiled Preview, Devices View (7 grid units) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar -mr-4 pr-4">
          
          {/* Recipient Selecting dashboard card */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-3 mb-4 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-warning" />
              <span>Compilation Dynamique de Variables</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <Label className="text-neutral-500 font-semibold mb-1.5 block">Cible de communication (Destinataire)</Label>
                <div className="relative">
                  <Select
                    value={targetType !== "none" ? `${targetType}:${targetId}` : ""}
                    onChange={(e) => handleRecipientChange(e.target.value)}
                    className="w-full text-sm border-neutral-200 rounded-xl"
                  >
                    <option value="">-- Aucun destinataire sélectionné --</option>
                    <optgroup label="Prospects (Leads)">
                      {recipientList
                        .filter((r) => r.type === "lead")
                        .map((r) => (
                          <option key={`lead:${r.id}`} value={`lead:${r.id}`}>
                            {r.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Clients">
                      {recipientList
                        .filter((r) => r.type === "client")
                        .map((r) => (
                          <option key={`client:${r.id}`} value={`client:${r.id}`}>
                            {r.name}
                          </option>
                        ))}
                    </optgroup>
                  </Select>
                </div>
              </div>

              {/* Matched Placeholders Checkbox lists */}
              <div className="space-y-2 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-150">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">État des variables</span>
                  <span className="text-[10px] text-neutral-500 font-medium">Auto-remplies</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {variableStatus.map((status) => {
                    if (!status.exists) return null;
                    const isFilled = targetId !== "";
                    return (
                      <span
                        key={status.placeholder}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 border ${
                          isFilled
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-neutral-100 border-neutral-200 text-neutral-500"
                        }`}
                        title={isFilled ? `Rempli dynamiquement` : `Placeholder disponible`}
                      >
                        <Check className={`w-3 h-3 ${isFilled ? "text-green-600" : "text-neutral-400"}`} />
                        <span>{status.placeholder}</span>
                      </span>
                    );
                  })}
                  {!variableStatus.some((s) => s.exists) && (
                    <span className="text-xs text-neutral-400">Aucune variable détectée dans ce modèle.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Core Custom Editor Panel */}
          {activeTemplate ? (
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-5 flex flex-col">
              
              <div className="flex justify-between items-center pb-2 border-b border-neutral-150">
                <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-widest flex items-center space-x-2">
                  <Edit2 className="w-4 h-4 text-primary" />
                  <span>Ajuster l'E-mail avant envoi</span>
                </h3>
                <span className="text-[10px] text-neutral-400 font-bold">
                  Modifications temporaires
                </span>
              </div>

              {/* Subject Textbox (Plain subject edit, compiling live) */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="subject-input" className="text-xs font-bold text-neutral-600 tracking-wide uppercase">Objet de l'e-mail</Label>
                <div className="flex gap-2">
                  <Input
                    id="subject-input"
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="text-sm border-neutral-200"
                  />
                  <Button
                    onClick={() => handleCopy(compiledSubjectOutput, "Sujet")}
                    variant="outline"
                    size="sm"
                    className="border-neutral-200 text-neutral-500 hover:text-neutral-700"
                    title="Copier le sujet généré"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Body Content Textbox */}
              <div className="space-y-1.5 text-left flex-1 flex flex-col">
                <div className="flex justify-between items-center">
                  <Label htmlFor="content-input" className="text-xs font-bold text-neutral-600 tracking-wide uppercase">Contenu du message (Texte brut)</Label>
                  <button
                    onClick={() => {
                      if (activeTemplate) setEditedContent(activeTemplate.content);
                    }}
                    className="text-[10px] font-bold text-primary hover:underline flex items-center"
                  >
                    Réinitialiser le texte
                  </button>
                </div>
                <div className="relative flex-1 flex flex-col min-h-[14rem]">
                  <Textarea
                    id="content-input"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="text-sm border-neutral-200 flex-1 rounded-2xl resize-none p-4 font-mono leading-relaxed"
                  />
                  <button
                    onClick={() => handleCopy(compiledBodyOutput, "Message")}
                    className="absolute right-4 bottom-4 bg-white/95 border hover:bg-neutral-50 shadow p-2 rounded-xl text-neutral-600 hover:text-neutral-900 transition-colors"
                    title="Copier le message généré"
                  >
                    <Copy className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Visual Preview Deck (Desktop vs Mobile simulation) */}
              <div className="space-y-3 pt-4 border-t border-neutral-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4.5 h-4.5 text-primary" />
                    <span className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Aperçu Réel Bilingue d'Eventzone</span>
                  </div>
                  
                  {/* Viewport Toggles */}
                  <div className="bg-neutral-100 p-0.5 rounded-full flex items-center space-x-1 border">
                    <button
                      onClick={() => setViewportMode("desktop")}
                      className={`p-1.5 rounded-full transition-all flex items-center space-x-1 ${
                        viewportMode === "desktop"
                          ? "bg-white text-primary shadow"
                          : "text-neutral-400 hover:text-neutral-600"
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold pr-1">Desktop</span>
                    </button>
                    <button
                      onClick={() => setViewportMode("mobile")}
                      className={`p-1.5 rounded-full transition-all flex items-center space-x-1 ${
                        viewportMode === "mobile"
                          ? "bg-white text-primary shadow"
                          : "text-neutral-400 hover:text-neutral-600"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold pr-1">Mobile</span>
                    </button>
                  </div>
                </div>

                {/* Rendered frame window */}
                <div className="bg-neutral-900/5 border rounded-2xl p-4 flex justify-center overflow-x-auto">
                  
                  <div
                    className={`transition-all duration-300 relative text-left bg-white shadow-md border ${
                      viewportMode === "mobile"
                        ? "w-[340px] max-w-full rounded-3xl overflow-hidden border-neutral-300 ring-4 ring-neutral-950/5 p-4"
                        : "w-full rounded-xl border-neutral-200 p-6"
                    }`}
                  >
                    {/* Header bar of email */}
                    <div className="border-b border-neutral-100 pb-3.5 mb-4">
                      {/* Brand Logo and electric teal banner line */}
                      <div className="h-1 bg-gradient-to-r from-teal-400 via-primary to-amber-400 w-full mb-3" />
                      <div className="flex justify-between items-center px-1">
                        <img
                          src="https://images2.imgbox.com/02/39/OksF9irW_o.png"
                          alt="Eventzone"
                          className="h-[14px] object-contain"
                        />
                        <span className="text-[9px] font-bold text-neutral-400 tracking-wider">COMMUNIQUÉ</span>
                      </div>
                    </div>

                    {/* Email Headers for Mobile */}
                    {viewportMode === "mobile" && (
                      <div className="bg-neutral-50 px-2 py-1.5 rounded-xl border border-neutral-100 mb-3 text-[10px] text-neutral-500 space-y-0.5">
                        <p className="truncate"><span className="font-semibold text-neutral-600">De :</span> contact@eventzone.pro</p>
                        <p className="truncate"><span className="font-semibold text-neutral-600">À :</span> {currentRecipient?.original.email || "destinataire"}</p>
                        <p className="truncate font-medium text-neutral-700"><span className="font-semibold text-neutral-600">Sujet :</span> {compiledSubjectOutput || "(Sans objet)"}</p>
                      </div>
                    )}

                    {/* HTML Body Preview */}
                    <div
                      className={`text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap ${
                        activeTemplate.language === "ar" ? "text-right" : "text-left"
                      }`}
                      dir={activeTemplate.language === "ar" ? "rtl" : "ltr"}
                    >
                      {compiledBodyOutput || "(Veuillez saisir du texte)"}
                    </div>

                    {/* Email Footer sign pattern */}
                    <div className="mt-8 pt-4 border-t border-neutral-100 text-[10px] text-neutral-400">
                      <p className="font-semibold text-primary">SPASU Eventzone Algiers</p>
                      <p>Sleek Event Check-in — What all the best events have in common.</p>
                      <p className="mt-1">© 2026 eventzone.pro. Algérie CRM Hub.</p>
                    </div>

                  </div>

                </div>
              </div>

              {/* Action row footer */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-neutral-100 bg-neutral-50 -mx-6 -mb-6 p-6 rounded-b-[24px]">
                <div className="flex items-center space-x-2 text-xs text-neutral-400">
                  <Info className="w-4 h-4 text-primary" />
                  <span>Enregistrer l'interaction dans le profil de la cible après envoi fiscal.</span>
                </div>
                
                <Button
                  onClick={startSimulation}
                  disabled={targetType === "none" || isSimulatingSending}
                  variant="primary"
                  className={`w-full sm:w-auto font-bold bg-primary hover:bg-primary-dark shadow-md text-white px-8 ${
                    targetType === "none" ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Simuler l'Envoi Officiel
                </Button>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center shadow-sm">
              <Mail className="w-12 h-12 text-neutral-300 stroke-[1.2] mx-auto mb-3" />
              <p className="text-neutral-500 font-medium">Veuillez sélectionner ou créer un modèle pour modifier et simuler l'envoi d'e-mails.</p>
            </div>
          )}

        </div>

      </div>

      {/* MODAL: ADD / EDIT TEMPLATE */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>{modalMode === "create" ? "Créer un Modèle de Communication" : "Modifier le Modèle"}</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Utilisez des balises comme <strong className="text-neutral-700 font-bold">{`{contactName}`}</strong>, <strong className="text-neutral-700 font-bold">{`{companyName}`}</strong>, <strong className="text-neutral-700 font-bold">{`{eventName}`}</strong>, ou <strong className="text-neutral-700 font-bold">{`{estimatedValue}`}</strong> pour injecter des valeurs automatiques.
              </p>
            </div>

            <form onSubmit={handleSaveTemplate} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="tpl-title" className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Titre interne du modèle</Label>
                  <Input
                    id="tpl-title"
                    required
                    type="text"
                    placeholder="Ex: Suivi du stand, Envoi invitation..."
                    value={templateForm.title || ""}
                    onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                    className="text-sm border-neutral-200"
                  />
                </div>

                {/* Category & Language */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1.5">
                    <Label htmlFor="tpl-category" className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Catégorie</Label>
                    <Select
                      id="tpl-category"
                      value={templateForm.category || "leads"}
                      onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as any })}
                      className="text-sm border-neutral-200"
                    >
                      <option value="leads">Prospect (Leads)</option>
                      <option value="clients">Client</option>
                      <option value="followup">Suivi</option>
                      <option value="postevent">Post-Event</option>
                      <option value="other">Autre</option>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="tpl-lang" className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Langue</Label>
                    <Select
                      id="tpl-lang"
                      value={templateForm.language || "fr"}
                      onChange={(e) => setTemplateForm({ ...templateForm, language: e.target.value as any })}
                      className="text-sm border-neutral-200"
                    >
                      <option value="fr">Français</option>
                      <option value="ar">العربية (Arabic)</option>
                      <option value="en">English</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Email Subject */}
              <div className="space-y-1.5 text-left font-sans">
                <Label htmlFor="tpl-subject" className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Objet standard de l'e-mail</Label>
                <Input
                  id="tpl-subject"
                  required
                  type="text"
                  placeholder="Ex: Invitation à notre forum - {companyName}"
                  value={templateForm.subject || ""}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  className="text-sm border-neutral-200"
                />
              </div>

              {/* Template Body */}
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <Label htmlFor="tpl-content" className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Contenu du message (corps de texte)</Label>
                  <span className="text-[10px] text-neutral-400">Placeholder bilingues supportés</span>
                </div>
                <Textarea
                  id="tpl-content"
                  required
                  rows={8}
                  placeholder={`Bonjour {contactName},\n\nNous vous remercions cordialement pour votre visite...\n\nSincèrement,\n{agentName}`}
                  value={templateForm.content || ""}
                  onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                  className="text-sm border-neutral-200 font-mono leading-relaxed resize-none p-3.5"
                />
              </div>
            </form>

            <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTemplateModal(false)}
                className="border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleSaveTemplate}
                variant="primary"
                className="bg-primary hover:bg-primary-dark text-white font-bold px-6"
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SMTP DELIVERY SIMULATOR FULL-SCREEN OVERLAY */}
      {showSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-neutral-200 shadow-2xl p-6 overflow-hidden flex flex-col justify-between max-h-[85vh]">
            
            {/* Header */}
            <div className="pb-4 border-b border-neutral-150 text-left">
              <h4 className="text-base font-bold text-neutral-900 flex items-center space-x-2">
                <Send className="w-5 h-5 text-primary animate-pulse" />
                <span>Simulateur d'envoi SMTP (Eventzone Securisé)</span>
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                La passerelle d'envoi simule en temps réel l'acheminement de la communication vers la cible algérienne.
              </p>
            </div>

            {/* Email Meta Info Card */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-left space-y-1.5 my-4 text-xs">
              <p className="truncate"><span className="font-semibold text-neutral-600">Expéditeur (SMTP) :</span> SPASU Eventzone CRM &lt;{currentUser?.email || "info@eventzone.pro"}&gt;</p>
              <p className="truncate"><span className="font-semibold text-neutral-600">Destinataire :</span> {currentRecipient?.original.contactName || currentRecipient?.original.contactPerson} &lt;{currentRecipient?.original.email || "client@domain.dz"}&gt;</p>
              <p className="truncate font-medium text-neutral-800"><span className="font-semibold text-neutral-600">Sujet :</span> {compiledSubjectOutput}</p>
            </div>

            {/* Simulation Process Console Log */}
            <div className="bg-neutral-950 rounded-2xl p-4 flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed text-green-400 space-y-2 min-h-[12rem] max-h-[16rem]">
              <div className="flex items-center space-x-2 pb-1 border-b border-green-950/50 mb-2">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                <span className="text-neutral-500 uppercase tracking-widest text-[9px] font-bold">SMTP Client Logs</span>
              </div>
              
              {simulatorLogs.map((log, lIdx) => (
                <div key={lIdx} className="flex items-start space-x-1">
                  <span className="text-neutral-600 select-none">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}

              {isSimulatingSending && (
                <div className="flex items-center space-x-2 text-neutral-400 pl-4 animate-pulse">
                  <Clock className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Traitement de la pile de protocoles d'envois...</span>
                </div>
              )}
            </div>

            {/* Interactive Progress steps */}
            <div className="mt-4 grid grid-cols-4 gap-2 pb-4">
              {[
                { step: 1, label: "Poignée de main" },
                { step: 2, label: "Vérif SPF" },
                { step: 3, label: "Cryptage TLS" },
                { step: 4, label: "Délivré" }
              ].map((s) => {
                const isActive = simulatorStep >= s.step;
                const isCompleted = simulatorStep > s.step || simulatorStep === 4;
                return (
                  <div key={s.step} className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-primary text-white ring-2 ring-primary-light"
                          : "bg-neutral-150 text-neutral-400"
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.step}
                    </div>
                    <span className="text-[9px] text-neutral-500 font-semibold mt-1.5 text-center leading-tight">
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions of simulator */}
            <div className="pt-4 border-t border-neutral-100 flex justify-end space-x-2">
              <Button
                disabled={isSimulatingSending}
                variant={simulatorStep === 4 ? "primary" : "outline"}
                onClick={() => setShowSimulator(false)}
                className={`font-semibold ${
                  simulatorStep === 4
                    ? "bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/20 px-8"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {simulatorStep === 4 ? "Fermer le simulateur" : "Interrompre l'envoi"}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
