import React, { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';

interface VisitorRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { date: string; description: string; visitors: string[] }) => Promise<void>;
}

export const VisitorRegistrationModal: React.FC<VisitorRegistrationModalProps> = ({ isOpen, onClose, onSave }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        visitors: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const visitorsArray = formData.visitors.split(',').map(v => v.trim()).filter(v => v !== '');
            // Create a delay to simulate smooth interaction if needed, but primarily call save
            await onSave({
                date: formData.date,
                description: formData.description,
                visitors: visitorsArray
            });
            // Reset form handled by parent closing/unmounting or manual reset? 
            // Better to reset on successful close effectively. 
            // But since we unmount or hide, state might persist if just hidden.
            // Actually if isOpen is false, we return null, resetting state? No, React state persists if component stays mounted.
            // But typically conditionals in parent unmount it. Let's assume parent uses {isOpen && <Modal ...>} logic or we reset here.
            setFormData({ date: new Date().toISOString().split('T')[0], description: '', visitors: '' });
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setIsSaving(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div
                className="bg-white w-full max-w-[480px] rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden animate-scaleUp"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 p-10 text-white flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.08]">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    </div>
                    <div className="relative z-10">
                        <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Recepção</h3>
                        <p className="text-2xl font-heading font-black italic tracking-tighter leading-none text-white">Novo Visitante</p>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-3">Boas-vindas à Casa do Pai</p>
                    </div>
                    <button onClick={onClose} className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block text-slate-400">DATA DO CULTO/EVENTO</label>
                        <Input
                            type="date"
                            required
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            className="h-14 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-amber-600/5 focus:border-amber-600/20 outline-none transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block text-slate-400">DESCRIÇÃO DO CULTO</label>
                        <Input
                            type="text"
                            required
                            placeholder="Ex: Culto de Celebração"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="h-14 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-amber-600/5 focus:border-amber-600/20 outline-none transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block flex justify-between items-center text-slate-400">
                            <span>LISTA DE VISITANTES</span>
                            <span className="text-[8px] opacity-60 lowercase font-bold tracking-normal italic text-amber-500">separados por vírgula</span>
                        </label>
                        <textarea
                            placeholder="Ex: Maria Souza, Pedro Santos..."
                            className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-amber-600/5 focus:border-amber-600/20 outline-none transition-all placeholder:text-slate-300 resize-none"
                            value={formData.visitors}
                            onChange={e => setFormData({ ...formData, visitors: e.target.value })}
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="group relative w-full h-18 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-red-100 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {isSaving ? 'Gravando Dados...' : (
                                    <>
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={3.5} /></svg>
                                        Salvar Registro
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
