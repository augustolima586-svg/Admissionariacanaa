import React, { useState, useRef } from 'react';
import { Role, MediaItem } from '../types';
import { supabase } from '../services/supabase';
import { Image, FileText, Video, Trash2, Upload, Plus, Link as LinkIcon, X } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';

interface MidiaProps {
  userRole: Role;
  mediaItems: MediaItem[];
  onSaveMediaItem: (item: Omit<MediaItem, 'id'>) => Promise<any>;
  onDeleteMediaItem: (id: string, url?: string) => Promise<any>;
}

const Midia: React.FC<MidiaProps> = ({ userRole, mediaItems = [], onSaveMediaItem, onDeleteMediaItem }: MidiaProps) => {
  const isManager = userRole === 'Admin' || userRole === 'Secretaria';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'Tudo' | 'Galeria' | 'Estudos' | 'Vídeos'>('Tudo');

  // Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const filteredItems = (mediaItems || []).filter((item: MediaItem) => {
    if (activeCategory === 'Tudo') return true;
    if (activeCategory === 'Galeria') return item.type === 'image';
    if (activeCategory === 'Estudos') return item.type === 'document';
    if (activeCategory === 'Vídeos') return item.type === 'video' || item.type === 'link';
    return true;
  });

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isManager) return;

    try {
      setIsUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('church-media')
        .upload(filePath, file);

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from('church-media')
        .getPublicUrl(filePath);

      const type: MediaItem['type'] = file.type.startsWith('image/') ? 'image' :
        file.type.startsWith('video/') ? 'video' : 'document';

      const category = type === 'image' ? 'Galeria' :
        type === 'video' ? 'Vídeos' : 'Estudos';

      const { error: dbError } = await onSaveMediaItem({
        title: file.name,
        type,
        url: publicUrl,
        category,
        description: `Arquivo enviado por ${userRole}`,
        metadata: { size: (file.size / 1024 / 1024).toFixed(2) + ' MB', contentType: file.type }
      });

      if (dbError) {
        throw new Error('Erro ao salvar no banco: ' + (dbError.message || JSON.stringify(dbError)));
      }

      alert('Arquivo enviado com sucesso!');
    } catch (error: any) {
      console.error('Erro no upload:', error);
      alert('Erro ao enviar arquivo: ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveLink = async () => {
    if (!newLinkTitle || !newLinkUrl) {
      alert('Preencha o título e a URL');
      return;
    }

    const { error } = await onSaveMediaItem({
      title: newLinkTitle,
      type: 'link',
      url: newLinkUrl,
      category: 'Vídeos',
      description: 'Link externo de vídeo',
      metadata: { provider: 'external' }
    });

    if (error) {
      alert('Erro ao salvar link: ' + error.message);
    } else {
      alert('Link adicionado com sucesso!');
      setShowLinkModal(false);
      setNewLinkTitle('');
      setNewLinkUrl('');
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!isManager) return;
    if (window.confirm(`Excluir permanentemente "${item.title}"?`)) {
      await onDeleteMediaItem(item.id, item.url);
    }
  };

  const formatSize = (metadata: any) => {
    return metadata?.size ? ` • ${metadata.size}` : '';
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-heading font-black text-slate-900 tracking-tight italic">Mídia & Galeria Visual</h2>
          <p className="text-slate-500 font-medium">Conteúdo dinâmico da Admissionária Canaã disponível para todos.</p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleUploadFile}
        />

        {isManager && (
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-slate-900 text-white px-6 h-touch"
            >
              <svg className={`w-4 h-4 mr-2 ${isUploading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth={2.5} />
              </svg>
              {isUploading ? 'Subindo...' : 'Subir Arquivo'}
            </Button>
            <Button
              onClick={() => setShowLinkModal(true)}
              className="bg-purple-600 text-white hover:bg-purple-700 shadow-purple-600/20 h-touch"
            >
              <LinkIcon size={18} className="mr-2" />
              Novo Link
            </Button>
          </div>
        )}
      </header>

      {/* Modal de Novo Link */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleUp">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.08]">
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" /></svg>
              </div>
              <div className="relative z-10">
                <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Banco de Mídia</h3>
                <p className="text-xl font-heading font-black italic tracking-tighter leading-none text-white">Vincular Conteúdo</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2">Integração de Vídeo Externo</p>
              </div>
              <button onClick={() => setShowLinkModal(false)} className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Conteúdo</label>
                <Input
                  type="text"
                  value={newLinkTitle}
                  onChange={e => setNewLinkTitle(e.target.value)}
                  placeholder="Ex: Culto de Domingo"
                  className="h-14 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600/20 outline-none transition-all placeholder:text-slate-300"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço (URL) do Vídeo</label>
                <Input
                  type="url"
                  value={newLinkUrl}
                  onChange={e => setNewLinkUrl(e.target.value)}
                  className="h-14 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600/20 outline-none transition-all placeholder:text-slate-300"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 h-14 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveLink}
                  className="group relative flex-1 h-14 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth={3.5} /></svg>
                    Salvar Link
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros de Categoria */}
      <div className="flex flex-wrap gap-2">
        {['Tudo', 'Galeria', 'Estudos', 'Vídeos'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as any)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all h-10 flex items-center ${activeCategory === cat
              ? 'bg-red-600 text-white shadow-lg shadow-red-100'
              : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="p-0 !rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all h-[340px] flex flex-col group border-slate-100">
            {/* Top Area (Visual) */}
            <div className="flex-1 relative overflow-hidden bg-slate-50 flex items-center justify-center">
              {item.type === 'image' ? (
                <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-duration-700 transition-transform" />
              ) : item.type === 'video' || item.type === 'link' ? (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white/20 group-hover:text-red-500 transition-colors">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                  <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeWidth={1.5} /></svg>
                  <p className="text-[10px] font-black uppercase tracking-widest">{item.title.split('.').pop()}</p>
                </div>
              )}

              {/* Badges / Actions Box */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 gap-3">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-white/20 backdrop-blur-md text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-white hover:text-red-600 transition-all border border-white/10"
                >
                  Ver / Abrir
                </a>
                {isManager && (
                  <button
                    onClick={() => handleDelete(item)}
                    className="bg-red-600/80 backdrop-blur-md text-white p-2 rounded-xl hover:bg-red-600 transition-all border border-red-500/50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Area (Info) */}
            <div className="p-6 bg-white shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-[0.2em] ${item.type === 'document' ? 'bg-indigo-50 text-indigo-600' :
                  item.type === 'image' ? 'bg-red-50 text-red-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                  {item.type}
                </span>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest italic">{item.category}</p>
              </div>
              <h3 className="font-heading font-black text-slate-800 text-xs uppercase tracking-tight line-clamp-1 italic">{item.title}</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">
                {new Date(item.created_at || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                {formatSize(item.metadata)}
              </p>
            </div>
          </Card>
        ))}

        {filteredItems.length === 0 && (
          <Card className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-slate-100 border-dashed flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-300 border border-slate-100">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={1.5} /></svg>
            </div>
            <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Nenhum item encontrado</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Midia;
