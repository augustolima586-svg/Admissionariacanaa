
import React, { useState } from 'react';
import { Member, MemberStatus, MissionField, Reminder, PrayerRequest, ResidenceService } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';


interface SecretariaProps {
  members: Member[];
  onSaveMember: (m: Omit<Member, 'id' | 'contributions'>) => Promise<any>;
  onUpdateMember: (id: string, m: Partial<Member>) => Promise<any>;
  missionFields: MissionField[];
  reminders: Reminder[];
  setMembers: any;
  setReminders: any;
  notices?: any[];
  onSaveNotice?: (n: any) => Promise<any>;
  onDeleteNotice?: (id: string) => Promise<any>;
  unreadPrayers?: PrayerRequest[];
  residenceServices?: ResidenceService[];
  onUpdateResidenceServiceStatus?: (id: string, status: ResidenceService['status'], isRead?: boolean) => Promise<any>;
  onUpdatePrayerStatus?: (id: string, isRead: boolean) => Promise<any>;
}

const Secretaria: React.FC<SecretariaProps> = ({ members, onSaveMember, onUpdateMember, missionFields, reminders, setReminders, notices, onSaveNotice, onDeleteNotice, unreadPrayers = [], residenceServices = [], onUpdateResidenceServiceStatus, onUpdatePrayerStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [baptismFilter, setBaptismFilter] = useState<'all' | 'baptized' | 'not_baptized'>('all');

  // Estado para Mensagens em Massa
  const [massMessage, setMassMessage] = useState({ title: '', content: '', type: 'Alerta de Culto' });
  const [isSending, setIsSending] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'Membro',
    congregacao: 'Sede',
    ageGroup: 'Adulto',
    status: 'Ativo' as MemberStatus,
    birthDate: '',
    baptismDate: '',
    rua: '',
    numero: '',
    bairro: '',
    cep: '',
    password: '',
    country: 'Brasil'
  });

  const cargoOptions = ["Pastor", "Evangelista", "Presbítero", "Diácono", "Diaconisa", "Missionário", "Missionária", "Líder", "Obreiro", "Obreira", "Membro", "Músico"];
  const statusOptions: MemberStatus[] = ["Ativo", "Frequentador", "Visitante", "Em Observação", "Inativo"];

  const handleOpenAddModal = () => {
    setFormData({
      name: '', email: '', phone: '', category: 'Membro', congregacao: 'Sede',
      ageGroup: 'Adulto', status: 'Ativo', birthDate: '', baptismDate: '',
      rua: '', numero: '', bairro: '', cep: '', password: '', country: 'Brasil'
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setFormData({
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
      category: member.category,
      congregacao: member.congregacao || 'Sede',
      ageGroup: member.ageGroup || 'Adulto',
      status: (member.status as string) === 'Membro' ? 'Ativo' : (member.status || 'Ativo'),
      birthDate: member.birthDate || '',
      baptismDate: member.baptismDate || '',
      rua: member.rua || '',
      numero: member.numero || '',
      bairro: member.bairro || '',
      cep: member.cep || '',
      password: member.password || '',
      country: member.country || 'Brasil'
    });
    setEditingId(member.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && editingId) {
      await onUpdateMember(editingId, { ...formData });
    } else {
      await onSaveMember({ ...formData, joinDate: new Date().toISOString().split('T')[0] });
    }
    setIsModalOpen(false);
  };

  const handleSendMassMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!massMessage.title || !massMessage.content) return;

    setIsSending(true);
    // Simula envio em massa criando um lembrete global prioritário
    try {
      if (setReminders) {
        await setReminders({
          title: massMessage.title,
          type: massMessage.type,
          date: 'Hoje',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          color: massMessage.type === 'Urgente' ? 'bg-red-600' : 'bg-indigo-600'
        });
      }
      alert('Mensagem em massa disparada para todos os smartphones dos membros!');
      setMassMessage({ title: '', content: '', type: 'Alerta de Culto' });
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar lembrete: ' + err);
    } finally {
      setIsSending(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório Geral de Membros - AD Missionária Canaã', 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 28);
    const tableData = members.map(m => [m.name, m.category, m.congregacao, m.status, m.phone || 'N/A']);
    autoTable(doc, {
      head: [['Nome', 'Cargo', 'Congregação', 'Status', 'Telefone']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] }
    });
    doc.save(`membros_canaa_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Cargo', 'Congregacao', 'Status', 'Data Nascimento', 'Endereço'];
    const csvContent = [
      headers.join(','),
      ...members.map(m => [
        `"${m.name}"`,
        `"${m.email || ''}"`,
        `"${m.phone || ''}"`,
        `"${m.category}"`,
        `"${m.congregacao}"`,
        `"${m.status}"`,
        `"${m.birthDate || ''}"`,
        `"${m.rua || ''}, ${m.numero || ''} - ${m.bairro || ''}"`
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `membros_canaa_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cálculos de KPIs
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'Ativo').length;
  const newMembers = members.filter(m => {
    if (!m.joinDate) return false;
    const join = new Date(m.joinDate);
    const now = new Date();
    return join.getMonth() === now.getMonth() && join.getFullYear() === now.getFullYear();
  }).length;
  const birthdays = members.filter(m => {
    if (!m.birthDate) return false;
    const birth = new Date(m.birthDate);
    // Ajuste de fuso horário simples para garantir a data correta
    const birthDay = birth.getUTCDate();
    const birthMonth = birth.getUTCMonth();
    const now = new Date();
    return birthMonth === now.getMonth();
  }).length;

  const birthdaysToday = members.filter(m => {
    if (!m.birthDate) return false;
    const birth = new Date(m.birthDate);
    const birthDay = birth.getUTCDate();
    const birthMonth = birth.getUTCMonth();
    const now = new Date();
    return birthDay === now.getDate() && birthMonth === now.getMonth();
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-24">

      {/* Header & Actions */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-black text-slate-900 italic tracking-tighter">Secretaria Ministerial</h2>
          <p className="text-slate-500 font-medium text-sm">Gestão de membros e comunicação oficial.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleOpenAddModal} className="bg-red-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-red-700 hover:shadow-red-200 transition-all">
            + Novo Membro
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Membros</span>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth={2} /></svg></div>
          </div>
          <span className="text-4xl font-heading font-black text-slate-800 tracking-tighter">{totalMembers}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Membros Ativos</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} /></svg></div>
          </div>
          <span className="text-4xl font-heading font-black text-slate-800 tracking-tighter">{activeMembers}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Novos (Mês)</span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeWidth={2} /></svg></div>
          </div>
          <span className="text-4xl font-heading font-black text-slate-800 tracking-tighter">{newMembers}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-auto min-h-[8rem] group hover:border-pink-100 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-500">Aniversariantes</span>
            <div className="p-2 bg-pink-50 rounded-lg text-pink-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" strokeWidth={2} /></svg></div>
          </div>
          <div>
            <span className="text-3xl font-heading font-black text-slate-800 tracking-tighter block">{birthdays} <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/ Mês</span></span>
            <div className="mt-3 pt-3 border-t border-slate-50">
              {birthdaysToday.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-pink-600 tracking-widest animate-pulse">🎉 Hoje:</p>
                  {birthdaysToday.map(b => (
                    <p key={b.id} className="text-xs font-bold text-slate-700 truncate">{b.name.split(' ')[0] + ' ' + (b.name.split(' ')[1] || '')}</p>
                  ))}
                </div>
              ) : (
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Ninguém hoje</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PAINEL DE ORAÇÃO E PEDIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-heading font-black text-slate-800 uppercase tracking-wide">Pedidos de Oração</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unreadPrayers.length} Novos Pedidos</p>
            </div>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {unreadPrayers.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhum pedido pendente</p>
              </div>
            ) : (
              unreadPrayers.map((prayer) => (
                <div key={prayer.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-violet-50 hover:border-violet-100 transition-colors group relative">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest bg-violet-100/50 px-2 py-1 rounded-md">{prayer.userName}</span>
                    <span className="text-[9px] font-bold text-slate-400">{prayer.timestamp ? new Date(prayer.timestamp).toLocaleDateString('pt-BR') : 'Hoje'}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 italic mb-3">"{prayer.content}"</p>
                  <button
                    onClick={() => onUpdatePrayerStatus && onUpdatePrayerStatus(prayer.id, true)}
                    className="w-full py-1.5 bg-violet-600 text-white text-[9px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    Concluir Oração
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeWidth={2} /></svg>
            </div>
            <div>
              <h3 className="text-sm font-heading font-black text-slate-800 uppercase tracking-wide">Cultos no Lar Pendentes</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{residenceServices.filter(rs => !rs.isRead || rs.status === 'Pendente').length} Aguardando</p>
            </div>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {residenceServices.filter(rs => !rs.isRead || rs.status === 'Pendente').length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma solicitação</p>
              </div>
            ) : (
              residenceServices.filter(rs => !rs.isRead || rs.status === 'Pendente').map((rs) => (
                <div key={rs.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-rose-50 hover:border-rose-100 transition-colors relative group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{rs.memberName}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${rs.status === 'Pendente' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>{rs.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold mb-1">{new Date(rs.serviceDate).toLocaleDateString('pt-BR')} às {rs.serviceTime}</p>
                  <p className="text-xs text-slate-600 line-clamp-2">{rs.address}</p>
                  {onUpdateResidenceServiceStatus && (
                    <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onUpdateResidenceServiceStatus(rs.id, 'Agendado', true)}
                        className="flex-1 bg-green-500 text-white text-[9px] font-black uppercase py-1.5 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => onUpdateResidenceServiceStatus(rs.id, 'Cancelado', true)}
                        className="flex-1 bg-slate-200 text-slate-600 text-[9px] font-black uppercase py-1.5 rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        Recusar
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Member Table (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">

            {/* Table Header/Controls */}
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
              <div className="relative w-full md:w-72">
                <Input type="text" placeholder="Buscar membro..." className="pl-10 h-10 text-xs bg-white border-slate-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2} /></svg>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  onClick={() => setBaptismFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${baptismFilter === 'all' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setBaptismFilter('baptized')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${baptismFilter === 'baptized' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200'}`}
                >
                  Batizados
                </button>
                <button
                  onClick={() => setBaptismFilter('not_baptized')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${baptismFilter === 'not_baptized' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200'}`}
                >
                  Não Batizados
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={exportToExcel} className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Exportar Excel">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2} /></svg>
                </button>
                <button onClick={exportToPDF} className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Exportar PDF">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeWidth={2} /></svg>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400">
                  <tr>
                    <th className="px-6 py-4 pl-8">Membro</th>
                    <th className="px-6 py-4">Congregação</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right pr-8">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {members
                    .filter(m => {
                      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesBaptism =
                        baptismFilter === 'all' ? true :
                          baptismFilter === 'baptized' ? !!m.baptismDate :
                            !m.baptismDate;
                      return matchesSearch && matchesBaptism;
                    })
                    .map(member => (
                      <tr key={member.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-6 py-4 pl-8">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs group-hover:bg-red-600 group-hover:text-white transition-colors">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-700 text-xs">{member.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{member.category}</span>
                                {member.baptismDate ? (
                                  <span className="text-[8px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100" title={new Date(member.baptismDate).toLocaleDateString('pt-BR')}>Batizado</span>
                                ) : (
                                  <span className="text-[8px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">Pendente</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500">{member.congregacao || 'Sede'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${member.status === 'Inativo' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'Inativo' ? 'bg-slate-400' : 'bg-emerald-500'}`}></span>
                            {member.status === 'Membro' ? 'Ativo' : (member.status || 'Ativo')}
                          </span>
                        </td>
                        <td className="px-6 py-4 pr-8 text-right">
                          <button onClick={() => handleOpenEditModal(member)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2} /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-50 bg-slate-50/30 text-center text-xs text-slate-400 font-medium">
              Exibindo {members.filter(m => {
                const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesBaptism =
                  baptismFilter === 'all' ? true :
                    baptismFilter === 'baptized' ? !!m.baptismDate :
                      !m.baptismDate;
                return matchesSearch && matchesBaptism;
              }).length} registros
            </div>
          </div>
        </div>

        {/* Right Column: Notices & Quick Actions (Span 4) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Central de Avisos Compacta (Novo Design) */}
          <div className="bg-slate-900 rounded-[2rem] shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/20 rounded-full blur-[60px] -mr-16 -mt-16"></div>

            {/* Header */}
            <div className="p-6 border-b border-white/10 relative z-10">
              <h3 className="text-white font-heading font-black italic text-lg tracking-tight">Central de Notificações</h3>
              <p className="text-slate-400 text-xs mt-1">Publique avisos para o app.</p>
            </div>

            {/* Mass Message Form */}
            <div className="p-6 space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Para quem?</label>
                <div className="flex bg-white/5 p-1 rounded-xl">
                  {['Todos', 'Liderança', 'Jovens'].map(type => (
                    <button
                      key={type}
                      onClick={() => setMassMessage({ ...massMessage, type })}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${massMessage.type === type ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Título do Aviso..."
                  value={massMessage.title}
                  onChange={e => setMassMessage({ ...massMessage, title: e.target.value })}
                  className="bg-white/5 border-transparent text-white placeholder-slate-500 focus:bg-white/10 text-xs font-bold"
                />
                <textarea
                  placeholder="Escreva sua mensagem aqui..."
                  value={massMessage.content}
                  onChange={e => setMassMessage({ ...massMessage, content: e.target.value })}
                  className="w-full h-24 bg-white/5 border-transparent rounded-xl p-4 text-white placeholder-slate-500 text-xs resize-none focus:outline-none focus:bg-white/10 transition-colors"
                />
              </div>

              <button
                onClick={handleSendMassMessage}
                className="w-full py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                disabled={isSending}
              >
                {isSending ? <span className="animate-spin">⏳</span> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeWidth={2} /></svg>}
                Enviar Aviso
              </button>
            </div>

            {/* Recent Notices List */}
            <div className="bg-black/20 p-6 max-h-60 overflow-y-auto custom-scrollbar">
              <h4 className="text-[9px] font-heading font-black text-slate-500 uppercase tracking-widest mb-3">Histórico Recente</h4>
              <div className="space-y-3">
                {notices?.map((notice: any) => (
                  <div key={notice.id} className="flex justify-between items-start group">
                    <div>
                      <p className="text-white text-xs font-bold">{notice.title}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{notice.targetAudience} • {new Date(notice.date).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => onDeleteNotice && onDeleteNotice(notice.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg>
                    </button>
                  </div>
                ))}
                {!notices?.length && <p className="text-[10px] text-slate-600 italic text-center py-2">Nenhum aviso publicado.</p>}
              </div>
            </div>
          </div>

        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
            <div className={`p-8 md:p-10 text-white flex justify-between items-center relative overflow-hidden ${isEditMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-red-950'}`}>
              <div className="absolute top-0 right-0 p-6 opacity-[0.08]">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
              </div>
              <div className="relative z-10">
                <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400 transition-colors">{isEditMode ? 'Gestão de Ficha' : 'Secretaria Eclesiástica'}</h3>
                <p className="text-3xl font-heading font-black italic tracking-tighter leading-none">{isEditMode ? 'Editar Cadastro' : 'Ficha de Matrícula'}</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-3">Dados Federativos e Memorandos</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all duration-300 hover:rotate-90"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 custom-scrollbar bg-slate-50/50">

              {/* Seção 1: Dados Pessoais */}
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100/60">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors ${isEditMode ? 'bg-indigo-600 shadow-indigo-100' : 'bg-red-600 shadow-red-100'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth={2.5} /></svg>
                  </div>
                  <h4 className="text-xs font-heading font-black text-slate-800 uppercase tracking-[0.2em]">Dados Pessoais</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Nome Completo</label>
                    <Input
                      type="text"
                      required
                      placeholder="Nome Completo"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="h-16 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Data de Nascimento</label>
                    <Input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="h-16 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Naturalidade / País</label>
                    <select
                      className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 text-sm appearance-none cursor-pointer focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all"
                      value={formData.country || 'Brasil'}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                    >
                      <option value="Brasil">Brasil 🇧🇷</option>
                      <option value="EUA">Estados Unidos (EUA) 🇺🇸</option>
                      <option value="Portugal">Portugal 🇵🇹</option>
                      <option value="Espanha">Espanha 🇪🇸</option>
                      <option value="Angola">Angola 🇦🇴</option>
                      <option value="Moçambique">Moçambique 🇲🇿</option>
                      <option value="Argentina">Argentina 🇦🇷</option>
                      <option value="Outro">Outro (Exterior) 🌍</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">E-mail</label>
                    <Input type="email" placeholder="email@exemplo.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="h-16 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">WhatsApp</label>
                    <Input type="text" required placeholder="(00) 90000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="h-16 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300" />
                  </div>
                </div>
              </div>

              {/* Seção 2: Endereço */}
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100/60">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors ${isEditMode ? 'bg-indigo-600 shadow-indigo-100' : 'bg-red-600 shadow-red-100'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth={2.5} /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2.5} /></svg>
                  </div>
                  <h4 className="text-xs font-heading font-black text-slate-800 uppercase tracking-[0.2em]">Endereço Residencial</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">CEP</label>
                    <Input type="text" placeholder="00000-000" value={formData.cep} onChange={e => setFormData({ ...formData, cep: e.target.value })} className="h-16 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300" />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Logradouro (Rua/Av)</label>
                    <Input type="text" placeholder="Rua das Flores" value={formData.rua} onChange={e => setFormData({ ...formData, rua: e.target.value })} className="h-16 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300" />
                  </div>
                  <div className="md:col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Número</label>
                    <Input type="text" placeholder="123" value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} className="h-16 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300" />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Bairro</label>
                    <Input type="text" placeholder="Centro" value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} className="h-16 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300" />
                  </div>
                </div>
              </div>

              {/* Seção 3: Dados Eclesiásticos */}
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100/60">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors ${isEditMode ? 'bg-indigo-600 shadow-indigo-100' : 'bg-red-600 shadow-red-100'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" strokeWidth={2.5} /></svg>
                  </div>
                  <h4 className="text-xs font-heading font-black text-slate-800 uppercase tracking-[0.2em]">Informações Eclesiásticas</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Data de Batismo</label>
                      {formData.baptismDate ? (
                        <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Confirmado</span>
                      ) : (
                        <span className="text-[8px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Aguardando Batismo</span>
                      )}
                    </div>
                    <Input type="date" value={formData.baptismDate} onChange={e => setFormData({ ...formData, baptismDate: e.target.value })} className={`h-16 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all ${!formData.baptismDate && 'border-amber-100'}`} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Congregação de Vínculo</label>
                    <select className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 text-sm appearance-none cursor-pointer focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all" value={formData.congregacao} onChange={e => setFormData({ ...formData, congregacao: e.target.value })}>
                      <option value="Sede">Sede Central</option>
                      {missionFields.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Função Eclesiástica</label>
                    <select className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 text-sm appearance-none cursor-pointer focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                      {cargoOptions.map(cargo => <option key={cargo} value={cargo}>{cargo}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Situação Cadastral</label>
                    <select className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 text-sm appearance-none cursor-pointer focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className={`group relative w-full h-20 rounded-[2.5rem] font-black text-sm text-white shadow-2xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] overflow-hidden ${isEditMode ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 shadow-indigo-200' : 'bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-red-200'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth={3.5} /></svg>
                    {isEditMode ? 'Salvar Alterações' : 'Confirmar Nova Matrícula'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Secretaria;
