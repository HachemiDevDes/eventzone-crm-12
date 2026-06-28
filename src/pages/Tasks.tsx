import React, { useState, useMemo } from "react";
import { useStore } from "../store/StoreContext";
import { Priority, Task } from "../types";
import { Plus, Search, Calendar, CheckCircle2, Circle, Trash2, Edit2, GripVertical, Activity, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { isBefore, parseISO, isToday, startOfDay } from "date-fns";
import { cn } from "../lib/utils";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { useTranslation } from "../hooks/useTranslation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function Tasks() {
  const { data, addTask, updateTask, deleteTask, reorderTasks, currentUser, searchTarget, setSearchTarget } = useStore();
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Handle search target
  React.useEffect(() => {
    if (searchTarget && searchTarget.type === 'Task') {
      const task = data.tasks.find(t => t.id === searchTarget.id);
      if (task) {
        setViewingTask(task);
        setSearchTarget(null);
      }
    }
  }, [searchTarget, data.tasks, setSearchTarget]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isManager = currentUser?.role === "Manager";

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredTasks = useMemo(() => {
    return data.tasks
      .filter((t) => {
        if (filter === "pending") return !t.completed;
        if (filter === "completed") return t.completed;
        return true;
      })
      .filter((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((t) => {
        if (isManager) return true;
        return t.assignedTo === currentUser?.id;
      })
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.completed === b.completed) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return a.completed ? 1 : -1;
      });
  }, [data.tasks, filter, searchTerm, isManager, currentUser?.id]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = filteredTasks.findIndex((t) => t.id === active.id);
      const newIndex = filteredTasks.findIndex((t) => t.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(filteredTasks, oldIndex, newIndex);
        reorderTasks(newOrder);
      }
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "Haute":
        return "text-red-600 bg-red-50 border-red-100";
      case "Moyenne":
        return "text-yellow-600 bg-yellow-50 border-yellow-100";
      case "Basse":
        return "text-primary bg-primary/10 border-primary/20";
    }
  };

  const getRelatedName = (task: Task) => {
    if (!task.relatedToType) return t("general");
    if (task.relatedToType === "Plateforme") {
      return task.relatedToId;
    } else if (task.relatedToType === "Client") {
      return data.clients.find((c) => c.id === task.relatedToId)?.companyName || t("unknownClient");
    } else {
      return data.leads.find((l) => l.id === task.relatedToId)?.companyName || t("unknownLead");
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("tasksTitle")}</h1>
          <p className="text-neutral-600 mt-1">{t("manageTasksDescription") || "Gérez vos tâches quotidiennes et priorités."}</p>
        </div>
        <Button
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
          variant="primary"
          size="md"
          className="w-full sm:w-auto shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t("addTask")}
        </Button>
      </div>

      <div className="card-standard overflow-hidden flex-1 flex flex-col !p-0">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder={t("searchTaskPlaceholder")}
              className="pl-10 h-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-neutral-100 p-1 rounded-xl">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
              className={cn(
                "px-4 py-1.5 text-xs font-bold transition-all",
                filter === "all" 
                  ? "bg-white text-primary shadow-sm hover:bg-white" 
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-transparent"
              )}
            >
              {t("all")}
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("pending")}
              className={cn(
                "px-4 py-1.5 text-xs font-bold transition-all",
                filter === "pending" 
                  ? "bg-white text-primary shadow-sm hover:bg-white" 
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-transparent"
              )}
            >
              {t("pending")}
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("completed")}
              className={cn(
                "px-4 py-1.5 text-xs font-bold transition-all",
                filter === "completed" 
                  ? "bg-white text-primary shadow-sm hover:bg-white" 
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-transparent"
              )}
            >
              {t("completed")}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    isManager={isManager}
                    updateTask={updateTask}
                    deleteTask={deleteTask}
                    setEditingTask={setEditingTask}
                    setIsModalOpen={setIsModalOpen}
                    setViewingTask={setViewingTask}
                    t={t}
                    lang={lang}
                    confirmDeleteId={confirmDeleteId}
                    setConfirmDeleteId={setConfirmDeleteId}
                    getPriorityColor={getPriorityColor}
                    getRelatedName={getRelatedName}
                  />
                ))}
                {filteredTasks.length === 0 && (
                  <div className="text-center py-20">
              <div className="inline-flex p-8 bg-neutral-50 rounded-xl mb-6">
                      <CheckCircle2 className="w-12 h-12 text-neutral-200" />
                    </div>
                    <p className="text-neutral-400 font-bold text-lg">{t("noTasksFound")}</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {isModalOpen && (
        <TaskModal 
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }} 
          onSave={(taskData) => {
            if (editingTask) {
              updateTask(editingTask.id, taskData);
            } else {
              addTask(taskData as Task);
            }
          }}
          task={editingTask}
        />
      )}

      {viewingTask && (
        <TaskDetailsModal 
          task={viewingTask} 
          onClose={() => setViewingTask(null)}
          onEdit={() => {
            setEditingTask(viewingTask);
            setViewingTask(null);
            setIsModalOpen(true);
          }}
        />
      )}
    </div>
  );
}

