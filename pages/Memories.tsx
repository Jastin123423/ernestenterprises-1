import React, { useState } from 'react';
import { MemoryItem } from '../types';
import { Upload, FileText, Download, Trash2, Calendar, Maximize2, X, Image as ImageIcon } from 'lucide-react';

interface MemoriesProps {
  memories: MemoryItem[];
  onAdd: (m: MemoryItem) => void;
  onDelete: (id: string) => void;
}

export const Memories: React.FC<MemoriesProps> = ({ memories, onAdd, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState<MemoryItem | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileData, setFileData] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  // Handle File Upload & Conversion to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit Warning
        setError("Faili ni kubwa sana. Inaweza kujaza nafasi ya simu yako.");
      } else {
        setError('');
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      const newItem: MemoryItem = {
        id: Date.now().toString(),
        title,
        description,
        date: new Date(date).toISOString(),
        type: fileData ? 'image' : 'text',
        base64Data: fileData
      };
      
      onAdd(newItem);
      
      // Reset
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setFileData(undefined);
      setDate(new Date().toISOString().split('T')[0]);
      setError('');
    } catch (err) {
      setError("Imeshindikana kuhifadhi. Nafasi imejaa.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ernest-blue">Nyaraka na Kumbukumbu</h2>
          <p className="text-sm text-slate-500">Pakia risiti, picha, au hifadhi kumbukumbu za biashara hapa.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-ernest-gold hover:bg-ernest-lightGold text-ernest-blue font-bold py-2 px-4 rounded shadow transition-colors"
        >
          <Upload size={18} />
          <span>Ongeza Mpya</span>
        </button>
      </div>

      {/* Grid of Memories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {memories.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
            <div 
              className="h-40 bg-slate-100 flex items-center justify-center cursor-pointer relative overflow-hidden"
              onClick={() => setViewItem(item)}
            >
              {item.type === 'image' && item.base64Data ? (
                <img src={item.base64Data} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <FileText size={48} className="text-slate-300" />
              )}
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="text-white" size={24} />
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-ernest-blue truncate pr-2" title={item.title}>{item.title}</h3>
                 <button onClick={() => onDelete(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                   <Trash2 size={16} />
                 </button>
              </div>
              <div className="flex items-center text-xs text-slate-500 mb-2">
                <Calendar size={12} className="mr-1" />
                {new Date(item.date).toLocaleDateString('sw-TZ')}
              </div>
              <p className="text-sm text-slate-600 line-clamp-2 h-10">
                {item.description || "Hakuna maelezo."}
              </p>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {memories.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <ImageIcon size={32} className="opacity-50"/>
             </div>
             <p className="font-medium">Hakuna rekodi.</p>
             <p className="text-sm mt-1">Bonyeza "Ongeza Mpya" kuhifadhi risiti au picha.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-scale-in">
            <h3 className="text-xl font-bold text-ernest-blue mb-4">Pakia Nyaraka</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kichwa (Title)</label>
                <input required type="text" className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none" 
                  value={title} onChange={e => setTitle(e.target.value)} placeholder="mfano: Risiti ya Mzigo" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tarehe</label>
                <input required type="date" className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none" 
                  value={date} onChange={e => setDate(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Maelezo</label>
                <textarea className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none h-24 resize-none" 
                  value={description} onChange={e => setDescription(e.target.value)} placeholder="Andika maelezo hapa..." />
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Picha / Risiti</label>
                 <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="fileUpload" />
                    <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center justify-center text-slate-500">
                       {fileData ? (
                         <img src={fileData} alt="Preview" className="h-32 object-contain mb-2 shadow-sm rounded" />
                       ) : (
                         <Upload size={24} className="mb-2" />
                       )}
                       <span className="text-sm font-medium text-ernest-blue">Bonyeza kupakia picha</span>
                       <span className="text-xs text-slate-400 mt-1">Inashauriwa: Chini ya 2MB</span>
                    </label>
                 </div>
                 {error && <p className="text-xs text-red-500 mt-2 font-bold">{error}</p>}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Ghairi</button>
                <button type="submit" className="px-6 py-2 bg-ernest-blue text-white rounded hover:bg-slate-800">Hifadhi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewItem(null)}>
           <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in relative" onClick={e => e.stopPropagation()}>
              
              <button onClick={() => setViewItem(null)} className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors z-10">
                 <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row h-full max-h-[80vh]">
                 {/* Left/Top: Image */}
                 <div className="w-full md:w-1/2 bg-slate-900 flex items-center justify-center p-4">
                    {viewItem.type === 'image' && viewItem.base64Data ? (
                       <img src={viewItem.base64Data} alt={viewItem.title} className="max-w-full max-h-[40vh] md:max-h-full object-contain" />
                    ) : (
                      <div className="text-slate-500 text-center">
                         <FileText size={64} className="mx-auto mb-2 opacity-50"/>
                         <p>Hakuna Picha</p>
                      </div>
                    )}
                 </div>

                 {/* Right/Bottom: Content */}
                 <div className="w-full md:w-1/2 p-8 flex flex-col">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-ernest-gold uppercase tracking-wider mb-2">
                        {new Date(viewItem.date).toLocaleDateString('sw-TZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <h2 className="text-2xl font-bold text-ernest-blue mb-4">{viewItem.title}</h2>
                      <div className="prose prose-sm text-slate-600 overflow-y-auto max-h-40 mb-4">
                        <p className="whitespace-pre-wrap">{viewItem.description || "Hakuna maelezo."}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                       {viewItem.type === 'image' && viewItem.base64Data ? (
                         <a 
                           href={viewItem.base64Data} 
                           download={`${viewItem.title.replace(/\s+/g, '_')}_${viewItem.date}.png`}
                           className="flex items-center justify-center w-full space-x-2 bg-ernest-blue text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
                         >
                           <Download size={20} />
                           <span>Pakua (Download)</span>
                         </a>
                       ) : (
                         <button disabled className="w-full py-3 bg-slate-100 text-slate-400 font-bold rounded-lg cursor-not-allowed">
                           Haiwezi Kupakuliwa
                         </button>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};