import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Bell, 
  Globe, 
  Check, 
  LogOut, 
  Menu, 
  ChevronLeft,
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  MoreVertical,
  Trophy,
  PhoneCall,
  MessageSquare,
  Target,
  FileText
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { Page } from '../App';
import { useTranslation } from '../hooks/useTranslation';
import { cn } from '../lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher';

export default function Header({ 
  setCurrentPage, 
  toggleMobileMenu 
}: { 
  setCurrentPage: (page: Page) => void,
  toggleMobileMenu: () => void
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { data, markNotificationAsRead, markAllAsRead, clearNotifications, logout, currentUser, searchTarget, setSearchTarget } = useStore();
  const { t, lang } = useTranslation();
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const unreadCount = (data.notifications || []).filter(n => !n.read).length;
  const isManager = currentUser?.role === "Manager";

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(e.target.value.trim().length > 0);
  };

  const q = query.toLowerCase().trim();

  const matchedLeads = (data.leads || []).filter(l => 
    (l.companyName || '').toLowerCase().includes(q) || 
    (l.contactName || '').toLowerCase().includes(q) ||
    (l.email || '').toLowerCase().includes(q) ||
    (l.phone || '').toLowerCase().includes(q)
  );

  const matchedClients = (data.clients || []).filter(c => 
    (c.companyName || '').toLowerCase().includes(q) || 
    (c.contactPerson || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q) ||
    (c.phone || '').toLowerCase().includes(q)
  );

  const matchedEvents = (data.events || []).filter(e => 
    (e.eventName || '').toLowerCase().includes(q) ||
    (e.wilaya || '').toLowerCase().includes(q)
  );

  const matchedTasks = (data.tasks || []).filter(t => 
    (t.title || '').toLowerCase().includes(q) ||
    (t.description || '').toLowerCase().includes(q)
  );

  const matchedOffers = (data.offers || []).filter(o => 
    (o.eventName || '').toLowerCase().includes(q) ||
    (o.status || '').toLowerCase().includes(q)
  );

  const matchedDocuments = (data.documents || []).filter(d => 
    (d.name || '').toLowerCase().includes(q) ||
    (d.type || '').toLowerCase().includes(q)
  );

  const matchedTeam = data.team ? data.team.filter(t => 
    (t.name || '').toLowerCase().includes(q) ||
    (t.role || '').toLowerCase().includes(q) ||
    (t.email || '').toLowerCase().includes(q)
  ) : [];

  const totalResults = matchedLeads.length + matchedClients.length + matchedEvents.length + matchedTasks.length + matchedOffers.length + matchedDocuments.length + matchedTeam.length;

  const isSalesAgent = currentUser?.role === "Sales Agent";

  const getNotificationIcon = (notif: any) => {
    const title = notif.title.toLowerCase();
    if (title.includes('tâche') || title.includes('task')) return <Target className="w-5 h-5 text-purple-500" />;
    if (title.includes('lead')) return <PhoneCall className="w-5 h-5 text-primary" />;
    if (title.includes('devis') || title.includes('quote')) return <FileText className="w-5 h-5 text-amber-500" />;
    
    switch (notif.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-30 h-16">
      <div className="flex items-center space-x-4">
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="hidden lg:flex items-center space-x-8 flex-1 justify-start px-4">
        <div className="relative w-full max-w-md" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white transition-all text-sm"
              value={query}
              onChange={handleSearch}
              onFocus={() => query.trim().length > 0 && setIsOpen(true)}
            />
            {query && (
              <button 
                onClick={() => { setQuery(''); setIsOpen(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {isOpen && query.trim().length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[70vh] flex flex-col">
              <div className="p-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Search Results</span>
                <span className="text-xs font-medium text-gray-400">{totalResults} found</span>
              </div>
              
              <div className="overflow-y-auto p-2 space-y-4">
                {totalResults === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {t('noResults')} "{query}"
                  </div>
                ) : (
                  <>
                    {matchedLeads.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 rounded-lg mb-1">{t('leads')}</div>
                        {matchedLeads.map(lead => (
                          <button key={lead.id} onClick={() => { setSearchTarget({ id: lead.id, type: 'Lead' }); setCurrentPage('Leads'); setIsOpen(false); setQuery(''); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between group transition-colors rounded-full">
                            <div className="flex flex-col"><span className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">{lead.companyName}</span><span className="text-xs text-gray-500">{lead.contactName} • {lead.wilaya}</span></div>
                            <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-primary rotate-180 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
                    {matchedClients.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 rounded-full mb-1">{t('clients')}</div>
                        {matchedClients.map(client => (
                          <button key={client.id} onClick={() => { setSearchTarget({ id: client.id, type: 'Client' }); setCurrentPage('Clients'); setIsOpen(false); setQuery(''); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between group transition-colors rounded-full">
                            <div className="flex flex-col"><span className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">{client.companyName}</span><span className="text-xs text-gray-500">{client.contactPerson} • {client.wilaya}</span></div>
                            <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-primary rotate-180 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
                    {matchedEvents.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 rounded-full mb-1">{t('events')}</div>
                        {matchedEvents.map(event => (
                          <button key={event.id} onClick={() => { setSearchTarget({ id: event.id, type: 'Event' }); setCurrentPage('Events'); setIsOpen(false); setQuery(''); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between group transition-colors rounded-full">
                            <div className="flex flex-col"><span className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">{event.eventName}</span><span className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')} • {event.wilaya}</span></div>
                            <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-primary rotate-180 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
                    {matchedTasks.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 rounded-full mb-1">{t('tasks')}</div>
                        {matchedTasks.map(task => (
                          <button key={task.id} onClick={() => { setSearchTarget({ id: task.id, type: 'Task' }); setCurrentPage('Tasks'); setIsOpen(false); setQuery(''); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between group transition-colors rounded-full">
                            <div className="flex flex-col"><span className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">{task.title}</span><span className="text-xs text-gray-500 line-clamp-1">{task.description}</span></div>
                            <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-primary rotate-180 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
                    {matchedOffers.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 rounded-full mb-1">{t('offers')}</div>
                        {matchedOffers.map(offer => (
                          <button key={offer.id} onClick={() => { setCurrentPage('FinancialDocuments'); setIsOpen(false); setQuery(''); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between group transition-colors rounded-full">
                            <div className="flex flex-col"><span className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">{offer.eventName}</span><span className="text-xs text-gray-500">{offer.status} • {offer.price} DZD</span></div>
                            <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-primary rotate-180 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
                    {matchedDocuments.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 rounded-full mb-1">{t('documents')}</div>
                        {matchedDocuments.map(doc => (
                          <button key={doc.id} onClick={() => { setCurrentPage('Documents'); setIsOpen(false); setQuery(''); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between group transition-colors rounded-full">
                            <div className="flex flex-col"><span className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">{doc.name}</span><span className="text-xs text-gray-500">{doc.type}</span></div>
                            <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-primary rotate-180 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
                    {matchedTeam.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 rounded-full mb-1">{t('team')}</div>
                        {matchedTeam.map(member => (
                          <button key={member.id} onClick={() => { setCurrentPage('Team'); setIsOpen(false); setQuery(''); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between group transition-colors rounded-full">
                            <div className="flex flex-col"><span className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">{member.name}</span><span className="text-xs text-gray-500">{member.role}</span></div>
                            <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-primary rotate-180 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {isSalesAgent && (
          <div className="hidden xl:flex items-center space-x-6 mr-4">
            <div className="flex items-center space-x-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-sm">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black text-amber-600 tracking-tight">{currentUser.totalPointsBalance || 0} pts</span>
            </div>
          </div>
        )}

        <LanguageSwitcher />

        <div className="flex items-center space-x-2">
          {isManager && (
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-900">{t('notifications')}</h3>
                      {unreadCount > 0 && (
                        <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => markAllAsRead()}
                          className="text-xs font-medium text-gray-500 hover:text-primary transition-colors"
                        >
                          {t('markAllRead')}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-[450px] overflow-y-auto scrollbar-hide">
                    {(data.notifications || []).length > 0 ? (
                      (data.notifications || []).map((notif) => (
                        <div 
                          key={notif.id} 
                          className={cn(
                            "p-4 border-b border-gray-50 flex items-start space-x-4 transition-all hover:bg-gray-50 group relative",
                            !notif.read ? "bg-primary/5" : "opacity-75"
                          )}
                        >
                          <div className="mt-1 flex-shrink-0">
                            {getNotificationIcon(notif)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className={cn(
                                "text-sm leading-tight",
                                !notif.read ? "font-bold text-gray-900" : "font-medium text-gray-600"
                              )}>
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5 ml-2" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                              {notif.message}
                            </p>
                            <div className="flex items-center mt-2 space-x-2">
                              <span className="text-[10px] font-medium text-gray-400">
                                {new Date(notif.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                          
                          {!notif.read && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(notif.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white shadow-sm border border-gray-100 rounded-full text-primary hover:bg-primary hover:text-white transition-all duration-200"
                              title={t('markAsRead')}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                          <Bell className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">{t('noNotifications')}</p>
                      </div>
                    )}
                  </div>
                  {(data.notifications || []).length > 0 && (
                    <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-center">
                      <button 
                        onClick={() => clearNotifications()}
                        className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors"
                      >
                        {t('clearHistory')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title={t('logout')}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
