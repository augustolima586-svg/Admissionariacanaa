// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { AttendanceRecord, Member, MemberStatus } from '../types';
import { VisitorRegistrationModal } from './VisitorRegistrationModal';
import { validateName, formatName } from '../utils/validation';
import { ConsolidationModal } from './ConsolidationModal';
// @ts-nocheck

interface RecepcaoProps {
    members: Member[];
    attendanceRecords: AttendanceRecord[];
    setAttendanceRecords: (record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
    onSaveMember: (member: Omit<Member, 'id' | 'contributions'>) => Promise<any>;
    onUpdateMember: (id: string, m: Partial<Member>) => Promise<any>;
}

const Recepcao: React.FC<RecepcaoProps> = ({
    members,
    attendanceRecords,
    setAttendanceRecords,
    onSaveMember,
    onUpdateMember
}) => {
    const [activeTab, setActiveTab] = useState<'visualizar' | 'visitantes' | 'decisoes'>('visitantes');
    const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
    const [nameError, setNameError] = useState<string>('');
    const [isConsolidationModalOpen, setIsConsolidationModalOpen] = useState(false);
    const [selectedMemberForConsolidation, setSelectedMemberForConsolidation] = useState<{ id: string, name: string } | null>(null);

    // Estados para o formulário de Novos Convertidos (Decisões)
    const [convertForm, setConvertForm] = useState({
        name: '',
        phone: '',
        date: new Date().toISOString().split('T')[0],
        culto: 'Culto de Domingo'
    });
    const [isSavingConvert, setIsSavingConvert] = useState(false);

    // Dados para estatísticas de Visitantes (do Dashboard)
    const recentVisitorsList = useMemo(() => {
        return (attendanceRecords || []).slice(0, 10);
    }, [attendanceRecords]);

    const totalVisitors = useMemo(() => {
        return attendanceRecords.reduce((acc, curr) => acc + (curr.visitors?.length || 0), 0);
    }, [attendanceRecords]);

    // Dados para estatísticas de Decisões
    const newConverts = useMemo(() => {
        return members.filter(m => m.status === 'Novo Convertido');
    }, [members]);

    const consolidatedConverts = useMemo(() => {
        return members.filter(m => m.status === 'Consolidado');
    }, [members]);

    const handleMarkAsConsolidated = (member: Member) => {
        setSelectedMemberForConsolidation({ id: member.id, name: member.name });
        setIsConsolidationModalOpen(true);
    };

    const handleSaveConsolidation = async (consolidatorName: string) => {
        if (!selectedMemberForConsolidation) return;

        await onUpdateMember(selectedMemberForConsolidation.id, {
            status: 'Consolidado',
            consolidatorName: consolidatorName
        });
        // Error handling is managed by onUpdateMember/App.tsx mostly, but we could add alert here if needed
        // Assuming optimistic update makes it feel instant.
    };

    const handleSaveVisitorAttendance = async (data: { date: string; description: string; visitors: string[] }) => {
        await setAttendanceRecords(data);
        setIsVisitorModalOpen(false);
    };

    const handleSaveConvert = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validate name field
        if (!validateName(convertForm.name)) {
            setNameError('Nome deve ter ao menos 3 caracteres');
            return;
        }
        setNameError('');
        setIsSavingConvert(true);
        try {
            const formattedName = formatName(convertForm.name);
            await onSaveMember({
                name: formattedName,
                phone: convertForm.phone,
                email: '', // Opcional
                status: 'Novo Convertido',
                category: 'Membro', // Categoria base
                congregacao: 'Sede',
                ageGroup: 'Adulto', // Default, pode ser ajustado depois
                joinDate: convertForm.date,
                decisionCulto: convertForm.culto,
                // @ts-ignore - Armazenando info extra temporariamente ou apenas seguindo o fluxo de criação
            });
            alert('Decisão registrada com sucesso! Glória a Deus!');
            setConvertForm({
                name: '',
                phone: '',
                date: new Date().toISOString().split('T')[0],
                culto: 'Culto de Domingo'
            });
        } catch (error: any) {
            alert('Erro ao registrar decisão: ' + error.message);
        } finally {
            setIsSavingConvert(false);
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-heading font-black text-slate-900 tracking-tight italic leading-tight">Recepção & Portaria</h2>
                    <p className="text-slate-500 font-medium">Gestão de visitantes e acompanhamento de novas decisões.</p>
                </div>
            </header>

            {/* Menu de Abas */}
            <div className="flex p-1 bg-slate-100 rounded-2xl w-full md:w-fit">
                <button
                    onClick={() => setActiveTab('visitantes')}
                    className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'visitantes' ? 'bg-white text-red-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Gestão de Visitantes
                </button>
                <button
                    onClick={() => setActiveTab('decisoes')}
                    className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'decisoes' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Novas Decisões
                </button>
            </div>

            {activeTab === 'visitantes' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
                    <Card className="lg:col-span-2 p-8 space-y-8">
                        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                            <div>
                                <h3 className="font-heading font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Visitantes Registrados</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ano Corrente</p>
                            </div>
                            <p className="text-4xl font-black text-slate-800 italic tracking-tighter">{totalVisitors}</p>
                        </div>

                        <div className="flex items-center justify-between">
                            <h3 className="font-heading font-black text-slate-800 uppercase tracking-widest text-[10px] flex items-center">
                                <div className="w-2 h-6 bg-amber-600 rounded-full mr-4"></div>
                                Últimas Visitas
                            </h3>
                            <button
                                onClick={() => setIsVisitorModalOpen(true)}
                                className="group relative h-12 px-6 bg-gradient-to-r from-red-600 to-red-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-red-200 hover:shadow-red-600/40 transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                <span className="relative z-10 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-amber-400 group-hover:scale-125 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                    Registrar Visitas
                                </span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {recentVisitorsList.length === 0 && (
                                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Nenhum registro encontrado</p>
                                </div>
                            )}
                            {recentVisitorsList.map((record) => (
                                <div key={record.id} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                            {new Date(record.date).toLocaleDateString('pt-BR')} • {record.description}
                                        </span>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {record.visitors?.map((visitor, idx) => (
                                                <span key={idx} className="bg-slate-50 text-slate-800 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border border-slate-100">
                                                    {visitor}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide">
                                            {record.visitors?.length} Pessoas
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
                        <div className="opacity-50 mb-6">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <h3 className="text-2xl font-heading font-black italic tracking-tighter mb-2">Palavra de Acolhimento</h3>
                        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                            "Não vos esqueçais da hospitalidade, porque por ela alguns, não o sabendo, hospedaram anjos."
                            <span className="block mt-2 font-bold text-slate-400 text-xs uppercase tracking-widest">— Hebreus 13:2</span>
                        </p>
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                            <p className="text-[10px] uppercase tracking-widest font-black text-slate-300 mb-1">Dica da Recepção</p>
                            <p className="text-xs font-medium">Lembre-se de anotar o contato de WhatsApp de cada visitante para o pós-culto.</p>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'decisoes' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
                    <Card className="lg:col-span-1 p-8 h-fit space-y-6">
                        <h3 className="font-heading font-black text-slate-800 uppercase tracking-widest text-[10px] flex items-center mb-6">
                            <div className="w-2 h-6 bg-amber-500 rounded-full mr-4"></div>
                            Nova Decisão
                        </h3>
                        <form onSubmit={handleSaveConvert} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NOME COMPLETO</label>
                                <Input
                                    required
                                    placeholder="Ex: João Silva"
                                    value={convertForm.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConvertForm({ ...convertForm, name: e.target.value })}
                                    className="bg-slate-100 border-slate-200"
                                />
                                {nameError && <p className="text-red-600 text-xs mt-1">{nameError}</p>}
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                                <Input
                                    required
                                    placeholder="(00) 00000-0000"
                                    value={convertForm.phone}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConvertForm({ ...convertForm, phone: e.target.value })}
                                    className="bg-slate-100 border-slate-200"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DATA DA DECISÃO</label>
                                    <Input
                                        type="date"
                                        required
                                        value={convertForm.date}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConvertForm({ ...convertForm, date: e.target.value })}
                                        className="bg-slate-100 border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Culto</label>
                                    <select
                                        className="w-full px-4 h-11 bg-slate-100 border border-slate-200 rounded-xl font-black text-slate-800 text-xs uppercase tracking-widest outline-none focus:border-amber-500 transition-all"
                                        value={convertForm.culto}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setConvertForm({ ...convertForm, culto: e.target.value })}
                                    >
                                        <option>Culto de Domingo</option>
                                        <option>Culto de Ensino</option>
                                        <option>Incendiar</option>
                                        <option>Círculo de Oração</option>
                                        <option>Outro</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSavingConvert}
                                className="group relative w-full h-14 bg-gradient-to-r from-red-600 to-red-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-red-200/50 hover:shadow-red-600/40 transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {isSavingConvert ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Salvando...
                                        </span>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                            Registrar Decisão
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>
                    </Card>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Decisões</p>
                                    <p className="text-3xl font-black text-slate-900 mt-1">{newConverts.length + consolidatedConverts.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                </div>
                            </div>
                            {/* Placeholder para métrica futura */}
                            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consolidados</p>
                                    <p className="text-3xl font-black text-emerald-600 mt-1">{consolidatedConverts.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                            </div>
                        </div>

                        <Card className="p-8">
                            <h3 className="font-heading font-black text-slate-800 uppercase tracking-widest text-[10px] flex items-center mb-6">
                                <div className="w-2 h-6 bg-amber-600 rounded-full mr-4"></div>
                                Acompanhamento de Decisões
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100 bg-slate-50/50">
                                            <th className="px-6 py-4 rounded-tl-xl">Nome</th>
                                            <th className="px-6 py-4">Data/Culto</th>
                                            <th className="px-6 py-4">Status / Consolidador</th>
                                            <th className="px-6 py-4 rounded-tr-xl text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {newConverts.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-8 text-center text-slate-300 text-xs font-bold uppercase tracking-widest">
                                                    Nenhuma decisão registrada ainda.
                                                </td>
                                            </tr>
                                        )}
                                        {[...newConverts, ...consolidatedConverts].sort((a, b) => {
                                            const dateA = a.joinDate ? new Date(a.joinDate).getTime() : 0;
                                            const dateB = b.joinDate ? new Date(b.joinDate).getTime() : 0;
                                            return dateB - dateA;
                                        }).map((member) => (
                                            <tr key={member.id} className="group hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-700">{formatName(member.name)}</p>
                                                    <p className="text-[10px] text-slate-400">{member.phone}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-medium text-slate-600">{new Date(member.joinDate).toLocaleDateString('pt-BR')}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase">{member.decisionCulto}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`px-3 py-1 w-fit rounded-full text-[9px] font-black uppercase tracking-widest border ${member.status === 'Consolidado'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            : 'bg-amber-50 text-amber-600 border-amber-100'
                                                            }`}>
                                                            {member.status}
                                                        </span>
                                                        {member.consolidatorName && (
                                                            <p className="text-[9px] text-slate-500 font-bold uppercase">Resp: {member.consolidatorName}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {member.status === 'Novo Convertido' && (
                                                        <button
                                                            onClick={() => handleMarkAsConsolidated(member)}
                                                            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-colors active:scale-95"
                                                        >
                                                            Acompanhar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            <VisitorRegistrationModal
                isOpen={isVisitorModalOpen}
                onClose={() => setIsVisitorModalOpen(false)}
                onSave={handleSaveVisitorAttendance}
            />

            <ConsolidationModal
                isOpen={isConsolidationModalOpen}
                onClose={() => setIsConsolidationModalOpen(false)}
                onSave={handleSaveConsolidation}
                memberName={selectedMemberForConsolidation?.name || ''}
            />
        </div>
    );
};

export default Recepcao;
