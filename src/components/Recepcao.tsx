// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { AttendanceRecord, Member, MemberStatus } from '../types';
import { VisitorRegistrationModal } from './VisitorRegistrationModal';
import { validateName, formatName } from '../utils/validation';
// @ts-nocheck

interface RecepcaoProps {
    members: Member[];
    attendanceRecords: AttendanceRecord[];
    setAttendanceRecords: (record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
    onSaveMember: (member: Omit<Member, 'id' | 'contributions'>) => Promise<any>;
}

const Recepcao: React.FC<RecepcaoProps> = ({
    members,
    attendanceRecords,
    setAttendanceRecords,
    onSaveMember
}) => {
    const [activeTab, setActiveTab] = useState<'visualizar' | 'visitantes' | 'decisoes'>('visitantes');
    const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
    const [nameError, setNameError] = useState<string>('');

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
                            <Button
                                onClick={() => setIsVisitorModalOpen(true)}
                                className="h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-100"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Registrar Visitas
                            </Button>
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
                                    className="bg-slate-50 border-slate-200"
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
                                    className="bg-slate-50 border-slate-200"
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
                                        className="bg-slate-50 border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Culto</label>
                                    <select
                                        className="w-full px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 text-xs uppercase tracking-widest outline-none focus:border-amber-500 transition-all"
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
                            <Button
                                type="submit"
                                disabled={isSavingConvert}
                                className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-100"
                            >
                                {isSavingConvert ? 'Salvando...' : 'Registrar Decisão'}
                            </Button>
                        </form>
                    </Card>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Decisões</p>
                                    <p className="text-3xl font-black text-slate-900 mt-1">{newConverts.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                </div>
                            </div>
                            {/* Placeholder para métrica futura */}
                            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between opacity-60">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consolidados</p>
                                    <p className="text-3xl font-black text-slate-900 mt-1">-</p>
                                </div>
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
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
                                            <th className="px-6 py-4">Data da Decisão</th>
                                            <th className="px-6 py-4 rounded-tr-xl">Status</th>
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
                                        {newConverts.map((member) => (
                                            <tr key={member.id} className="group hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-700">{formatName(member.name)}</p>
                                                    <p className="text-[10px] text-slate-400">{member.phone}</p>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-slate-600">
                                                    {new Date(member.joinDate).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">
                                                        {member.status}
                                                    </span>
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
        </div>
    );
};

export default Recepcao;