function SortableTaskItem({ 
  task, 
  isManager, 
  updateTask, 
  deleteTask, 
  setEditingTask, 
  setIsModalOpen, 
  setViewingTask,
  t, 
  lang,
  confirmDeleteId, 
  setConfirmDeleteId,
  getPriorityColor,
  getRelatedName
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityTranslationKeys: Record<Priority, string> = {
    "Haute": "high",
    "Moyenne": "medium",
    "Basse": "low",
  };

  const isOverdue = !task.completed && isBefore(parseISO(task.dueDate), startOfDay(new Date()));

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => setViewingTask(task)}
      className={cn(
        "group bg-white border border-neutral-100 rounded-xl p-4 flex items-start space-x-4 transition-all hover:shadow-md hover:border-primary/20 cursor-pointer",
        task.completed && "bg-neutral-50/50 opacity-75",
        isOverdue && "border-red-100 bg-red-50/30"
      )}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="mt-1 cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          updateTask(task.id, { completed: !task.completed });
        }}
        className="mt-1 flex-shrink-0 focus:outline-none group/check"
      >
        {task.completed ? (
          <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center shadow-sm shadow-success/20">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-neutral-200 group-hover/check:border-primary transition-colors" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={cn(
            "text-sm font-bold truncate transition-all", 
            task.completed ? "text-neutral-400 line-through" : "text-neutral-900"
          )}>
            {task.title}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={cn(
              "px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-xl border", 
              getPriorityColor(task.priority)
            )}>
              {t(priorityTranslationKeys[task.priority])}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingTask(task);
                setIsModalOpen(true);
              }}
              className="p-1.5 text-neutral-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all"
              title={t("edit")}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        <p className={cn(
          "text-xs mb-3 line-clamp-2", 
          task.completed ? "text-neutral-400" : "text-neutral-600"
        )}>
          {task.description}
        </p>
        
        <div className="flex items-center space-x-4">
          <div className={cn(
            "flex items-center text-[10px] font-bold uppercase tracking-wider", 
            isOverdue ? "text-red-500" : "text-neutral-400"
          )}>
            <Calendar className="w-3 h-3 mr-1.5" />
            {new Date(task.dueDate).toLocaleDateString(lang === "fr" ? "fr-DZ" : "en-US")}
            {isOverdue && <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 rounded-xl text-red-600 font-black">{t("overdue")}</span>}
          </div>
          <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            <Activity className="w-3 h-3 mr-1.5" />
            {task.relatedToType ? `${t(task.relatedToType.toLowerCase() as any)}: ${getRelatedName(task)}` : t("general")}
          </div>
        </div>
      </div>

      {isManager && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirmDeleteId === task.id) {
              deleteTask(task.id);
              setConfirmDeleteId(null);
            } else {
              setConfirmDeleteId(task.id);
              setTimeout(() => setConfirmDeleteId(null), 3000);
            }
          }}
          className={cn(
            "ml-2 p-2 rounded-full transition-all flex-shrink-0",
            confirmDeleteId === task.id 
              ? "bg-red-500 text-white shadow-lg shadow-red-200" 
              : "text-neutral-300 hover:text-red-500 hover:bg-red-50"
          )}
          title={t("delete")}
        >
          {confirmDeleteId === task.id ? (
            <span className="text-[10px] font-black uppercase tracking-tighter px-1">Confirmer</span>
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}

function TaskDetailsModal({
  task,
  onClose,
  onEdit,
}: {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { t, lang } = useTranslation();
  const { data } = useStore();

  const getRelatedName = (task: Task) => {
    if (!task.relatedToType || !task.relatedToId) return "";
    if (task.relatedToType === "Lead") {
      return data.leads.find((l) => l.id === task.relatedToId)?.companyName || "";
    }
    if (task.relatedToType === "Client") {
      return data.clients.find((c) => c.id === task.relatedToId)?.companyName || "";
    }
    return task.relatedToId;
  };

  const priorityTranslationKeys: Record<Priority, string> = {
    "Haute": "high",
    "Moyenne": "medium",
    "Basse": "low",
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "Haute": return "text-red-600 bg-red-50 border-red-100";
      case "Moyenne": return "text-amber-600 bg-amber-50 border-amber-100";
      case "Basse": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      default: return "text-neutral-600 bg-neutral-50 border-neutral-100";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-8 pb-4 border-b border-neutral-100 shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex flex-wrap gap-2 mb-3">
            <span className={cn(
                  "px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-xl border", 
                  getPriorityColor(task.priority)
                )}>
                  {t(priorityTranslationKeys[task.priority])}
                </span>
                {task.completed && (
                  <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-xl border border-success/20 bg-success/10 text-success">
                    {t("completed")}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight break-words">
                {task.title}
              </h2>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              <Button variant="ghost" size="icon" onClick={onEdit} className="text-neutral-400 hover:text-primary h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-neutral-400 hover:text-gray-600 h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
          <div className="space-y-8">
            <div>
              <h3 className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.2em] mb-3">{t("description")}</h3>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {task.description || "Aucune description fournie."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 pt-8 border-t border-neutral-100">
              <div>
                <h3 className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.2em] mb-3">{t("dueDate")}</h3>
                <div className="flex items-center text-neutral-900 font-bold text-sm sm:text-base">
                  <Calendar className="w-4 h-4 mr-2 text-primary shrink-0" />
                  {new Date(task.dueDate).toLocaleDateString(lang === "fr" ? "fr-DZ" : "en-US")}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.2em] mb-3">{t("relatedTo")}</h3>
                <div className="flex items-center text-neutral-900 font-bold text-sm sm:text-base">
                  <Activity className="w-4 h-4 mr-2 text-primary shrink-0" />
                  <span className="truncate">{task.relatedToType ? `${t(task.relatedToType.toLowerCase() as any)}: ${getRelatedName(task)}` : t("general")}</span>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-neutral-100">
              <h3 className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.2em] mb-3">{t("assignedTo")}</h3>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mr-3 shrink-0">
                  {data.staff.find(s => s.id === task.assignedTo)?.name.charAt(0) || "U"}
                </div>
                <span className="text-neutral-900 font-bold text-sm sm:text-base truncate">
                  {data.staff.find(s => s.id === task.assignedTo)?.name || "Non assigné"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-neutral-50 px-4 sm:px-8 py-4 flex justify-end border-t border-neutral-100 shrink-0">
          <Button onClick={onClose} className="w-full sm:w-auto">
            {t("close")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TaskModal({
  onClose,
  onSave,
  task,
}: {
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  task?: Task | null;
}) {
  const { data, currentUser } = useStore();
  const { t } = useTranslation();
  const isManager = currentUser?.role === "Manager";
  const isSMM = currentUser?.role === "Social Media Manager";
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Task>>(
    task || {
      priority: "Moyenne",
      relatedToType: isSMM ? "Plateforme" : isManager ? undefined : "Lead",
      completed: false,
    }
  );

  const availableLeads = isManager 
    ? data.leads 
    : data.leads.filter(l => l.assignedTo === currentUser?.id);
    
  const availableClients = isManager 
    ? data.clients 
    : data.clients.filter(c => c.assignedTo === currentUser?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    if (task) {
      onSave(formData);
    } else {
      onSave({
        ...formData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      } as Task);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-visible">
        {/* Header */}
        <div className="p-6 sm:p-8 pb-0 shrink-0">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {task ? t("editTask") : t("newTask")}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                {step === 1 ? t("taskDetails") : t("assignmentAndRelations")}
              </p>
            </div>
            <Button 
              variant="ghost"
              size="icon"
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all h-8 w-8 sm:h-10 sm:w-10"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center space-x-4 mb-6 sm:mb-8">
            <div className="flex items-center space-x-2">
              <div className={cn("h-1.5 w-8 sm:w-12 rounded-full transition-all duration-500", step >= 1 ? 'bg-primary' : 'bg-gray-100')}></div>
              <div className={cn("h-1.5 w-8 sm:w-12 rounded-full transition-all duration-500", step >= 2 ? 'bg-primary' : 'bg-gray-100')}></div>
            </div>
            <span className="text-[10px] sm:text-xs text-neutral-700 font-bold uppercase tracking-widest">{t("step")} {step} / 2</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex-1 overflow-y-auto custom-scrollbar">
            {step === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-6">
                  <h3 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">{t("generalInformation")}</h3>
                  <div className="space-y-2">
                    <Label>{t("title")}</Label>
                    <Input
                      required
                      type="text"
                      placeholder={t("taskTitlePlaceholder")}
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("description")}</Label>
                    <Textarea
                      rows={4}
                      className="sm:rows-6"
                      placeholder={t("descriptionPlaceholder")}
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">{t("planning")}</h3>
                  <div className="space-y-2">
                    <Label>{t("dueDate")}</Label>
                    <div className="relative">
                      <Input
                        required
                        type="date"
                        className="pr-10"
                        value={formData.dueDate || ""}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("priority")}</Label>
                    <Select
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                      value={formData.priority || "Moyenne"}
                    >
                      <option value="Haute">{t("high")}</option>
                      <option value="Moyenne">{t("medium")}</option>
                      <option value="Basse">{t("low")}</option>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-6">
                  <h3 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">{t("relations")}</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label>{t("relatedTo")}</Label>
                      {isSMM ? (
                        <Select disabled value="Plateforme">
                          <option value="Plateforme">{t("socialPlatform")}</option>
                        </Select>
                      ) : (
                        <Select
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({ 
                              ...formData, 
                              relatedToType: val === "General" ? undefined : val as "Lead" | "Client" | "Plateforme", 
                              relatedToId: val === "General" ? undefined : "" 
                            });
                          }}
                          value={formData.relatedToType || "General"}
                        >
                          {isManager && <option value="General">{t("general")}</option>}
                          <option value="Lead">{t("lead")}</option>
                          <option value="Client">{t("client")}</option>
                          {isManager && <option value="Plateforme">{t("socialPlatform")}</option>}
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>{t("select")}</Label>
                      {isSMM || formData.relatedToType === "Plateforme" ? (
                        <Select
                          required={!!formData.relatedToType}
                          disabled={!formData.relatedToType}
                          onChange={(e) => setFormData({ ...formData, relatedToId: e.target.value })}
                          value={formData.relatedToId || ""}
                        >
                          <option value="">{t("selectPlaceholder")}</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Meta">Meta (Facebook/Instagram)</option>
                          <option value="TikTok">TikTok</option>
                        </Select>
                      ) : (
                        <Select
                          required={!!formData.relatedToType}
                          disabled={!formData.relatedToType}
                          onChange={(e) => setFormData({ ...formData, relatedToId: e.target.value })}
                          value={formData.relatedToId || ""}
                        >
                          <option value="">{t("selectPlaceholder")}</option>
                          {formData.relatedToType === "Lead"
                            ? availableLeads.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.companyName}
                                </option>
                              ))
                            : formData.relatedToType === "Client" 
                              ? availableClients.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.companyName}
                                  </option>
                                ))
                              : null}
                        </Select>
                      )}
                    </div>
                  </div>
                </div>

                {isManager && (
                  <div className="space-y-6">
                    <h3 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">{t("assignment")}</h3>
                    <div className="space-y-4">
                      <Label>{t("assignedTo")}</Label>
                      <div className="grid grid-cols-1 gap-3 max-h-[200px] sm:max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {data.team.map((member) => {
                          const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();
                          const isSelected = formData.assignedTo === member.id;
                          
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, assignedTo: member.id })}
                              className={cn(
                                "flex items-center space-x-3 p-3 rounded-full border transition-all text-left",
                                isSelected 
                                  ? "border-primary bg-primary/5 shadow-sm" 
                                  : "border-neutral-100 bg-white hover:border-neutral-200"
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
                                isSelected ? "bg-primary text-white" : "bg-neutral-100 text-neutral-500"
                              )}>
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={cn("text-xs font-bold truncate", isSelected ? "text-primary" : "text-neutral-800")}>
                                  {member.name}
                                </p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">
                                  {member.role}
                                </p>
                              </div>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 sm:p-8 bg-neutral-50/30 border-t border-neutral-100 flex justify-between items-center shrink-0 mt-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={step === 1 ? onClose : () => setStep(1)}
              className="font-bold text-neutral-500 uppercase tracking-widest text-[10px] sm:text-xs"
            >
              {step === 1 ? t("cancel") : t("back")}
            </Button>
            <div className="flex space-x-3">
              <Button
                type="submit"
                variant="primary"
                className="px-6 sm:px-8 shadow-lg shadow-primary/20 font-bold uppercase tracking-widest text-[10px] sm:text-xs"
              >
                {step === 1 ? t("next") : t("save")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

