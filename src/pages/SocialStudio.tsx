import React, { useState, useEffect } from "react";
import { PenTool, Save, Sparkles, Copy, Check, Hash, Edit2, Eye, Trash2, Instagram, Linkedin, Loader2, Calendar as CalendarIcon, Brain } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { useStore } from "../store/StoreContext";
import { v4 as uuidv4 } from "uuid";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";

const PLATFORMS = {
  Instagram: { icon: Instagram, limit: 2200, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200", activeBg: "bg-pink-600" },
  LinkedIn: { icon: Linkedin, limit: 3000, color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", activeBg: "bg-sky-700" },
};

const CONTENT_TYPES = [
  "eventPromotion", "featureHighlight", "proTip", "clientStory", 
  "behindTheScenes", "announcement", "engagementPost", "educational"
];

const POST_FORMATS = [
  { id: "standardPost", icon: "📝", prompt: "Standard Post: default behavior (unchanged)" },
  { id: "carousel", icon: "🎠", prompt: "Carousel: output is structured as slide-by-slide (Slide 1: hook, Slide 2: point, etc.)" },
  { id: "videoDescription", icon: "🎬", prompt: "Video Description: includes a hook line, timestamps if relevant, and SEO-friendly description" },
  { id: "articleBlog", icon: "📰", prompt: "Article: longer form, with an intro, 3 sections, and a conclusion" },
  { id: "reelShort", icon: "🎙️", prompt: "Reel / Short: ultra-short punchy script or caption under 150 chars" },
];

const TONES = ["professional", "playful", "inspiring", "urgent", "conversational", "bold"];
const LANGUAGES = ["english", "french", "arabic"];

const SURPRISE_TOPICS = [
  "Announcing our new A4 badge printing feature that saves 50% time at check-in.",
  "How Eventzone's analytics dashboard helps organizers track real-time attendance.",
  "A behind-the-scenes look at how we set up the registration desk for a 1000+ attendee conference.",
  "Why using standard A4 paper for event badges is an eco-friendly and cost-effective game changer.",
  "Tips for HR teams on organizing seamless corporate training sessions using our platform.",
  "A client success story: How a local tech summit eliminated check-in queues completely.",
  "The importance of networking at events and how our custom badges spark conversations.",
  "Did you know attendees can print their badges at home before the event? Here is how it works."
];

type Platform = keyof typeof PLATFORMS;

interface MemoryItem {
  id: string;
  content: string;
  date: string;
}

interface SavedPost {
  id: string;
  platform: Platform;
  postFormat?: string;
  contentType: string;
  tone: string;
  content: string;
  date: string;
}

export default function SocialStudio() {
  const { t } = useTranslation();
  const { addSocialPost, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<"create" | "saved" | "surprise" | "memory">("create");
  
  const [platform, setPlatform] = useState<Platform>("LinkedIn");
  const [postFormat, setPostFormat] = useState(POST_FORMATS[0].id);
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [topic, setTopic] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [isSuggestingIdea, setIsSuggestingIdea] = useState(false);
  const [generatedPost, setGeneratedPost] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("12:00");
  
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>(() => {
    const saved = localStorage.getItem("eventzone_social_posts");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("eventzone_social_posts", JSON.stringify(savedPosts));
  }, [savedPosts]);

  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>(() => {
    const saved = localStorage.getItem("eventzone_social_memory");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("eventzone_social_memory", JSON.stringify(memoryItems));
  }, [memoryItems]);

  const handleSurpriseMe = () => {
    setActiveTab("create");
    setPlatform(Object.keys(PLATFORMS)[Math.floor(Math.random() * Object.keys(PLATFORMS).length)] as Platform);
    setPostFormat(POST_FORMATS[Math.floor(Math.random() * POST_FORMATS.length)].id);
    setContentType(CONTENT_TYPES[Math.floor(Math.random() * CONTENT_TYPES.length)]);
    setTone(TONES[Math.floor(Math.random() * TONES.length)]);
    setLanguage(LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)]);
    setTopic(SURPRISE_TOPICS[Math.floor(Math.random() * SURPRISE_TOPICS.length)]);
    toast.success(t("optionsRandomized"));
  };

  const handleSuggestIdea = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "");
    if (!apiKey) {
      toast.error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your environment.");
      return;
    }

    setIsSuggestingIdea(true);
    try {
      const memoryContext = memoryItems.length > 0 
        ? `\n\nEventzone Context & Recent Updates (Use these facts if relevant):\n${memoryItems.map(m => `- ${m.content}`).join('\n')}`
        : "";

      const prompt = `You are a creative social media manager for Eventzone, a B2B event management software company.
Your task is to suggest a highly specific topic idea for a social media post.

STRICT CONSTRAINTS:
1. Platform: ${platform}
2. Format: ${postFormat}
3. Content Type: ${contentType}
4. Tone: ${tone}${memoryContext}

Based EXACTLY on the constraints above, write a 1-2 sentence description of what the post should be about.
Do NOT write the actual post. Just describe the idea.
Make it highly relevant to the chosen Content Type (${contentType}).
Do not use quotes around the output.`;

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          temperature: 0.9,
        }
      });
      const generatedText = response.text || "";

      if (generatedText) {
        setTopic(generatedText.trim());
        toast.success(t("newIdeaGenerated"));
      } else {
        throw new Error("No response from AI");
      }
    } catch (error: any) {
      console.error("Error generating idea:", error);
      toast.error(error?.message || "Failed to generate idea. Please try again.");
    } finally {
      setIsSuggestingIdea(false);
    }
  };

  const handleGenerate = async () => {
    let currentPlatform = platform;
    let currentPostFormat = postFormat;
    let currentContentType = contentType;
    let currentTone = tone;
    let currentLanguage = language;
    let currentTopic = topic;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "");
    if (!apiKey) {
      toast.error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your environment.");
      return;
    }

    if (!topic.trim()) {
      toast.error("Please enter a topic to generate a post.");
      return;
    }

    setIsGenerating(true);
    setGeneratedPost("");
    setHashtags([]);
    setIsEditing(false);

    try {
      const formatInstruction = POST_FORMATS.find(f => f.id === currentPostFormat)?.prompt || POST_FORMATS[0].prompt;

      const memoryContext = memoryItems.length > 0 
        ? `\n\nRecent Updates & Features (Use these facts if relevant to the topic):\n${memoryItems.map(m => `- ${m.content}`).join('\n')}`
        : "";

      const systemInstruction = `You are an expert social media manager for 'Eventzone', an event management platform based in Algeria.
Brand Context:
- Platform name: Eventzone
- Key feature: innovative badge printing system using standard A4 blank paper (no special paper needed), printed on-site or by attendees at home to reduce queues. Fully customizable badges.
- Target audience: event organizers, HR teams, conference organizers in Algeria and the MENA region.${memoryContext}

Task: Write a social media post for ${currentPlatform}.
- Post Format: ${formatInstruction}
- Content Type: ${currentContentType}
- Tone: ${currentTone}
- Language: ${currentLanguage}
- Platform rules: 
  - Instagram: Use emojis, engaging visual descriptions, and include a call to action.
  - Facebook: Focus on storytelling and community building.
  - LinkedIn: Professional insight, industry value, B2B focus.
  - Twitter: Punchy, concise, highly engaging, under 280 characters.

Do not include hashtags in the main text (they will be generated separately). Just write the post content.`;

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Topic: ${currentTopic}`,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
      const generatedText = response.text || "";

      if (generatedText) {
        setGeneratedPost(generatedText.trim());
        toast.success(t("postGeneratedSuccess"));
      }
    } catch (error: any) {
      console.error("Error generating post:", error);
      toast.error(error?.message || "Failed to generate post. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateHashtags = async () => {
    if (!generatedPost) return;
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "");
    if (!apiKey) {
      toast.error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your environment.");
      return;
    }
    
    setIsGeneratingHashtags(true);
    try {
      const prompt = `Generate exactly 15 highly relevant hashtags for the following social media post on ${platform}. 
The post is for 'Eventzone', an event management platform in Algeria known for its innovative A4 badge printing system.
Return ONLY a comma-separated list of hashtags including the # symbol. No other text.

Post:
${generatedPost}`;

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });
      const generatedText = response.text || "";

      if (generatedText) {
        const tags = generatedText.split(',').map(t => t.trim()).filter(t => t.startsWith('#'));
        setHashtags(tags);
        toast.success(t("hashtagsGenerated"));
      }
    } catch (error: any) {
      console.error("Error generating hashtags:", error);
      toast.error(error?.message || "Failed to generate hashtags.");
    } finally {
      setIsGeneratingHashtags(false);
    }
  };

  const appendHashtag = (tag: string) => {
    setGeneratedPost(prev => prev + (prev.endsWith(' ') || prev.endsWith('\n') ? '' : ' ') + tag);
    setHashtags(prev => prev.filter(t => t !== tag));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    toast.success(t("copiedToClipboard"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!generatedPost) return;
    const newPost: SavedPost = {
      id: Date.now().toString(),
      platform,
      postFormat,
      contentType,
      tone,
      content: generatedPost,
      date: new Date().toISOString()
    };
    setSavedPosts([newPost, ...savedPosts]);
    toast.success(t("postSaved"));
    setActiveTab("saved");
  };

  const handleDelete = (id: string) => {
    setSavedPosts(savedPosts.filter(p => p.id !== id));
    toast.success(t("postDeleted"));
  };

  const handleScheduleToHub = async () => {
    if (!generatedPost || !scheduleDate || !scheduleTime) {
      toast.error(t("fieldRequired"));
      return;
    }
    
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    
    try {
      await addSocialPost({
        id: uuidv4(),
        platform: platform as any,
        caption: generatedPost,
        scheduledDate: scheduledDateTime,
        status: "Scheduled",
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id || "",
      });
      toast.success(t("postScheduledToHub"));
      setShowScheduleModal(false);
    } catch (error: any) {
      toast.error(error.message || t("error"));
    }
  };

  const charCount = generatedPost.length;
  const charLimit = PLATFORMS[platform].limit;
  const charPercentage = (charCount / charLimit) * 100;
  
  let progressColor = "bg-emerald-500";
  if (charPercentage > 100) progressColor = "bg-red-500";
  else if (charPercentage > 85) progressColor = "bg-yellow-500";

  const handleDeleteMemory = (id: string) => {
    setMemoryItems(memoryItems.filter(m => m.id !== id));
    toast.success(t("memoryItemDeleted"));
  };

  const handleAddMemory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("memoryContent") as HTMLInputElement;
    if (!input.value.trim()) return;

    const newItem: MemoryItem = {
      id: Date.now().toString(),
      content: input.value.trim(),
      date: new Date().toISOString()
    };
    
    setMemoryItems([newItem, ...memoryItems]);
    input.value = "";
    toast.success(t("memoryItemAdded"));
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <PenTool className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            {t("socialStudioTitle")}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-2">{t("socialStudioDesc")}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        <button
          onClick={() => setActiveTab("create")}
          className={cn(
            "px-4 sm:px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
            activeTab === "create" ? "bg-white text-gray-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
          )}
        >
          <PenTool className="w-4 h-4" />
          {t("create")}
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={cn(
            "px-4 sm:px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
            activeTab === "saved" ? "bg-white text-gray-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
          )}
        >
          <Save className="w-4 h-4" />
          {t("saved")} ({savedPosts.length})
        </button>
        <button
          onClick={() => setActiveTab("memory")}
          className={cn(
            "px-4 sm:px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
            activeTab === "memory" ? "bg-white text-gray-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
          )}
        >
          <Brain className="w-4 h-4" />
          {t("memory")} ({memoryItems.length})
        </button>
        <button
          onClick={handleSurpriseMe}
          className={cn(
            "px-4 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2",
            "bg-gradient-to-r from-primary to-purple-600 text-white shadow-md hover:shadow-lg hover:opacity-90 transform hover:-translate-y-0.5"
          )}
        >
          <Sparkles className="w-4 h-4" />
          {t("surpriseMe")}
        </button>
      </div>

      {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t("selectPlatform")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(PLATFORMS) as Platform[]).map((p) => {
                  const Icon = PLATFORMS[p].icon;
                  const isActive = platform === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-full border-2 transition-all",
                        isActive ? PLATFORMS[p].border + " " + PLATFORMS[p].bg : "border-transparent bg-gray-50 hover:bg-gray-100"
                      )}
                    >
                      <div className={cn("p-2 rounded-xl", isActive ? PLATFORMS[p].activeBg + " text-white" : "bg-white text-neutral-500")}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={cn("font-semibold", isActive ? PLATFORMS[p].color : "text-gray-700")}>{p}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t("postFormat")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {POST_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setPostFormat(format.id)}
                    className={cn(
                      "px-3 py-2 text-sm rounded-full border text-left transition-all flex items-center gap-2",
                      postFormat === format.id ? "border-primary bg-primary/5 text-primary font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <span>{format.icon}</span>
                    <span className="truncate">{t(format.id)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t("contentStrategy")}</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-2">{t("contentType")}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CONTENT_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => setContentType(type)}
                        className={cn(
                          "px-3 py-2 text-sm rounded-full border text-left transition-all",
                          contentType === type ? "border-primary bg-primary/5 text-primary font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        {t(type)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">{t("tone")}</Label>
                    <Select
                       value={tone}
                       onChange={(e) => setTone(e.target.value)}
                     >
                       {TONES.map(tKey => <option key={tKey} value={tKey}>{t(tKey)}</option>)}
                     </Select>
                   </div>
                   <div>
                     <Label className="mb-2">{t("language")}</Label>
                     <Select
                       value={language}
                       onChange={(e) => setLanguage(e.target.value)}
                     >
                       {LANGUAGES.map(lKey => <option key={lKey} value={lKey}>{t(lKey)}</option>)}
                     </Select>
                   </div>
                 </div>
               </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">{t("topicDetails")}</h3>
                <button 
                  onClick={handleSuggestIdea}
                  disabled={isSuggestingIdea}
                  className="text-sm text-primary flex items-center gap-1 hover:underline font-medium disabled:opacity-50"
                >
                  {isSuggestingIdea ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {t("suggestIdea")}
                </button>
              </div>
              <p className="text-sm text-neutral-600 mb-4">
                {t("describeYour")} <strong className="text-neutral-700">{t(tone).toLowerCase()} {t(contentType).toLowerCase()}</strong> {t("for")} <strong className="text-neutral-700">{platform}</strong>.
              </p>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={`e.g., Write a ${t(postFormat).toLowerCase()} about...`}
                className="h-32 resize-none"
              />
               
               <Button
                 onClick={() => handleGenerate()}
                 disabled={isGenerating || !topic.trim()}
                 className="mt-6 w-full py-3"
               >
                 {isGenerating ? (
                   <><Loader2 className="w-5 h-5 animate-spin mr-2" /> {t("generating")}</>
                 ) : (
                   <><Sparkles className="w-5 h-5 mr-2" /> {t("generatePost")}</>
                 )}
               </Button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50/50 gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className={cn("p-1.5 rounded-xl", PLATFORMS[platform].bg, PLATFORMS[platform].color)}>
                    {React.createElement(PLATFORMS[platform].icon, { className: "w-4 h-4" })}
                  </div>
                  <span className="font-semibold text-gray-900">{t("preview")}</span>
                  <span className="px-2 py-0.5 bg-gray-200 text-neutral-700 rounded text-xs font-semibold flex items-center gap-1">
                    {POST_FORMATS.find(f => f.id === postFormat)?.icon} {t(postFormat)}
                  </span>
                </div>
                {generatedPost && (
                  <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-2 text-neutral-600 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1 text-sm font-medium shrink-0"
                    >
                      {isEditing ? <><Eye className="w-4 h-4" /> {t("preview")}</> : <><Edit2 className="w-4 h-4" /> {t("edit")}</>}
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-2 text-neutral-600 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1 text-sm font-medium shrink-0"
                    >
                      {copied ? <><Check className="w-4 h-4 text-emerald-600" /> {t("linkCopied")}</> : <><Copy className="w-4 h-4" /> {t("copy")}</>}
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium shrink-0"
                    >
                      <Save className="w-4 h-4" /> {t("save")}
                    </button>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium shrink-0"
                    >
                      <CalendarIcon className="w-4 h-4" /> {t("scheduleToHub")}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 p-6 flex flex-col">
                {!generatedPost && !isGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                    <p>{t("generatedPostPlaceholder")}</p>
                  </div>
                ) : isGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-primary">
                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                    <p className="font-medium animate-pulse">{t("craftingPost")}</p>
                  </div>
                ) : (
                  <>
                    {isEditing ? (
                      <Textarea
                        value={generatedPost}
                        onChange={(e) => setGeneratedPost(e.target.value)}
                        className="flex-1 w-full p-4 resize-none"
                      />
                    ) : (
                      <div className="flex-1 p-6 bg-gray-50 rounded-xl border border-gray-100 whitespace-pre-wrap text-gray-800 font-medium leading-relaxed overflow-y-auto">
                        {generatedPost}
                      </div>
                    )}

                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">{t("charCount")}</span>
                        <span className={cn("text-sm font-bold", charPercentage > 100 ? "text-red-600" : "text-gray-700")}>
                          {charCount} / {charLimit}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-300", progressColor)}
                          style={{ width: `${Math.min(charPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Hash className="w-4 h-4 text-primary" /> {t("hashtagSuggestions")}
                        </h4>
                        <button
                          onClick={handleGenerateHashtags}
                          disabled={isGeneratingHashtags}
                          className="text-sm text-primary font-medium hover:text-primary/80 flex items-center gap-1"
                        >
                          {isGeneratingHashtags ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          {t("generateTags")}
                        </button>
                      </div>
                      
                      {hashtags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {hashtags.map((tag, idx) => (
                            <button
                              key={idx}
                              onClick={() => appendHashtag(tag)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-600 rounded-full text-sm font-medium transition-colors"
                            >
                              {tag} +
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">{t("clickGenerateTags")}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "memory" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              {t("eventzoneMemory")}
            </h2>
            <p className="text-gray-600">
              {t("eventzoneMemoryDesc")}
            </p>
          </div>

          <form onSubmit={handleAddMemory} className="mb-8 flex gap-4">
            <Input
              type="text"
              name="memoryContent"
              placeholder="e.g., We just launched a new QR code scanning feature for faster check-ins..."
              className="flex-1"
            />
            <Button
              type="submit"
              className="px-6 py-3 whitespace-nowrap"
            >
              {t("addFact")}
            </Button>
          </form>

          {memoryItems.length === 0 ? (
            <div className="p-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>{t("noMemoryItems")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {memoryItems.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start justify-between gap-4 group">
                  <div>
                    <p className="text-gray-800">{item.content}</p>
                    <span className="text-xs text-gray-400 mt-2 block">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteMemory(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "saved" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {savedPosts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Save className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>{t("noSavedPosts")}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {savedPosts.map((post) => {
                const Icon = PLATFORMS[post.platform].icon;
                return (
                  <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={cn("p-2 rounded-xl mt-1", PLATFORMS[post.platform].bg, PLATFORMS[post.platform].color)}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-bold text-gray-900">{post.platform}</span>
                            {post.postFormat && (
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold flex items-center gap-1">
                                {POST_FORMATS.find(f => f.id === post.postFormat)?.icon} {t(post.postFormat)}
                              </span>
                            )}
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold">{t(post.contentType)}</span>
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold">{t(post.tone)}</span>
                            <span className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(post.content);
                            toast.success(t("copiedToClipboard"));
                          }}
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-primary" />
              {t("schedulePost")}
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
              {t("schedulePostDesc")}
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <Label className="mb-1">{t("date")}</Label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label className="mb-1">{t("time")}</Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleScheduleToHub}
                disabled={!scheduleDate || !scheduleTime}
              >
                {t("schedulePost")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
