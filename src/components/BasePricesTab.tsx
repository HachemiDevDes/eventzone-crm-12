import React, { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { BasePrice } from '../types';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { CATEGORIES } from '../pages/Suppliers';

export default function BasePricesTab() {
  const { data, addBasePrice, updateBasePrice, deleteBasePrice } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<BasePrice | null>(null);
  const [formData, setFormData] = useState<Partial<BasePrice>>({});

  const filteredPrices = useMemo(() => {
    return data.basePrices.filter(bp => {
      const matchSearch = bp.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === "All" || bp.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [data.basePrices, searchTerm, categoryFilter]);

  const getSupplierName = (id: string) => {
    const supplier = data.suppliers.find(s => s.id === id);
    return supplier ? supplier.companyName : 'Inconnu';
  };

  const handleOpenModal = (price?: BasePrice) => {
    if (price) {
      setEditingPrice(price);
      setFormData(price);
    } else {
      setEditingPrice(null);
      setFormData({
        name: '',
        category: '',
        price: 0,
        supplierId: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.category || !formData.supplierId) return;

    if (editingPrice) {
      updateBasePrice(editingPrice.id, formData);
    } else {
      addBasePrice({
        id: uuidv4(),
        name: formData.name,
        category: formData.category,
        price: Number(formData.price || 0),
        supplierId: formData.supplierId,
        notes: formData.notes,
        createdAt: new Date().toISOString()
      } as BasePrice);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">Prix de Base (Catalogue)</h2>
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto bg-primary-gradient text-white px-4 py-2 rounded-full flex items-center justify-center space-x-2 hover:opacity-90 shadow-md transition-all text-sm font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau Prix</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un article..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-auto">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            className="w-full sm:w-auto pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-white"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">Toutes les catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600 text-sm">Article</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Catégorie</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Fournisseur</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Prix (DZD)</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPrices.length > 0 ? (
                filteredPrices.map((bp) => (
                  <tr key={bp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{bp.name}</div>
                      {bp.notes && <div className="text-xs text-gray-500 mt-1">{bp.notes}</div>}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        {bp.category}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-primary">
                      {getSupplierName(bp.supplierId)}
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(bp.price)}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleOpenModal(bp)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors mr-2">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if(window.confirm('Voulez-vous supprimer ce prix ?')) deleteBasePrice(bp.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Aucun prix de base trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPrice ? 'Modifier le prix de base' : 'Nouveau prix de base'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:bg-white hover:text-gray-600 rounded-full transition-colors shadow-sm"
              >
                <Trash2 className="w-5 h-5 hidden" />  
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Nom de l'article <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  placeholder="Ex: Stylo publicitaire, Bloc-note A5..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">Catégorie <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.category || ''} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    placeholder="Ex: Goodies, Équipement..."
                    list="categories-list"
                  />
                  <datalist id="categories-list">
                    {CATEGORIES.map(c => <option key={c.name} value={c.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">Prix de base (DZD) <span className="text-red-500">*</span></label>
                  <input 
                    type="number"
                    min="0"
                    value={formData.price || ''} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Fournisseur <span className="text-red-500">*</span></label>
                <select 
                  value={formData.supplierId || ''} 
                  onChange={e => setFormData({...formData, supplierId: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none bg-white"
                >
                  <option value="">Sélectionner un fournisseur</option>
                  {data.suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Notes (Optionnel)</label>
                <textarea 
                  value={formData.notes || ''} 
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                  rows={3}
                  placeholder="Détails, MOQ, délais..."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-full font-medium hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                disabled={!formData.name || !formData.category || !formData.supplierId}
                className="px-5 py-2.5 bg-primary-gradient text-white rounded-full font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {editingPrice ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
