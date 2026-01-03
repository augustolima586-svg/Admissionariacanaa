
import React, { useState, useMemo } from 'react';
import { Transaction, User, MissionField } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';


interface TesourariaProps {
  transactions: Transaction[];
  onSaveTransaction: (t: Omit<Transaction, 'id' | 'date' | 'auditUser'>) => Promise<any>;
  onConfirmTransaction?: (id: string) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  user: User;
  missionFields: MissionField[];
}

const Tesouraria: React.FC<TesourariaProps> = ({ transactions, onSaveTransaction, onConfirmTransaction, onDeleteTransaction, user, missionFields }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'Entrada' | 'Saída'>('Entrada');
  const [formData, setFormData] = useState({ amount: '', category: 'Dízimo', location: 'Sede', identifiedPerson: '', notes: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const saidaCategories = ["Energia", "Água", "Internet", "Manutenção", "Compras de Materiais", "Material de Ensino", "Ação Social"];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {

      // 2. Date Filter
      // Use transaction_date (ISO) if available, otherwise fallback to date string (fragile)
      let tDate = new Date();
      if (t.transaction_date) {
        tDate = new Date(t.transaction_date);
      } else {
        // Fallback for old records or missing ISO: "DD/MM/YYYY"
        const parts = t.date.split(' ')[0].split('/');
        if (parts.length === 3) {
          tDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      }

      const tMonth = tDate.getMonth(); // 0-indexed
      const tYear = tDate.getFullYear();

      return tMonth.toString() === selectedMonth && tYear.toString() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    const entradas = filteredTransactions.filter(t => t.type === 'Entrada').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const saidas = filteredTransactions.filter(t => t.type === 'Saída').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    // Pie Chart Data (Expenses by Category)
    const expenseMap = new Map<string, number>();
    filteredTransactions.filter(t => t.type === 'Saída').forEach(t => {
      expenseMap.set(t.category, (expenseMap.get(t.category) || 0) + t.amount);
    });
    const pieData = Array.from(expenseMap.entries()).map(([name, value]) => ({ name, value }));

    // Bar Chart Data (Daily Flow)
    const dailyMap = new Map<string, { Entrada: number, Saida: number }>();
    filteredTransactions.forEach(t => {
      let dayVal = 1;
      if (t.transaction_date) {
        dayVal = new Date(t.transaction_date).getDate();
      } else {
        const parts = t.date.split(' ')[0].split('/');
        if (parts.length > 0) dayVal = parseInt(parts[0]);
      }
      const day = dayVal.toString();

      const current = dailyMap.get(day) || { Entrada: 0, Saida: 0 };
      if (t.type === 'Entrada') current.Entrada += t.amount;
      else current.Saida += t.amount;
      dailyMap.set(day, current);
    });

    const barData = Array.from(dailyMap.entries())
      .map(([day, val]) => ({ day: parseInt(day), ...val }))
      .sort((a, b) => a.day - b.day)
      .map(item => ({ name: `Dia ${item.day}`, Entrada: item.Entrada, Saida: item.Saida }));

    return { pieData, barData };
  }, [filteredTransactions]);


  const handleOpenModal = (type: 'Entrada' | 'Saída') => {
    setModalType(type);
    setFormData({ amount: '', category: type === 'Entrada' ? 'Dízimo' : 'Energia', location: 'Sede', identifiedPerson: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    const err = await onSaveTransaction({
      type: modalType,
      amount: parseFloat(formData.amount),
      category: formData.category,
      location: formData.location,
      identifiedPerson: formData.identifiedPerson || undefined,
      notes: formData.notes || undefined
    });
    setIsSaving(false);
    if (!err) setIsModalOpen(false);
    else alert("Erro ao salvar lançamento: " + (err.message || "Verifique sua conexão."));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.")) return;
    setDeletingId(id);
    await onDeleteTransaction(id);
    setDeletingId(null);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Relatório Financeiro - ${parseInt(selectedMonth) + 1}/${selectedYear}`, 14, 15);

    // Summary
    doc.setFontSize(10);
    doc.text(`Entradas: R$ ${stats.entradas.toFixed(2)}`, 14, 25);
    doc.text(`Saídas: R$ ${stats.saidas.toFixed(2)}`, 14, 30);
    doc.text(`Saldo Líquido: R$ ${stats.saldo.toFixed(2)}`, 14, 35);

    autoTable(doc, {
      head: [['Data', 'Local', 'Categoria', 'Valor', 'Tipo']],
      body: filteredTransactions.map(t => [t.date.split(' ')[0], t.location || 'Sede', t.category, `R$ ${t.amount.toFixed(2)}`, t.type]),
      startY: 45,
    });
    doc.save(`financeiro_${selectedMonth}_${selectedYear}.pdf`);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex-1">
          <h2 className="text-3xl font-heading font-black text-slate-900 italic">Gestão Financeira</h2>
          <p className="text-slate-500 font-medium">Controle ministerial de fluxos com transparência absoluta.</p>
        </div>

        {/* Date Filter & Status Toggle */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex gap-2">
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900/10">
              {Array.from({ length: 12 }, (_, i) => i).map(m => (
                <option key={m} value={m}>{new Date(0, m).toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}</option>
              ))}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900/10">
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <Button onClick={exportToPDF} className="flex-1 lg:flex-none h-12 px-6 bg-white text-slate-600 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-slate-50 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 group">
            <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={2.5} /></svg>
            Baixar Relatório
          </Button>
          <Button onClick={() => handleOpenModal('Entrada')} className="flex-1 lg:flex-none h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group">
            <svg className="w-4 h-4 mr-1 group-hover:-translate-y-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeWidth={3} /></svg>
            Entrada
          </Button>
          <Button onClick={() => handleOpenModal('Saída')} className="flex-1 lg:flex-none h-12 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group">
            <svg className="w-4 h-4 mr-1 group-hover:translate-y-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeWidth={3} /></svg>
            Saída
          </Button>
        </div>

      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Saldo do Período</p>
          <h3 className={`text-3xl font-heading font-black mt-2 ${stats.saldo >= 0 ? 'text-slate-900' : 'text-red-600'}`}>R$ {stats.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] shadow-sm border border-emerald-100/50 flex flex-col justify-center">
          <p className="text-emerald-600/60 text-[10px] font-black uppercase tracking-widest">Total Entradas</p>
          <h3 className="text-3xl font-heading font-black text-emerald-600 mt-2">R$ {stats.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-red-50/50 p-8 rounded-[2.5rem] shadow-sm border border-red-100/50 flex flex-col justify-center">
          <p className="text-red-600/60 text-[10px] font-black uppercase tracking-widest">Total Saídas</p>
          <h3 className="text-3xl font-heading font-black text-red-600 mt-2">R$ {stats.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[400px]">
          <h4 className="font-heading font-black text-slate-800 uppercase text-xs tracking-widest mb-6">Fluxo Diário</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(value) => `R$${value}`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend />
              <Bar dataKey="Entrada" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Saida" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[400px]">
          <h4 className="font-heading font-black text-slate-800 uppercase text-xs tracking-widest mb-6">Despesas por Categoria</h4>
          {chartData.pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-300 font-bold text-sm uppercase tracking-widest">
              Sem despesas no período
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-10 py-8 border-b bg-slate-50/50 flex items-center justify-between">
          <h4 className="font-heading font-black text-slate-800 uppercase text-xs tracking-widest">Extrato do Período</h4>
          <span className="bg-white px-3 py-1 rounded-full border text-[9px] font-black uppercase text-slate-400">Tempo Real</span>
        </div>
        <div className="overflow-x-auto scroll-smooth">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="text-[10px] uppercase font-black text-slate-400 border-b bg-slate-50/30">
                <th className="px-10 py-6">Data de Operação</th>
                <th className="px-10 py-6">Ponto de Venda/Local</th>
                <th className="px-10 py-6">Categoria</th>
                <th className="px-10 py-6">Valor Nominal</th>
                <th className="px-10 py-6">Status do Fluxo</th>
                <th className="px-10 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-5 text-slate-500 font-medium text-xs">
                    <div className="flex flex-col">
                      <span>{t.date.split(' ')[0]}</span>
                      {t.transaction_date && <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">{new Date(t.transaction_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  </td>
                  <td className="px-10 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{t.location || 'Sede'}</span>
                      {t.identifiedPerson && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.identifiedPerson}</span>}
                    </div>
                  </td>
                  <td className="px-10 py-5 text-slate-600">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{t.category}</span>
                      {t.notes && <span className="text-[9px] text-slate-400 font-medium truncate max-w-[200px]" title={t.notes}>{t.notes}</span>}
                    </div>
                  </td>
                  <td className={`px-10 py-5 font-black ${t.type === 'Saída' ? 'text-red-600' : 'text-emerald-600'}`}>R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-10 py-5">
                    <div className="flex flex-col gap-1.5">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase text-center ${t.type === 'Saída' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {t.type}
                      </span>
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase text-center border ${t.status === 'Confirmado'
                        ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-100/50 text-amber-700 border-amber-200'
                        }`}>
                        {t.status || 'Pendente'}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {t.status === 'Pendente' && onConfirmTransaction && (
                        <button
                          onClick={async () => {
                            setConfirmingId(t.id);
                            await onConfirmTransaction(t.id);
                            setConfirmingId(null);
                          }}
                          disabled={confirmingId === t.id}
                          className={`p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all ${confirmingId === t.id ? 'animate-pulse opacity-50' : ''}`}
                          title="Confirmar Lançamento"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className={`p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ${deletingId === t.id ? 'animate-pulse' : ''}`}
                        title="Excluir Lançamento"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center text-slate-300 font-black uppercase tracking-[0.4em] italic text-xs">Sem registros financeiros no período</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-scaleUp">
            <div className={`p-8 text-white flex justify-between items-center relative overflow-hidden ${modalType === 'Entrada' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-red-950'}`}>
              <div className="absolute top-0 right-0 p-4 opacity-[0.08]">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11ZM12 13C9.33333 13 4 14.3333 4 17V19H20V17C20 14.3333 14.6667 13 12 13Z" /></svg>
              </div>
              <div className="relative z-10">
                <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Tesouraria Ministerial</h3>
                <p className="text-2xl font-heading font-black italic tracking-tighter leading-none">{modalType === 'Entrada' ? 'Nova Entrada' : 'Registrar Despesa'}</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2">Lançamento Auditado</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montante Financeiro (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  className="h-20 text-3xl font-black px-8 bg-slate-50 border-slate-100 rounded-[2rem] text-slate-800 focus:ring-8 focus:ring-slate-900/5 focus:border-slate-900/10 placeholder:text-slate-200 outline-none transition-all"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ponto de Lançamento</label>
                  <select className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 text-xs uppercase tracking-widest appearance-none cursor-pointer focus:ring-8 focus:ring-slate-900/5 focus:border-slate-900/10 outline-none transition-all" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}>
                    <option value="Sede">Sede Central</option>
                    {missionFields.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria Contábil</label>
                  <select className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 text-xs uppercase tracking-widest appearance-none cursor-pointer focus:ring-8 focus:ring-slate-900/5 focus:border-slate-900/10 outline-none transition-all" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    {modalType === 'Entrada' ? <><option value="Dízimo">Dízimo Ministerial</option><option value="Oferta">Oferta de Amor</option><option value="EBD">Oferta EBD</option><option value="Outros">Outros Lançamentos</option></> : saidaCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações / Auditoria</label>
                <textarea className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-sm font-black text-slate-800 resize-none h-32 focus:ring-8 focus:ring-slate-900/5 focus:border-slate-900/10 outline-none transition-all placeholder:text-slate-200" placeholder="Detalhes adicionais do lançamento..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className={`group relative w-full h-18 rounded-[2rem] font-black text-sm text-white shadow-2xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] overflow-hidden ${modalType === 'Entrada' ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 shadow-emerald-200' : 'bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-red-200'} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth={3.5} /></svg>
                  {isSaving ? 'Gravando...' : 'Efetivar Lançamento'}
                </span>
              </button>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tesouraria;
