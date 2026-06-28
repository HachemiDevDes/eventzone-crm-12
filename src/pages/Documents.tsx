import React, { useState, useRef } from "react";
import { useStore } from "../store/StoreContext";
import { DocumentItem } from "../types";
import { Search, FileText, Download, Trash2, Plus, Paperclip, FolderOpen, FileArchive } from "lucide-react";
import { cn } from "../lib/utils";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "../hooks/useTranslation";

export default function Documents() {
  const { data, addDocument, deleteDocument, uploadFile, currentUser, searchTarget, setSearchTarget, setCurrentPage } = useStore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"templates" | "others">("templates");

  const handleNavigateToRelated = (doc: DocumentItem) => {
    if (!doc.relatedToId || !doc.relatedToType) {
      if (doc.clientId) {
        setSearchTarget({ id: doc.clientId, type: 'Client' });
        setCurrentPage('Clients');
      }
      return;
    }

    setSearchTarget({ id: doc.relatedToId, type: doc.relatedToType });
    
    switch (doc.relatedToType) {
      case 'Lead':
        setCurrentPage('Leads');
        break;
      case 'Client':
        setCurrentPage('Clients');
        break;
      case 'Event':
        setCurrentPage('Events');
        break;
      case 'Offer':
        setCurrentPage('Leads'); // Offers are usually handled within Leads
        break;
      case 'Task':
        setCurrentPage('Tasks');
        break;
    }
  };

  // Handle search target
  React.useEffect(() => {
    if (searchTarget && searchTarget.type === 'Document') {
      const doc = data.documents.find(d => d.id === searchTarget.id);
      if (doc) {
        setSearchTerm(doc.name);
        setActiveTab(doc.clientId || doc.relatedToId ? "others" : "templates");
        setSearchTarget(null);
      }
    }
  }, [searchTarget, data.documents, setSearchTarget]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isManager = currentUser?.role === "Manager";

  const handleDownload = async (url: string, fileName: string) => {
    console.log('Attempting download:', { url, fileName });
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error, falling back to new tab:', error);
      window.open(url, '_blank');
    }
  };

  const filteredDocuments = (data.documents || []).filter(
    (doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === "templates" ? (!doc.clientId && !doc.relatedToId) : (!!doc.clientId || !!doc.relatedToId);
      return matchesSearch && matchesTab;
    }
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const publicUrl = await uploadFile(file);
      setIsUploading(false);

      if (publicUrl) {
        const newDoc: DocumentItem = {
          id: uuidv4(),
          name: file.name,
          url: publicUrl,
          type: file.type || "application/octet-stream",
          size: file.size,
          createdAt: new Date().toISOString()
        };
        addDocument(newDoc);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("documents")}</h1>
        {isManager && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full sm:w-auto bg-primary-gradient text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center justify-center space-x-1.5 md:space-x-2 hover:opacity-90 transition-all shadow-md shadow-primary/20 text-xs md:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span>{isUploading ? t("uploading") : t("addDocument")}</span>
          </button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <button
            className={cn("px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center", activeTab === "templates" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")}
            onClick={() => setActiveTab("templates")}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Modules & Templates
          </button>
          <button
            className={cn("px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center", activeTab === "others" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")}
            onClick={() => setActiveTab("others")}
          >
            <FileArchive className="w-4 h-4 mr-2" />
            Autres Documents
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchDocumentPlaceholder")}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("name")}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("relatedTo")}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("type")}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("size")}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("date")}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map((doc) => (
                    <tr 
                      key={doc.id} 
                      className="hover:bg-gray-50 transition-colors group cursor-pointer"
                      onClick={() => handleNavigateToRelated(doc)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={doc.name}>
                              {doc.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {doc.clientId || doc.relatedToId ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-primary hover:underline">
                              {doc.relatedToType === 'Lead' ? data.leads.find(l => l.id === doc.relatedToId)?.companyName :
                               doc.relatedToType === 'Client' || doc.clientId ? data.clients.find(c => c.id === (doc.relatedToId || doc.clientId))?.companyName :
                               doc.relatedToType === 'Event' ? data.events.find(e => e.id === doc.relatedToId)?.eventName :
                               doc.relatedToType === 'Offer' ? data.offers.find(o => o.id === doc.relatedToId)?.id :
                               doc.relatedToType === 'Task' ? data.tasks.find(t => t.id === doc.relatedToId)?.title :
                               "Document lié"}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                              {doc.relatedToType || (doc.clientId ? "Client" : "")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Template</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {doc.type.split('/').pop()?.toUpperCase() || doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : t("unknownSize")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDownload(doc.url, doc.name)}
                            className="text-primary hover:text-primary-dark transition-colors p-1 hover:bg-primary/10 rounded-full"
                            title={t("download")}
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          {isManager && (
                            <button
                              onClick={() => deleteDocument(doc.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-full"
                              title={t("delete")}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredDocuments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center">
                    <FolderOpen className="w-12 h-12 text-gray-300 mb-3" />
                    <p>{t("noDocumentsFound")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
