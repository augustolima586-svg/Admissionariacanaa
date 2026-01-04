// @ts-nocheck
import React, { useState } from 'react';
import { Input } from './Input';

interface ConsolidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (consolidatorName: string) => Promise<void>;
    memberName: string;
}

export const ConsolidationModal: React.FC<ConsolidationModalProps> = ({ isOpen, onClose, onSave, memberName }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [consolidatorName, setConsolidatorName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(consolidatorName);
            setConsolidatorName('');
        } catch (error) {
            console.error("Failed to save consolidation", error);
        } finally {
            setIsSaving(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div
                className="bg-white w-full max-w-[400px] rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden animate-scaleUp"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-amber-200">Acompanhamento</h3>
                        <p className="text-xl font-heading font-black italic tracking-tighter leading-none text-white">Consolidar Membro</p>
                    </div>
                    <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-all text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <p className="text-sm font-bold text-slate-600 mb-4">
                            Quem ficará responsável por acompanhar <span className="text-amber-600 font-black">{memberName}</span>?
                        </p>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block text-slate-400">NOME DO CONSOLIDADOR</label>
                        <Input
                            type="text"
                            required
                            autoFocus
                            value={consolidatorName}
                            onChange={e => setConsolidatorName(e.target.value)}
                            placeholder="Ex: Obreiro Fulano"
                            className="h-14 px-6 bg-slate-100 border-slate-200 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-amber-600/5 focus:border-amber-600/20 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSaving || !consolidatorName.trim()}
                            className="group relative w-full h-14 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden disabled:opacity-70 disabled:hover:scale-100"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isSaving ? 'Salvando...' : 'Confirmar Acompanhamento'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
