import React, { useState } from "react";
import { Supplier, SupplierOrder } from "../types";
import { X, Calendar, DollarSign, FileText, Truck, Save, Building2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import { cn } from "../lib/utils";
import { useTranslation } from "../hooks/useTranslation";

interface SupplierOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: SupplierOrder) => void;
  initialData?: SupplierOrder | null;
  suppliers: Supplier[];
  orderStatuses: string[];
  paymentStatuses: string[];
  paymentTerms: string[];
  preselectedSupplierId?: string;
}

export default function SupplierOrderModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  suppliers,
  orderStatuses,
  paymentStatuses,
  paymentTerms,
  preselectedSupplierId
}: SupplierOrderModalProps) {
  const [formData, setFormData] = useState<Partial<SupplierOrder>>(
    initialData || {
      supplierId: preselectedSupplierId || "",
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: "",
      totalAmount: 0,
      status: "En attente",
      paymentStatus: "Non payé",
      paymentTerms: "30 jours",
      notes: ""
    }
  );

  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'invoiceUrl' | 'contractUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      alert("Veuillez sélectionner un fournisseur");
      return;
    }
    
    // Ensure dates are properly formatted ISO strings if they exist
    const orderDate = formData.orderDate ? new Date(formData.orderDate).toISOString() : new Date().toISOString();
    const deliveryDate = formData.deliveryDate ? new Date(formData.deliveryDate).toISOString() : undefined;

    onSave({
      ...formData,
      id: initialData?.id || uuidv4(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      orderDate,
      deliveryDate,
    } as SupplierOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-2xl my-8 overflow-hidden border border-neutral-200 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-[12px] bg-primary/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                {initialData ? t("edit_order") : t("new_supplier_order")}
              </h2>
              <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mt-0.5">
                {t("order_details")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(100vh-8rem)]">
          <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
            {/* Fournisseur */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">{t("supplier_selection")}</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierId">{t("supplier")} *</Label>
                <div className="relative group">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors z-10" />
                  <Select
                    id="supplierId"
                    required
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="pl-10"
                    disabled={!!preselectedSupplierId && !initialData}
                  >
                    <option value="">{t("select_supplier")}...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName} - {s.category}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* Dates & Montant */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">{t("dates_and_amount")}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="orderDate">{t("order_date")} *</Label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors z-10" />
                    <Input
                      id="orderDate"
                      type="date"
                      required
                      value={formData.orderDate?.split('T')[0] || ""}
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">{t("delivery_date_planned")}</Label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors z-10" />
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={formData.deliveryDate?.split('T')[0] || ""}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalAmount">{t("total_amount")} (DZD) *</Label>
                  <div className="relative group">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors z-10" />
                    <Input
                      id="totalAmount"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.totalAmount || ""}
                      onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Statuts */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">{t("status_and_payment")}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status">{t("order_status")} *</Label>
                  <Select
                    id="status"
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {orderStatuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">{t("payment_status")} *</Label>
                  <Select
                    id="paymentStatus"
                    required
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                  >
                    {paymentStatuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">{t("payment_terms")}</Label>
                  <Select
                    id="paymentTerms"
                    value={formData.paymentTerms || ""}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  >
                    <option value="">{t("select")}...</option>
                    {paymentTerms.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">{t("documents")}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="invoiceUrl">{t("invoice")} (Document)</Label>
                  <div className="relative group">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors z-10" />
                    <Input
                      id="invoiceUrl"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'invoiceUrl')}
                      className="pl-10 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                  </div>
                  {formData.invoiceUrl && (
                    <p className="mt-1 text-xs text-emerald-600 font-medium flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                      {t("document_attached")}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractUrl">{t("contract")} (Document)</Label>
                  <div className="relative group">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors z-10" />
                    <Input
                      id="contractUrl"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'contractUrl')}
                      className="pl-10 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                  </div>
                  {formData.contractUrl && (
                    <p className="mt-1 text-xs text-emerald-600 font-medium flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                      {t("document_attached")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">{t("notes")}</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t("notes_description")}</Label>
                <div className="relative group">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors z-10" />
                  <Textarea
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="pl-10 min-h-[100px]"
                    placeholder={t("order_details_placeholder")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 sm:p-8 bg-neutral-50/30 border-t border-neutral-100 flex justify-between items-center shrink-0 mt-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="font-bold text-neutral-500 uppercase tracking-widest text-[10px] sm:text-xs"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-6 sm:px-8 shadow-lg shadow-primary/20 font-bold uppercase tracking-widest text-[10px] sm:text-xs flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
