
import React, { useState } from 'react';
import { MissionField, Member, Transaction } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';

interface CampoMissionarioProps {
  fields: MissionField[];
  setFields: React.Dispatch<React.SetStateAction<MissionField[]>>;
  onSaveField: (f: Omit<MissionField, 'id' | 'converts' | 'members'>) => Promise<any>;
  onUpdateField: (id: string, updates: Partial<MissionField>) => Promise<any>;
  onDeleteField: (id: string) => Promise<void>;
  members: Member[];
  onUpdateMember?: (id: string, updates: Partial<Member>) => Promise<any>;
  transactions: Transaction[];
}

const CampoMissionario: React.FC<CampoMissionarioProps> = ({ fields, onSaveField, onUpdateField, onDeleteField, members, onUpdateMember, transactions }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMemberLinkModalOpen, setIsMemberLinkModalOpen] = useState(false);
  const [selectedFieldForLink, setSelectedFieldForLink] = useState<string | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [selectedFieldForExpenses, setSelectedFieldForExpenses] = useState<MissionField | null>(null);

  // Edit State
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [newField, setNewField] = useState({
    name: '',
    leader: '',
    status: 'Implantação' as 'Ativo' | 'Implantação' | 'Consolidado',
    progress: 0
  });

  const handleOpenModal = (field?: MissionField) => {
    if (field) {
      setEditingFieldId(field.id);
      setNewField({
        name: field.name,
        leader: field.leader,
        status: field.status,
        progress: field.progress
      });
    } else {
      setEditingFieldId(null);
      setNewField({ name: '', leader: '', status: 'Implantação', progress: 0 });
    }
    setIsModalOpen(true);
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newField.name || !newField.leader) {
      alert("Preencha nome e líder");
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    let err;
    try {
      if (editingFieldId) {
        err = await onUpdateField(editingFieldId, {
          name: newField.name,
          leader: newField.leader,
          status: newField.status,
          progress: Number(newField.progress)
        });
      } else {
        err = await onSaveField({
          name: newField.name,
          leader: newField.leader,
          status: newField.status,
          progress: Number(newField.progress)
        });
      }
    } catch (ex) {
      console.error("Erro inesperado ao salvar campo:", ex);
    }

    setIsSaving(false);
    if (!err) {
      setIsModalOpen(false);
      setNewField({ name: '', leader: '', status: 'Implantação', progress: 0 });
    } else {
      alert("Erro ao salvar campo missionário.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("ATENÇÃO: Deseja realmente excluir este campo missionário? Esta ação é irreversível.")) {
      await onDeleteField(id);
    }
  };

  const handleGenerateReport = (field: MissionField) => {
    const fieldMembers = members.filter((m: Member) => m.congregacao === field.name);

    const doc = new jsPDF();
    doc.text(`Relatório de Membros - ${field.name}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Líder: ${field.leader} | Status: ${field.status}`, 14, 22);
    doc.text(`Total de Membros: ${fieldMembers.length}`, 14, 27);

    autoTable(doc, {
      startY: 35,
      head: [['Nome', 'Telefone', 'Categoria', 'Status']],
      body: fieldMembers.map((m: Member) => [m.name, m.phone, m.category, m.status]),
    });

    doc.save(`Relatorio_Membros_${field.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleUpdateMetric = async (id: string, metric: keyof MissionField, value: string) => {
    await onUpdateField(id, { [metric]: Number(value) });
  };

  const openLinkMemberModal = (fieldId: string) => {
    setSelectedFieldForLink(fieldId);
    setMemberSearchTerm('');
    setIsMemberLinkModalOpen(true);
  };

  const handleLinkMember = async (member: Member) => {
    if (!selectedFieldForLink) return;

    const field = fields.find((f: MissionField) => f.id === selectedFieldForLink);
    if (!field) return;

    // Check if member is already linked to this field
    if (member.congregacao === field.name) {
      alert("Membro já vinculado a este campo.");
      return;
    }

    // Update member's congregacao to link them to this mission field
    if (onUpdateMember) {
      const error = await onUpdateMember(member.id, { congregacao: field.name });
      if (!error) {
        alert(`${member.name} foi vinculado ao campo ${field.name} com sucesso!`);
      } else {
        alert(`Erro ao vincular membro: ${error.message}`);
      }
    } else {
      alert(`Para vincular ${member.name} ao campo ${field.name}, vá até a Secretaria e altere a Congregação do membro para "${field.name}".`);
    }
    setIsMemberLinkModalOpen(false);
  };

  const filteredMembers = members.filter((m: Member) => m.name.toLowerCase().includes(memberSearchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-black text-slate-900 tracking-tight italic">Campos Missionários</h2>
          <p className="text-slate-500 font-medium text-sm">Expansão ministerial: Ide e fazei discípulos em todas as nações.</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto h-12 px-6 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group border-none"
        >
          <svg className="w-5 h-5 mr-1 group-hover:rotate-90 transition-transform duration-500 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={3} /></svg>
          Novo Campo Missionário
        </Button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {fields.map((field) => (
          <div key={field.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 group relative flex flex-col">
            {/* Header com Gradiente Suave e Pattern */}
            <div className="relative h-32 bg-red-900 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-800 to-red-950 opacity-100"></div>
              {/* Abstract World Map / Dots Pattern (CSS simulated) */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500 rounded-full blur-[60px] opacity-30 group-hover:opacity-40 transition-opacity duration-500"></div>

              <div className="absolute top-6 right-6 flex gap-2 z-10">
                <button onClick={() => handleOpenModal(field)} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-red-700 transition-all shadow-lg border border-white/10 group/btn">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth={2} /></svg>
                </button>
                <button onClick={() => handleDelete(field.id)} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500 hover:text-white transition-all shadow-lg border border-white/10">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg>
                </button>
              </div>

              <div className="absolute bottom-6 left-8">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 mb-2 backdrop-blur-md border ${field.status === 'Consolidado' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                  field.status === 'Ativo' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${field.status === 'Consolidado' ? 'bg-cyan-400' :
                    field.status === 'Ativo' ? 'bg-emerald-400' :
                      'bg-amber-400'
                    }`}></span>
                  {field.status}
                </div>
                <h3 className="text-2xl font-heading font-black text-white italic tracking-tight leading-none drop-shadow-sm">{field.name}</h3>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col gap-8">
              {/* Leader Info */}
              <div className="flex items-center gap-4 -mt-12 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-xl">
                  <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center text-xl font-black text-red-700 uppercase">
                    {field.leader.substring(0, 2)}
                  </div>
                </div>
                <div className="pt-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liderança</p>
                  <p className="text-sm font-black text-slate-800">{field.leader}</p>
                </div>
              </div>

              {/* Progress Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consolidação</p>
                  <p className="text-xl font-black text-red-800">{field.progress}<span className="text-xs text-red-800/50 ml-0.5">%</span></p>
                </div>
                <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-700 via-red-600 to-amber-500 rounded-full transition-all duration-1000 shadow-[0_2px_10px_rgba(185,28,28,0.3)]" style={{ width: `${field.progress}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-shimmer" style={{ backgroundSize: '200% 100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}></div>
                  </div>
                </div>
              </div>

              {/* Metrics Grid - Cards Redesign */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Alcance', key: 'metrics_people_reach', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                  { label: 'Bíblias', key: 'metrics_bibles_distributed', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
                  { label: 'Batismos', key: 'metrics_baptisms', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                  { label: 'Igrejas', key: 'metrics_new_churches', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5M9 21h6' }
                ].map((item: any) => (
                  <div key={item.key} className="bg-slate-50 rounded-2xl p-3 border border-slate-100 hover:border-slate-200 transition-colors group/metric">
                    <div className="flex items-center gap-2 mb-2 opacity-50 text-slate-500 fill-slate-500">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d={item.icon} strokeWidth={2.5} /></svg>
                      <span className="text-[8px] font-black uppercase tracking-wider">{item.label}</span>
                    </div>
                    <Input
                      type="number"
                      className="w-full bg-transparent border-none p-0 text-2xl font-black text-slate-800 focus:ring-0 text-center hover:scale-110 transition-transform cursor-text"
                      placeholder="0"
                      defaultValue={(field as any)[item.key] || 0}
                      onBlur={(e) => handleUpdateMetric(field.id, item.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* Team Section with Add Button */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest">Missionários</h4>
                  <button onClick={() => openLinkMemberModal(field.id)} className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={3} /></svg>
                  </button>
                </div>

                <div className="flex -space-x-2 overflow-hidden py-1 pl-1">
                  {(() => {
                    const fieldMembers = members.filter((m: Member) => m.congregacao === field.name);
                    return fieldMembers.length > 0 ? fieldMembers.map((m: Member, idx: number) => (
                      <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[9px] font-black text-slate-600 shadow-sm relative z-0 hover:z-10 hover:scale-110 transition-all" title={`${m.name} - ${m.category}`}>
                        {m.name.charAt(0)}
                      </div>
                    )) : (
                      <span className="text-[10px] text-slate-300 italic pl-1">Aguardando equipe...</span>
                    );
                  })()}
                </div>
              </div>

              {/* Finance Section */}
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest">Gestão Financeira</h4>
                  <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[8px] font-bold uppercase tracking-widest">Tempo Real</div>
                </div>

                {(() => {
                  const fieldTransactions = transactions.filter((t: Transaction) => t.location === field.name);
                  const tithes = fieldTransactions.filter((t: Transaction) => t.type === 'Entrada' && t.category === 'Dízimo').reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);
                  const offerings = fieldTransactions.filter((t: Transaction) => t.type === 'Entrada' && t.category === 'Oferta').reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);
                  const expenses = fieldTransactions.filter((t: Transaction) => t.type === 'Saída').reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);

                  return (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mb-1">Dízimos</p>
                          <p className="text-sm font-black text-emerald-600 tracking-tighter leading-none">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tithes)}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mb-1">Ofertas</p>
                          <p className="text-sm font-black text-emerald-600 tracking-tighter leading-none">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(offerings)}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mb-1">Gastos</p>
                          <p className="text-sm font-black text-red-600 tracking-tighter leading-none">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenses)}
                          </p>
                        </div>
                      </div>

                      {expenses > 0 && (
                        <button
                          onClick={() => {
                            setSelectedFieldForExpenses(field);
                            setIsExpensesModalOpen(true);
                          }}
                          className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-red-100/50"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth={3} /></svg>
                          Ver Detalhes de Gastos
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Botões de Ação no Footer */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handleGenerateReport(field)}
                  className="flex-1 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all group/btn flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-slate-300 group-hover/btn:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2} /></svg>
                  Relatório
                </button>
              </div>
            </div>
          </div>
        ))}
        {fields.length === 0 && (
          <Card className="col-span-full py-32 border-dashed border-slate-200 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2} /></svg>
            </div>
            <p className="text-slate-300 font-black uppercase text-xs tracking-[0.5em] italic">Nenhum campo missionário</p>
          </Card>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative">
            {/* Decorative Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

            <div className={`relative bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 p-10 overflow-hidden`}>
              <div className="absolute top-0 right-0 p-6 opacity-[0.08]">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" /></svg>
              </div>
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Expansion de Fronteiras</h3>
                  <p className="text-2xl font-heading font-black italic tracking-tighter leading-none text-white">
                    {editingFieldId ? 'Editar Missão' : 'Nova Missão'}
                  </p>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-3">Evangelismo e Plantação</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white hover:text-red-700 transition-all shadow-lg backdrop-blur-md border border-white/10">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
                </button>
              </div>
            </div>

            <form className="p-8 space-y-6" onSubmit={handleAddField}>


              <div className="space-y-5">
                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Campo Missionário</label>
                  <Input
                    type="text"
                    required
                    className="h-16 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-lg focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Ex: Congregação Bairro Novo..."
                    value={newField.name}
                    onChange={e => setNewField({ ...newField, name: e.target.value })}
                  />
                </div>

                <div className="group space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Líder Missionário / Obreiro</label>
                  <Input
                    type="text"
                    required
                    className="h-16 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-lg focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Nome do obreiro..."
                    value={newField.leader}
                    onChange={e => setNewField({ ...newField, leader: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1.5 block">Status</label>
                  <div className="relative">
                    <select
                      className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 appearance-none cursor-pointer hover:border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                      value={newField.status}
                      onChange={e => setNewField({ ...newField, status: e.target.value as any })}
                    >
                      <option value="Implantação">Implantação</option>
                      <option value="Ativo">Ativo</option>
                      <option value="Consolidado">Consolidado</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth={2.5} /></svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1.5 block">Progresso</label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-black text-center text-lg text-slate-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                      value={newField.progress}
                      onChange={e => setNewField({ ...newField, progress: Number(e.target.value) })}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="relative z-50 w-full h-18 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-red-100 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none"></div>
                  <span className="relative z-10 flex items-center justify-center gap-3 pointer-events-none">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth={3.5} /></svg>
                    {isSaving ? 'Gravando...' : (editingFieldId ? 'Salvar Alterações' : 'Efetivar Cadastro')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )
      }

      {/* Link Member Modal */}
      {
        isMemberLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <Card className="w-full max-w-lg p-0 !rounded-[2rem] shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[85vh] border-none">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-10 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.08]">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                </div>
                <div className="relative z-10">
                  <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Povo de Deus</h3>
                  <p className="text-2xl font-heading font-black italic tracking-tighter leading-none text-white">Vincular Missionário</p>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-3">Busca no Rol de Membros</p>
                </div>
                <button onClick={() => setIsMemberLinkModalOpen(false)} className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
              </div>
              <div className="p-8 bg-white border-b border-slate-50">
                <div className="relative">
                  <Input
                    type="text"
                    className="pl-14 h-14 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600/20 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Buscar por nome..."
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    autoFocus
                  />
                  <svg className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={3} /></svg>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredMembers.slice(0, 10).map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleLinkMember(member)}
                    className="w-full text-left p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{member.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{member.category || 'Membro'}</p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Selecionar</span>
                    </div>
                  </button>
                ))}
                {filteredMembers.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium uppercase tracking-widest italic">Nenhum membro encontrado</div>
                )}
              </div>
            </Card>
          </div>
        )
      }
      {/* Expenses Detail Modal */}
      {isExpensesModalOpen && selectedFieldForExpenses && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-2xl p-0 !rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[85vh] border-none">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 p-10 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-[0.08]">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
              </div>
              <div className="relative z-10">
                <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Auditoria Financeira</h3>
                <p className="text-2xl font-heading font-black italic tracking-tighter leading-none text-white">Detalhamento de Saídas</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-3">{selectedFieldForExpenses.name}</p>
              </div>
              <button
                onClick={() => setIsExpensesModalOpen(false)}
                className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all shadow-xl"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar bg-white">
              {transactions
                .filter((t: Transaction) => t.location === (selectedFieldForExpenses?.name || '') && t.type === 'Saída')
                .map((t: Transaction, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-red-200 transition-all hover:bg-red-50/30">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} /></svg>
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{t.category}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                          {t.date} {t.auditUser && `• ${t.auditUser}`}
                        </p>
                        {t.notes && (
                          <p className="text-[11px] text-slate-500 font-medium italic mt-2 bg-white/50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">
                            "{t.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-red-600 tracking-tighter italic">
                        -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                      </p>
                    </div>
                  </div>
                ))}

              {transactions.filter((t: Transaction) => t.location === (selectedFieldForExpenses?.name || '') && t.type === 'Saída').length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto border border-dashed border-slate-200">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} /></svg>
                  </div>
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] italic">Nenhum gasto registrado neste campo.</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Saídas</p>
              <p className="text-2xl font-black text-red-600 tracking-tighter italic">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  transactions.filter((t: Transaction) => t.location === selectedFieldForExpenses.name && t.type === 'Saída').reduce((acc: number, curr: Transaction) => acc + curr.amount, 0)
                )}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div >
  );
};

export default CampoMissionario;
