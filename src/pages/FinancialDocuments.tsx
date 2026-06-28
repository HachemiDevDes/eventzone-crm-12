import React, { useState, useRef } from "react";
import { useStore } from "../store/StoreContext";
import { Offer, OfferStatus, DocumentType } from "../types";
import { formatDZD, cn } from "../lib/utils";
import { Plus, Search, FileText, CheckCircle, XCircle, Clock, ExternalLink, Edit2, Paperclip, FileDown, MessageCircle, Mail, Trash2, AlertTriangle, Settings, LayoutGrid, List, ChevronLeft, ChevronRight, Calendar, Users, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "../hooks/useTranslation";
import CompanySettingsModal from "../components/CompanySettingsModal";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import fr from "../locales/fr";
import en from "../locales/en";

const languages = { fr, en };

export default function FinancialDocuments() {
  const { data, addOffer, updateOffer, deleteOffer, updateCompanySettings, currentUser, searchTarget, setSearchTarget } = useStore();
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Handle search target
  React.useEffect(() => {
    if (searchTarget && searchTarget.type === 'Offer') {
      const offer = data.offers.find(o => o.id === searchTarget.id);
      if (offer) {
        setEditingOffer(offer);
        setIsModalOpen(true);
        setSearchTarget(null);
      }
    }
  }, [searchTarget, data.offers, setSearchTarget]);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const [activeDownloadMenu, setActiveDownloadMenu] = useState<string | null>(null);

  const isManager = currentUser?.role === "Manager";

  const filteredOffers = (data.offers || []).filter(
    (o) => {
      const related = o.relatedToType === "Client" 
        ? data.clients.find((c) => c.id === o.relatedToId)
        : data.leads.find((l) => l.id === o.relatedToId);

      const matchesSearch = (o.eventName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (related?.companyName || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      if (isManager) return matchesSearch;
      
      return matchesSearch && related?.assignedTo === currentUser?.id;
    }
  );

  const getStatusIcon = (status: OfferStatus) => {
    switch (status) {
      case "Accepté":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "Rejeté":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "En attente":
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusClass = (status: OfferStatus) => {
    switch (status) {
      case "Accepté":
        return "bg-green-50 text-green-700 border-green-200";
      case "Rejeté":
        return "bg-red-50 text-red-700 border-red-200";
      case "En attente":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
  };

  const generatePDF = (offer: Offer, targetLang?: "fr" | "en") => {
    const pdfLang = targetLang || lang;
    const pdfT = (key: string) => {
      return (languages[pdfLang as keyof typeof languages] as any)[key] || (languages["fr"] as any)[key] || key;
    };

    const related = offer.relatedToType === "Client" 
      ? data.clients.find(c => c.id === offer.relatedToId)
      : data.leads.find(l => l.id === offer.relatedToId);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const customServicesTotal = (offer.customServices || []).reduce((sum, s) => sum + (s.price * s.quantity), 0);
    const totalHT = offer.price + customServicesTotal;
    const vat = totalHT * 0.19;
    const totalTTC = totalHT + vat;
    const docType = offer.documentType || (pdfLang === 'fr' ? "Devis" : "Quote");
    const company = data.companySettings;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${docType} ${offer.eventName ? `- ${offer.eventName}` : ''}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
          
          /* Standard A4 Layout */
          * { box-sizing: border-box; }
          body { 
            font-family: 'Inter', sans-serif; 
            color: #1e293b; 
            margin: 0; 
            padding: 30px; 
            line-height: 1.5;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Typography */
          h1, h2, h3, h4, .font-display {
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          
          /* Header setup */
          .header-container {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 40px;
            margin-bottom: 35px;
            align-items: start;
          }
          
          .company-profile {
            display: flex;
            flex-direction: column;
          }
          
          .logo { 
            font-size: 28px; 
            font-weight: 800; 
            color: #0A1628; 
            text-transform: lowercase; 
            letter-spacing: -1px; 
            margin: 0; 
          }
          .logo span {
            color: #00D2D2;
          }
          .logo-img { 
            max-height: 55px; 
            max-width: 200px; 
            object-fit: contain; 
            margin-bottom: 15px; 
          }
          
          .company-details { 
            font-size: 11.5px; 
            color: #475569; 
            margin-top: 5px; 
            line-height: 1.6; 
          }
          .company-details div {
            display: flex;
            align-items: center;
            margin-bottom: 3px;
          }
          
          /* Right Side Invoice details */
          .document-meta-box {
            text-align: right;
          }
          
          .doc-badge {
            display: inline-block;
            background-color: #0A1628;
            color: #ffffff;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 20px;
            font-weight: 800;
            padding: 8px 24px;
            border-radius: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            border-left: 4px solid #00D2D2;
          }
          
          .meta-info-row {
            font-size: 11.5px;
            color: #64748b;
            margin: 3px 0;
          }
          .meta-info-row strong {
            color: #0A1628;
          }
          
          /* Client Card Box */
          .client-card {
            margin-top: 25px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            text-align: left;
            position: relative;
            overflow: hidden;
          }
          .client-card::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background-color: #00D2D2;
          }
          
          .client-label { 
            font-size: 10px; 
            font-weight: 700; 
            color: #64748b; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            margin-bottom: 6px; 
          }
          
          .client-name { 
            font-weight: 700; 
            font-size: 15px; 
            color: #0A1628; 
            margin-bottom: 4px; 
          }
          
          .client-details { 
            font-size: 11.5px; 
            color: #334155; 
            line-height: 1.5; 
          }
          .client-legal-tags {
            font-size: 10px;
            color: #64748b;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #cbd5e1;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          
          /* Brand Stripe Divider */
          .brand-divider { 
            height: 4px; 
            background: linear-gradient(90deg, #0A1628 0%, #00D2D2 100%); 
            margin: 25px 0; 
            border: none;
            border-radius: 2px;
          }
          
          /* Config Grid (Bento style) */
          .config-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 1px; 
            background-color: #cbd5e1; 
            border-radius: 10px; 
            overflow: hidden;
            border: 1px solid #cbd5e1;
            margin-bottom: 25px; 
          }
          
          .config-item { 
            display: flex; 
            flex-direction: column; 
            background-color: #f8fafc;
            padding: 14px 18px;
          }
          
          .config-label { 
            font-size: 10px; 
            font-weight: 700; 
            color: #64748b; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            margin-bottom: 4px; 
          }
          
          .config-value { 
            font-size: 13px; 
            font-weight: 700; 
            color: #0A1628; 
          }
          
          /* Table style */
          .description-section { 
            margin-bottom: 25px; 
          }
          
          .platform-access { 
            font-size: 12.5px; 
            font-weight: 700; 
            color: #0A1628; 
            margin-bottom: 12px; 
            display: flex;
            align-items: center;
          }
          .platform-access::before {
            content: '';
            display: inline-block;
            width: 6px;
            height: 12px;
            background-color: #00D2D2;
            margin-right: 8px;
            border-radius: 2px;
          }
          
          table { 
            width: 100%; 
            border-collapse: separate; 
            border-spacing: 0; 
            margin-bottom: 25px; 
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
          }
          
          th { 
            text-align: left; 
            font-size: 10px; 
            font-weight: 700; 
            color: #ffffff; 
            background-color: #0A1628;
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            padding: 12px 16px; 
            border-bottom: 1px solid #0A1628; 
          }
          
          td { 
            padding: 12px 16px; 
            border-bottom: 1px solid #e2e8f0; 
            font-size: 12.5px; 
            vertical-align: middle; 
            color: #334155;
          }
          
          tr:last-child td {
            border-bottom: none;
          }
          
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          .text-right { 
            text-align: right; 
          }
          
          .monospaced {
            font-family: 'Inter', monospace;
            font-variant-numeric: tabular-nums;
          }
          
          .badge-inclusion {
            display: inline-block;
            background-color: #f0fdf4;
            color: #16a34a;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 10px;
            border-radius: 9999px;
            border: 1px solid #bbf7d0;
            text-transform: uppercase;
          }
          
          /* Bottom section with totals & signature side by side */
          .bottom-section-grid {
            display: grid;
            grid-template-columns: 1.3fr 1fr;
            gap: 40px;
            margin-top: 25px;
            align-items: start;
          }
          
          /* Signatures Stamp Zone */
          .signatures-container { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
          }
          
          .signature-box { 
            background-color: #ffffff;
            border: 1.5px dashed #cbd5e1; 
            border-radius: 8px; 
            padding: 12px; 
            text-align: center;
          }
          
          .signature-title { 
            font-size: 10px; 
            font-weight: 700; 
            color: #475569; 
            text-transform: uppercase; 
            letter-spacing: 0.3px; 
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 1px solid #f1f5f9;
          }
          
          .signature-space { 
            height: 70px; 
          }
          
          /* Totals display box */
          .totals-box { 
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            border-left: 4px solid #0A1628;
          }
          
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 6px 0; 
            font-size: 12px; 
            color: #475569; 
          }
          
          .total-row.grand-total { 
            border-top: 1.5px dashed #cbd5e1; 
            margin-top: 10px; 
            padding-top: 10px; 
            font-size: 17px; 
            font-weight: 800; 
            color: #0A1628; 
          }
          
          .total-value { 
            font-weight: 700; 
            color: #0A1628;
            font-family: 'Inter', monospace;
            font-variant-numeric: tabular-nums;
          }
          
          .grand-total-value { 
            color: #00D2D2; 
            font-family: 'Inter', monospace;
            font-variant-numeric: tabular-nums;
            font-weight: 800;
          }
          
          /* Footer Details style */
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e2e8f0; 
            text-align: center; 
          }
          
          .footer-company { 
            font-size: 13px; 
            font-weight: 800; 
            color: #0A1628; 
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 6px; 
          }
          
          .footer-info { 
            font-size: 10.5px; 
            color: #64748b; 
            line-height: 1.6; 
          }
          
          .legal-grid { 
            display: flex; 
            justify-content: center; 
            flex-wrap: wrap; 
            gap: 15px; 
            margin-top: 6px; 
            font-weight: 500;
          }
          .legal-grid span {
            display: flex;
            align-items: center;
          }
          .legal-grid span::after {
            content: '•';
            margin-left: 15px;
            color: #cbd5e1;
          }
          .legal-grid span:last-child::after {
            content: none;
          }
          
          .bank-grid {
            margin-top: 8px;
            padding: 8px;
            background-color: #f1f5f9;
            border-radius: 6px;
            display: inline-block;
            font-size: 10.5px;
            color: #334155;
            font-weight: 500;
          }
          
          .validity-tag { 
            margin-top: 14px; 
            font-size: 11px; 
            font-weight: 700;
            color: #D97706; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          @media print {
            body { 
              padding: 0; 
              color: #000000;
            }
            .no-print { display: none; }
            @page { 
              size: A4; 
              margin: 12mm 12mm 12mm 12mm; 
            }
            .bottom-section-grid {
              page-break-inside: avoid;
            }
            .footer {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="company-profile">
            ${company?.logoUrl ? `<img src="${company.logoUrl}" class="logo-img" alt="Logo" />` : `<h1 class="logo">event<span>zone</span></h1>`}
            <div class="company-details">
              ${company?.address ? `<div style="font-weight: 600; color: #0A1628;">${company.address}</div>` : ''}
              ${company?.phone ? `<div><strong>${pdfT('phone')}:</strong> &nbsp;${company.phone}</div>` : ''}
              ${company?.email ? `<div><strong>${pdfT('email')}:</strong> &nbsp;${company.email}</div>` : ''}
              <div style="margin-top: 4px; font-weight: 600; color: #00D2D2;">eventzone.pro</div>
            </div>
          </div>
          
          <div class="document-meta-box">
            <div class="doc-badge">${docType}</div>
            <div class="meta-info-row"><strong>${pdfT('pdfDate')}:</strong> &nbsp;${new Date().toLocaleDateString(pdfLang === 'fr' ? 'fr-FR' : 'en-US')}</div>
            <div class="meta-info-row"><strong>${pdfT('pdfRef')}:</strong> &nbsp;${offer.id.substring(0, 8).toUpperCase()}</div>
            
            <div class="client-card">
              <div class="client-label">${pdfT('pdfTo')}</div>
              <div class="client-name">${related?.companyName || 'Client'}</div>
              <div class="client-details">
                ${related?.contactPerson ? `<div>${related.contactPerson}</div>` : ''}
                ${related?.address ? `<div>${related.address}</div>` : ''}
                ${(related as any)?.rc || (related as any)?.nif || (related as any)?.nis || (related as any)?.art ? `
                  <div class="client-legal-tags">
                    ${(related as any)?.rc ? `<span>RC: ${(related as any).rc}</span>` : ''}
                    ${(related as any)?.nif ? `<span>NIF: ${(related as any).nif}</span>` : ''}
                    ${(related as any)?.nis ? `<span>NIS: ${(related as any).nis}</span>` : ''}
                    ${(related as any)?.art ? `<span>ART: ${(related as any).art}</span>` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        <hr class="brand-divider" />
        
        ${offer.eventName || offer.eventDate || offer.attendees ? `
        <div class="config-grid">
          <div class="config-item">
            <span class="config-label">${pdfT('pdfEvent')}</span>
            <span class="config-value">${offer.eventName || 'N/A'}</span>
          </div>
          <div class="config-item">
            <span class="config-label">${pdfT('pdfDate')}</span>
            <span class="config-value">${offer.eventDate ? new Date(offer.eventDate).toLocaleDateString(pdfLang === 'fr' ? 'fr-FR' : 'en-US') : 'N/A'}</span>
          </div>
          <div class="config-item">
            <span class="config-label">${pdfT('pdfAttendees')}</span>
            <span class="config-value">${offer.attendees || 'N/A'} ${pdfT('pdfPax')}</span>
          </div>
        </div>
        ` : ''}

        <div class="description-section">
          <div class="platform-access">${pdfT('pdfPlatformAccess')}</div>
          <table>
            <thead>
              <tr>
                <th>${pdfT('pdfDescription')}</th>
                <th class="text-right" style="width: 140px;">Prix Unitaire</th>
                <th class="text-right" style="width: 100px;">${pdfT('pdfQuantity')}</th>
                <th class="text-right" style="width: 150px;">${pdfT('pdfTotalHT')}</th>
              </tr>
            </thead>
            <tbody>
              ${offer.price > 0 ? `
                <tr>
                  <td style="font-weight: 600; color: #0A1628;">Accès Plateforme & Services de base</td>
                  <td class="text-right monospaced">${formatDZD(offer.price)}</td>
                  <td class="text-right monospaced">1</td>
                  <td class="text-right monospaced" style="font-weight: 700; color: #0A1628;">${formatDZD(offer.price)}</td>
                </tr>
              ` : ''}
              ${offer.servicesIncluded.map(s => `
                <tr>
                  <td style="color: #475569;"><span style="color: #00D2D2; margin-right: 6px; font-weight: bold;">✓</span> ${pdfT(s)}</td>
                  <td class="text-right"><span class="badge-inclusion">${pdfLang === 'fr' ? 'Inclus' : 'Included'}</span></td>
                  <td class="text-right monospaced">1</td>
                  <td class="text-right"><span class="badge-inclusion">${pdfLang === 'fr' ? 'Inclus' : 'Included'}</span></td>
                </tr>
              `).join('')}
              ${(offer.customServices || []).map(s => `
                <tr>
                  <td style="font-weight: 500; color: #0A1628;">${s.name}</td>
                  <td class="text-right monospaced">${formatDZD(s.price)}</td>
                  <td class="text-right monospaced">${s.quantity}</td>
                  <td class="text-right monospaced" style="font-weight: 700; color: #0A1628;">${formatDZD(s.price * s.quantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="bottom-section-grid">
          <div class="signatures-container">
            <div class="signature-box">
              <div class="signature-title">${pdfLang === 'fr' ? "L'Organisateur" : 'The Organizer'}</div>
              <div style="font-size: 9px; color: #94a3b8; font-style: italic; margin-bottom: 5px;">SPASU Eventzone (Signature & Cachet)</div>
              <div class="signature-space"></div>
            </div>
            <div class="signature-box">
              <div class="signature-title">${pdfLang === 'fr' ? 'Le Client' : 'The Client'}</div>
              <div style="font-size: 9px; color: #94a3b8; font-style: italic; margin-bottom: 5px;">Pour Accord (Signature & Cachet)</div>
              <div class="signature-space"></div>
            </div>
          </div>

          <div class="totals-box">
            <div class="total-row">
              <span>${pdfT('pdfTotalHT')}</span>
              <span class="total-value">${formatDZD(totalHT)}</span>
            </div>
            <div class="total-row">
              <span>${pdfT('pdfVat')}</span>
              <span class="total-value">${formatDZD(vat)}</span>
            </div>
            <div class="total-row grand-total">
              <span>${pdfT('pdfTotalTTC')}</span>
              <span class="grand-total-value">${formatDZD(totalTTC)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="footer-company">${company?.name || 'SPASU Eventzone'}</div>
          <div class="footer-info">
            ${company?.address ? `${company.address} &nbsp; | &nbsp; ` : ''} 
            ${company?.phone ? `${pdfT('phone')}: ${company.phone} &nbsp; | &nbsp; ` : ''} 
            ${company?.email ? `${pdfT('email')}: ${company.email}` : ''}
            
            <div class="legal-grid">
              ${company?.rc ? `<span>RC: ${company.rc}</span>` : ''}
              ${company?.nif ? `<span>NIF: ${company.nif}</span>` : ''}
              ${company?.nis ? `<span>NIS: ${company.nis}</span>` : ''}
              ${company?.art ? `<span>ART: ${company.art}</span>` : ''}
            </div>
            
            ${company?.bankName && company?.rib ? `
              <div class="bank-grid">
                <strong>${pdfT('pdfBank')}:</strong> ${company.bankName} &nbsp; | &nbsp; <strong>${pdfT('pdfRib')}:</strong> <span style="font-family: monospace; font-size: 11px;">${company.rib}</span>
              </div>
            ` : ''}
            
            <div class="validity-tag">${pdfT('pdfValidFor')}</div>
          </div>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("financialDocuments") || "Documents Financiers"}</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="bg-white text-gray-700 border border-gray-300 px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center justify-center space-x-1.5 md:space-x-2 hover:bg-gray-50 transition-colors shadow-sm text-xs md:text-sm font-medium"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
            <span>Paramètres</span>
          </button>
          <a
            href="https://eventzone-devis-calculator-776224860515.us-west1.run.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 md:px-4 md:py-2 rounded-xl flex items-center space-x-1.5 md:space-x-2 hover:bg-gray-50 transition-colors text-xs md:text-sm font-medium flex-1 sm:flex-none justify-center"
          >
            <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
            <span className="whitespace-nowrap">{t("quoteCalculator")}</span>
          </a>
          <button
            onClick={() => {
              setEditingOffer(null);
              setIsModalOpen(true);
            }}
            className="bg-primary-gradient text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center space-x-1.5 md:space-x-2 hover:opacity-90 transition-all shadow-md shadow-primary/20 text-xs md:text-sm font-medium flex-1 sm:flex-none justify-center"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="whitespace-nowrap">{t("newQuote")}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchQuotePlaceholder")}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl ml-4">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-full transition-all ${
                viewMode === "grid"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Vue Grille"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-full transition-all ${
                viewMode === "table"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Vue Tableau"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {viewMode === "grid" ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOffers.map((offer) => {
                const related = offer.relatedToType === "Client" 
                  ? data.clients.find((c) => c.id === offer.relatedToId)
                  : data.leads.find((l) => l.id === offer.relatedToId);
                return (
                  <div
                    key={offer.id}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{offer.eventName}</h3>
                          <p className="text-sm text-gray-500">{related?.companyName || t("unknownClient")}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingOffer(offer);
                            setIsModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-primary p-1.5 rounded-full hover:bg-primary/10 transition-colors"
                          title={t("edit")}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isManager && (
                          <button
                            onClick={() => setOfferToDelete(offer.id)}
                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                            title={t("delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t("eventDate")}:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(offer.eventDate).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t("attendees")}:</span>
                        <span className="font-medium text-gray-900">{offer.attendees}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t("followedUpOn")}:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(offer.followUpDate).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm block mb-1">{t("services")}:</span>
                        <div className="flex flex-wrap gap-1">
                          {offer.servicesIncluded.map((service, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                              {t(service)}
                            </span>
                          ))}
                        </div>
                      </div>
                      {offer.attachmentName && (
                        <div className="mt-3 flex items-center space-x-2 text-sm text-primary bg-primary/10 p-2 rounded-md">
                          <Paperclip className="w-4 h-4" />
                          <span className="truncate">{offer.attachmentName}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <select
                          value={offer.status}
                          onChange={(e) => updateOffer(offer.id, { status: e.target.value as OfferStatus })}
                          disabled={!isManager}
                          className={`text-sm font-medium px-3 py-1.5 rounded-xl border appearance-none ${isManager ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} pr-8 ${getStatusClass(
                            offer.status
                          )}`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: "right 0.5rem center",
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "1.5em 1.5em",
                          }}
                        >
                          <option value="En attente">{t("pending")}</option>
                          <option value="Accepté">{t("accepted")}</option>
                          <option value="Rejeté">{t("rejected")}</option>
                        </select>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {formatDZD(offer.price)}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => generatePDF(offer, 'fr')} 
                          className="flex-1 flex items-center justify-center space-x-2 py-2 bg-gray-50 hover:bg-primary/10 hover:text-primary text-gray-700 rounded-full text-xs font-bold transition-colors border border-transparent hover:border-primary/20"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>FR</span>
                        </button>
                        <button 
                          onClick={() => generatePDF(offer, 'en')} 
                          className="flex-1 flex items-center justify-center space-x-2 py-2 bg-gray-50 hover:bg-primary/10 hover:text-primary text-gray-700 rounded-full text-xs font-bold transition-colors border border-transparent hover:border-primary/20"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>EN</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-neutral-700 uppercase tracking-wider">Document</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-700 uppercase tracking-wider">{t("client")}/{t("lead")}</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-700 uppercase tracking-wider">Date Événement</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-700 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-700 uppercase tracking-wider text-right">Montant</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-700 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOffers.map((offer) => {
                    const related = offer.relatedToType === "Client" 
                      ? data.clients.find((c) => c.id === offer.relatedToId)
                      : data.leads.find((l) => l.id === offer.relatedToId);
                    return (
                      <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{offer.eventName}</div>
                              <div className="text-xs text-gray-500">{offer.documentType || "Devis"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{related?.companyName || t("unknownClient")}</div>
                          <div className="text-xs text-gray-500">{t(offer.relatedToType.toLowerCase() as any)}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(offer.eventDate).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={offer.status}
                            onChange={(e) => updateOffer(offer.id, { status: e.target.value as OfferStatus })}
                            disabled={!isManager}
                            className={`text-xs font-medium px-2 py-1 rounded-xl border appearance-none ${isManager ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} pr-6 ${getStatusClass(
                              offer.status
                            )}`}
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: "right 0.3rem center",
                              backgroundRepeat: "no-repeat",
                              backgroundSize: "1.2em 1.2em",
                            }}
                          >
                            <option value="En attente">{t("pending")}</option>
                            <option value="Accepté">{t("accepted")}</option>
                            <option value="Rejeté">{t("rejected")}</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-primary">
                          {formatDZD(offer.price)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <div className="flex items-center bg-gray-50 rounded-xl p-0.5 border border-gray-100">
                              <button
                                onClick={() => generatePDF(offer, 'fr')}
                                className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-primary hover:bg-white rounded-full transition-all"
                                title="Download FR"
                              >
                                FR
                              </button>
                              <div className="w-px h-3 bg-gray-200 mx-0.5"></div>
                              <button
                                onClick={() => generatePDF(offer, 'en')}
                                className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-primary hover:bg-white rounded-full transition-all"
                                title="Download EN"
                              >
                                EN
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                setEditingOffer(offer);
                                setIsModalOpen(true);
                              }}
                              className="text-gray-400 hover:text-primary p-1.5 rounded-full hover:bg-primary/10 transition-colors"
                              title={t("edit")}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {isManager && (
                              <button
                                onClick={() => setOfferToDelete(offer.id)}
                                className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                                title={t("delete")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {filteredOffers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {t("noQuotesFound")}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <NewOfferModal 
          onClose={() => {
            setIsModalOpen(false);
            setEditingOffer(null);
          }} 
          onSave={(offer) => {
            if (editingOffer) {
              updateOffer(editingOffer.id, offer);
            } else {
              addOffer(offer);
            }
          }} 
          initialData={editingOffer}
        />
      )}

      <CompanySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={data.companySettings}
        onSave={updateCompanySettings}
      />

      {offerToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">{t("deleteQuoteConfirmTitle") || "Supprimer le devis"}</h3>
            </div>
            <p className="text-gray-600 mb-6">
              {t("deleteQuoteConfirmMessage") || "Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible."}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setOfferToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full font-medium transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => {
                  deleteOffer(offerToDelete);
                  setOfferToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 font-medium transition-colors shadow-sm shadow-red-200"
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

function NewOfferModal({
  onClose,
  onSave,
  initialData
}: {
  onClose: () => void;
  onSave: (offer: Offer) => void;
  initialData: Offer | null;
}) {
  const { data, currentUser } = useStore();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isManager = currentUser?.role === "Manager";
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Offer>>(
    initialData || {
      status: "En attente",
      servicesIncluded: [],
      customServices: [],
      relatedToType: "Client",
      documentType: "Devis"
    }
  );

  const addCustomService = () => {
    setFormData({
      ...formData,
      customServices: [...(formData.customServices || []), { name: "", price: 0, quantity: 1 }]
    });
  };

  const removeCustomService = (index: number) => {
    setFormData({
      ...formData,
      customServices: (formData.customServices || []).filter((_, i) => i !== index)
    });
  };

  const updateCustomService = (index: number, field: string, value: any) => {
    const services = [...(formData.customServices || [])];
    services[index] = { ...services[index], [field]: value };
    setFormData({ ...formData, customServices: services });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to a server and get a URL.
      // For this MVP, we'll just store the name and create a local object URL.
      setFormData({
        ...formData,
        attachmentName: file.name,
        attachmentUrl: URL.createObjectURL(file)
      });
    }
  };

  const availableServices = [
    "ticketingPlatform",
    "registrationForm",
    "mobileApp",
    "badgePrinting",
    "hostesses",
    "accessControl",
    "reportsAnalytics",
  ];

  const handleServiceToggle = (service: string) => {
    const current = formData.servicesIncluded || [];
    if (current.includes(service)) {
      setFormData({ ...formData, servicesIncluded: current.filter((s) => s !== service) });
    } else {
      setFormData({ ...formData, servicesIncluded: [...current, service] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    onSave({
      ...formData,
      id: initialData?.id || uuidv4(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
    } as Offer);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 pb-0 shrink-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {initialData ? t("editOfferTitle") : t("addOfferTitle")}
              </h2>
              <p className="text-sm text-neutral-700 mt-1">
                {step === 1 ? t("projectDetails") : t("offerDetails")}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="flex items-center space-x-2">
              <div className={cn("h-1.5 w-12 rounded-full transition-all duration-500", step >= 1 ? 'bg-primary' : 'bg-gray-100')}></div>
              <div className={cn("h-1.5 w-12 rounded-full transition-all duration-500", step >= 2 ? 'bg-primary' : 'bg-gray-100')}></div>
            </div>
            <span className="text-xs text-neutral-700 font-bold uppercase tracking-widest">Étape {step} / 2</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar">
            {step === 1 ? (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">
                      Informations Document
                    </h3>
                    
                    <div>
                      <Label>Type de document</Label>
                      <Select
                        value={formData.documentType || "Devis"}
                        onChange={(e) => setFormData({ ...formData, documentType: e.target.value as DocumentType })}
                        className="w-full"
                      >
                        <option value="Devis">Devis</option>
                        <option value="Facture">Facture</option>
                        <option value="Facture Proforma">Facture Proforma</option>
                      </Select>
                    </div>

                    <div>
                      <Label>{t("type")}</Label>
                      <Select
                        value={formData.relatedToType || "Client"}
                        onChange={(e) => setFormData({ ...formData, relatedToType: e.target.value as "Client" | "Lead", relatedToId: "" })}
                        className="w-full"
                      >
                        <option value="Client">{t("client")}</option>
                        <option value="Lead">{t("lead")}</option>
                      </Select>
                    </div>

                    <div>
                      <Label>{formData.relatedToType === "Client" ? t("client") : t("lead")}</Label>
                      <Select
                        required
                        value={formData.relatedToId || ""}
                        onChange={(e) => setFormData({ ...formData, relatedToId: e.target.value })}
                        className="w-full"
                      >
                        <option value="">{t("select")}</option>
                        {formData.relatedToType === "Client"
                          ? data.clients.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.companyName}
                              </option>
                            ))
                          : data.leads.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.companyName}
                              </option>
                            ))}
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">
                      Détails Événement
                    </h3>

                    <div>
                      <Label>{t("eventName")}</Label>
                      <Select
                        value={formData.eventName || ""}
                        onChange={(e) => {
                          const event = data.events.find(ev => ev.eventName === e.target.value);
                          if (event) {
                            setFormData({
                              ...formData,
                              eventName: event.eventName,
                              eventDate: event.date.split('T')[0],
                              attendees: event.attendees
                            });
                          } else {
                            setFormData({ ...formData, eventName: e.target.value });
                          }
                        }}
                        className="w-full"
                      >
                        <option value="">Sélectionner un événement</option>
                        {data.events.map(event => (
                          <option key={event.id} value={event.eventName}>{event.eventName}</option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label>{t("eventDate")}</Label>
                      <Input
                        type="date"
                        value={formData.eventDate || ""}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{t("attendees")}</Label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="0"
                          className="pl-11"
                          value={formData.attendees || ""}
                          onChange={(e) => setFormData({ ...formData, attendees: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">
                      Services & Prestations
                    </h3>

                    <div>
                      <Label className="mb-3">
                        {t("includedServices")}
                      </Label>
                      <div className="grid grid-cols-1 gap-2 bg-gray-50 p-4 rounded-xl">
                        {availableServices.map((service) => (
                          <label 
                            key={service} 
                            className={cn(
                              "flex items-center p-2 rounded-xl border transition-all cursor-pointer",
                              formData.servicesIncluded?.includes(service)
                                ? 'bg-white border-primary shadow-sm'
                                : 'bg-transparent border-transparent hover:bg-white/50'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={formData.servicesIncluded?.includes(service) || false}
                              onChange={() => handleServiceToggle(service)}
                              className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">{t(service)}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>
                          Services additionnels
                        </Label>
                        <button
                          type="button"
                          onClick={addCustomService}
                          className="text-xs font-bold text-primary hover:text-primary/80"
                        >
                          + Ajouter
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.customServices?.map((service, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              placeholder="Nom du service"
                              className="flex-1"
                              value={service.name}
                              onChange={(e) => updateCustomService(index, "name", e.target.value)}
                            />
                            <Input
                              type="number"
                              placeholder="Prix"
                              className="w-24"
                              value={service.price}
                              onChange={(e) => updateCustomService(index, "price", Number(e.target.value))}
                            />
                            <Input
                              type="number"
                              placeholder="Qté"
                              className="w-16"
                              value={service.quantity}
                              onChange={(e) => updateCustomService(index, "quantity", Number(e.target.value))}
                            />
                            <button
                              type="button"
                              onClick={() => removeCustomService(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">
                      Conditions Financières
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>
                          {t("proposedPrice")}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">DZD</span>
                          <Input
                            required
                            type="number"
                            disabled={!isManager}
                            className={cn("pl-12", !isManager && 'opacity-60 cursor-not-allowed')}
                            value={formData.price || ""}
                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    <div>
                      <Label>
                        {t("followUpDate")}
                      </Label>
                      <Input
                        required
                        type="date"
                        value={formData.followUpDate || ""}
                        onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      />
                    </div>
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                        {t("status")}
                      </Label>
                      <Select
                        required
                        value={formData.status || "En attente"}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full"
                      >
                        <option value="En attente">En attente</option>
                        <option value="Envoyé">Envoyé</option>
                        <option value="Accepté">Accepté</option>
                        <option value="Refusé">Refusé</option>
                        <option value="Payé">Payé</option>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>
                        {t("attachedDocument")}
                      </Label>
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                          <Paperclip className="w-4 h-4 text-primary" />
                          <span>{formData.attachmentName ? t("changeDocument") : t("attachDocument")}</span>
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                        />
                        {formData.attachmentName && (
                          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                            <span className="text-xs font-medium text-gray-600 truncate max-w-[150px]">
                              {formData.attachmentName}
                            </span>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, attachmentName: undefined, attachmentUrl: undefined })}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
            {step === 2 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
                className="px-6 py-2 text-gray-500 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t("back")}
              </Button>
            ) : (
              <div />
            )}
            
            <div className="flex space-x-3 ml-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="px-6 py-2 text-gray-500 hover:bg-gray-50"
              >
                {t("cancel")}
              </Button>
              
              {step === 1 ? (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="px-8 shadow-lg shadow-primary/20"
                >
                  {t("next")}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="px-8 shadow-lg shadow-primary/20"
                >
                  {initialData ? t("save") : t("createQuote")}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
