import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList, AreaChart, Area, Label } from 'recharts';
import { Member, Role, Transaction, AttendanceRecord, MissionField, EBDStudent, EBDAttendance, User, ResidenceService, PrayerRequest } from '../types';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { VisitorRegistrationModal } from './VisitorRegistrationModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const StatCard = ({ title, value, change, color, icon }: { title: string, value: string, change: string, color: string, icon: React.ReactNode }) => (
  <div className="p-3 md:p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-300 group flex items-center gap-3 md:gap-4 font-sans">
    <div className={`p-2 md:p-2.5 rounded-xl ${color === 'green' ? 'bg-green-50 text-green-600' : color === 'red' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'} shrink-0`}>
      {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4 md:w-5 md:h-5' })}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mb-0.5">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-heading font-black text-slate-900 tracking-tighter italic leading-none">{value}</h3>
        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${color === 'green' ? 'bg-green-50 text-green-600' : color === 'red' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
          {change}
        </span>
      </div>
    </div>
  </div>
);

const SectionHeader = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-6 mt-10 first:mt-0">
    <div className="p-2 bg-slate-900 text-white rounded-lg shadow-sm">
      {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
    </div>
    <h2 className="text-xs font-heading font-black text-slate-800 uppercase tracking-[0.2em] italic leading-none">{title}</h2>
    <div className="flex-1 h-px bg-slate-100 ml-2"></div>
  </div>
);

// ... (DashboardProps and Component definition remain)

// Inside Dashboard render:


interface DashboardProps {
  members: Member[];
  transactions: Transaction[];
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: (record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
  userRole: Role;
  currentUser: User;
  missionFields: MissionField[]
  ebdStudents: EBDStudent[]
  ebdAttendances: EBDAttendance[]
  residenceServices: ResidenceService[]
  onUpdateResidenceServiceStatus: (id: string, status: ResidenceService['status'], isRead?: boolean) => Promise<any>
  unreadPrayers?: PrayerRequest[]
  onUpdatePrayerStatus?: (id: string, isRead: boolean) => Promise<any>
}

const Dashboard: React.FC<DashboardProps> = ({ members, transactions, attendanceRecords, setAttendanceRecords, userRole,
  currentUser,
  missionFields,
  ebdStudents,
  ebdAttendances,
  residenceServices,
  onUpdateResidenceServiceStatus,
  unreadPrayers = [],
  onUpdatePrayerStatus
}) => {
  const isManager = userRole === 'Admin' || userRole === 'Secretaria';

  // Removed unused local states: isSaving, newAttendance (now in VisitorRegistrationModal)
  const [selectedStat, setSelectedStat] = useState<'finance' | 'growth' | 'attendance' | 'residence' | 'prayers' | 'baptisms' | 'decisions'>('attendance');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [showRsDetails, setShowRsDetails] = useState(false);
  const [showPrayerDetails, setShowPrayerDetails] = useState(false);
  const [showBaptismDetails, setShowBaptismDetails] = useState(false);
  const [showDecisionDetails, setShowDecisionDetails] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  // Calcula estatísticas de Culto no Lar
  const rsStats = useMemo(() => {
    const now = new Date();
    const completed = residenceServices.filter(rs => rs.status === 'Realizado');

    const weekCount = completed.filter(rs => {
      const d = new Date(rs.serviceDate);
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }).length;

    const monthCount = completed.filter(rs => {
      const d = new Date(rs.serviceDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const yearCount = completed.filter(rs => {
      const d = new Date(rs.serviceDate);
      return d.getFullYear() === now.getFullYear();
    }).length;

    const unreadCount = residenceServices.filter(rs => !rs.isRead).length;

    return { weekCount, monthCount, yearCount, unreadCount };
  }, [residenceServices]);

  const memberData = useMemo(() => {
    return members.find(m => m.name.toLowerCase() === currentUser.name.toLowerCase());
  }, [members, currentUser.name]);

  const stats = useMemo(() => {
    // Legacy support: if status is undefined, treat as confirmed
    const confirmedTransactions = transactions.filter(t => !t.status || t.status === 'Confirmado');
    const pendingTransactions = transactions.filter(t => t.status === 'Pendente');

    const entradas = confirmedTransactions.filter(t => t.type === 'Entrada').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const saidas = confirmedTransactions.filter(t => t.type === 'Saída').reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const pendingEntradas = pendingTransactions.filter(t => t.type === 'Entrada').reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return {
      totalMembers: members.length,
      totalBalance: entradas - saidas,
      pendingBalance: pendingEntradas,
      attendanceCount: attendanceRecords.length
    };
  }, [members, transactions, attendanceRecords]);

  const ageDistribution = useMemo(() => {
    const dist = { 'Crianças': 0, 'Adolescentes': 0, 'Jovens': 0, 'Adultos': 0 };
    members.forEach(m => {
      const cat = m.ageGroup || 'Adulto';
      if (cat === 'Criança' || cat.includes('Criança')) dist['Crianças']++;
      else if (cat === 'Adolescente' || cat.includes('Adolescente')) dist['Adolescentes']++;
      else if (cat === 'Jovem' || cat.includes('Jovem')) dist['Jovens']++;
      else dist['Adultos']++;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [members]);

  const AGE_COLORS = ['#fbbf24', '#6366f1', '#10b981', '#f43f5e'];

  const ebdStudentsPerClass = useMemo(() => {
    const classes: Record<string, number> = {};
    ebdStudents.forEach(s => {
      classes[s.className] = (classes[s.className] || 0) + 1;
    });
    return Object.entries(classes).map(([name, value]) => ({ name, value }));
  }, [ebdStudents]);

  const ebdAttendanceLastSunday = useMemo(() => {
    if (!ebdAttendances || ebdAttendances.length === 0) return { date: null, data: [] };

    // 1. Encontrar a data mais recente
    const dates = ebdAttendances.map(a => a.date);
    dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const lastDate = dates[0]; // Data mais recente (ex: último domingo)

    if (!lastDate) return { date: null, data: [] };

    // 2. Filtrar registros dessa data
    const records = ebdAttendances.filter(a => a.date === lastDate);

    // 3. Somar presença por classe
    const presenceByClass: Record<string, number> = {};
    records.forEach(r => {
      presenceByClass[r.className] = (presenceByClass[r.className] || 0) + (r.presentStudentIds?.length || 0);
    });

    // 4. Formatar para exibição
    return {
      date: new Date(lastDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      data: Object.entries(presenceByClass).map(([name, value]) => ({ name, value })),
      totalStudents: Object.values(presenceByClass).reduce((acc: number, curr: number) => acc + curr, 0)
    };
  }, [ebdAttendances]);

  const monthlyFinancialData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonthIndex = new Date().getMonth();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      const monthIdx = (currentMonthIndex - i + 12) % 12;
      last6Months.push({
        name: months[monthIdx],
        monthNum: monthIdx + 1,
        dizimos: 0,
        ofertas: 0
      });
    }

    transactions.forEach(t => {
      if (!t.transaction_date || t.type !== 'Entrada') return;
      const tDate = new Date(t.transaction_date);
      const tMonth = tDate.getMonth() + 1;
      const item = last6Months.find(m => m.monthNum === tMonth);
      if (item) {
        if (t.category === 'Dízimo') item.dizimos += (t.amount || 0);
        else if (t.category === 'Oferta') item.ofertas += (t.amount || 0);
      }
    });
    return last6Months;
  }, [transactions]);

  const spendingByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'Saída') {
        categories[t.category] = (categories[t.category] || 0) + (t.amount || 0);
      }
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // Aprimoramento: Dados de visitantes por evento (últimos 8) para comparação direta
  const eventsVisitorsData = useMemo(() => {
    return [...attendanceRecords]
      .sort((a, b) => a.date.localeCompare(b.date)) // Ordem cronológica para o gráfico
      .slice(-8)
      .map(r => ({
        name: r.description.length > 15 ? r.description.substring(0, 12) + '...' : r.description,
        total: r.visitors?.length || 0,
        date: new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      }));
  }, [attendanceRecords]);

  const monthlyVisitorsData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    const data = months.map((m, i) => ({ name: m, total: 0, monthNum: i + 1 }));

    attendanceRecords.forEach(record => {
      const d = new Date(record.date);
      if (d.getFullYear() === currentYear) {
        const monthIdx = d.getMonth();
        data[monthIdx].total += (record.visitors?.length || 0);
      }
    });
    const currentMonth = new Date().getMonth();
    return data.slice(0, currentMonth + 1);
  }, [attendanceRecords]);

  const totalEntradas = useMemo(() => (transactions || []).filter(t => t.type === 'Entrada').reduce((acc, curr) => acc + (curr.amount || 0), 0), [transactions]);
  const totalSaidas = useMemo(() => (transactions || []).filter(t => t.type === 'Saída').reduce((acc, curr) => acc + (curr.amount || 0), 0), [transactions]);
  const saldoAtual = totalEntradas - totalSaidas;

  // NOVO: Processamento de Ofertas EBD por Semana e Classe
  const ebdOfferingsData = useMemo(() => {
    const ebdTransactions = transactions.filter(t => t.category === 'EBD' && t.type === 'Entrada' && t.transaction_date);

    const weekMap: Record<string, { name: string, date: Date, [key: string]: any }> = {};
    const allClasses = new Set<string>();

    ebdTransactions.forEach(t => {
      const date = new Date(t.transaction_date!);
      const day = date.getDay();
      const diff = date.getDate() - day;
      const sunday = new Date(date.getFullYear(), date.getMonth(), diff);
      const weekKey = sunday.toISOString().split('T')[0];

      const className = t.location || 'Sem Classe';
      allClasses.add(className);

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = {
          name: `Sem. ${sunday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
          date: sunday
        };
      }
      weekMap[weekKey][className] = (weekMap[weekKey][className] || 0) + (t.amount || 0);
    });

    return {
      chartData: Object.values(weekMap).sort((a, b) => a.date.getTime() - b.date.getTime()),
      classes: Array.from(allClasses)
    };
  }, [transactions]);

  const baptismStats = useMemo(() => {
    const now = new Date();
    const baptisms = members.filter(m => m.baptismDate);

    const monthCount = baptisms.filter(m => {
      if (!m.baptismDate) return false;
      const d = new Date(m.baptismDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const yearCount = baptisms.filter(m => {
      if (!m.baptismDate) return false;
      const d = new Date(m.baptismDate);
      return d.getFullYear() === now.getFullYear();
    }).length;

    const last6MonthsData = [];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonthIndex = now.getMonth();

    for (let i = 5; i >= 0; i--) {
      const monthIdx = (currentMonthIndex - i + 12) % 12;
      const year = now.getFullYear() - (currentMonthIndex - i < 0 ? 1 : 0);

      const count = baptisms.filter(m => {
        if (!m.baptismDate) return false;
        const d = new Date(m.baptismDate);
        return d.getMonth() === monthIdx && d.getFullYear() === year;
      }).length;

      last6MonthsData.push({
        name: months[monthIdx],
        total: count
      });
    }

    return { monthCount, yearCount, totalCount: baptisms.length, last6MonthsData };
  }, [members]);

  // NOVO: Estatísticas de Decisões (Novos Convertidos)
  const decisionStats = useMemo(() => {
    const now = new Date();
    const newConverts = members.filter(m => m.status === 'Novo Convertido');

    const monthCount = newConverts.filter(m => {
      const d = new Date(m.joinDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const yearCount = newConverts.filter(m => {
      const d = new Date(m.joinDate);
      return d.getFullYear() === now.getFullYear();
    }).length;

    // Dados dos últimos 6 meses
    const last6MonthsData = [];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonthIndex = now.getMonth();

    for (let i = 5; i >= 0; i--) {
      const monthIdx = (currentMonthIndex - i + 12) % 12;
      const year = now.getFullYear() - (currentMonthIndex - i < 0 ? 1 : 0);

      const count = newConverts.filter(m => {
        const d = new Date(m.joinDate);
        return d.getMonth() === monthIdx && d.getFullYear() === year;
      }).length;

      last6MonthsData.push({
        name: months[monthIdx],
        decisoes: count
      });
    }

    // Taxa de conversão (decisões / total de visitantes únicos)
    const totalVisitors = attendanceRecords.reduce((acc, curr) => acc + (curr.visitors?.length || 0), 0);
    const conversionRate = totalVisitors > 0 ? ((newConverts.length / totalVisitors) * 100).toFixed(1) : '0.0';

    return {
      monthCount,
      yearCount,
      totalCount: newConverts.length,
      last6MonthsData,
      conversionRate
    };
  }, [members, attendanceRecords]);


  const handleSaveAttendance = async (data: { date: string; description: string; visitors: string[] }) => {
    // setIsSaving is now handled inside VisitorRegistrationModal
    // We just handle the data persistence here
    await setAttendanceRecords(data);
    setIsAttendanceModalOpen(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: ResidenceService['status']) => {
    await onUpdateResidenceServiceStatus(id, newStatus, true);
  };





  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-20 font-sans">
      {memberData && (
        <Card className="bg-gradient-to-r from-red-600 to-red-800 p-5 md:p-6 text-white shadow-2xl flex flex-col md:flex-row items-center gap-4 md:gap-6 animate-fadeIn border-none">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-red-600 text-3xl font-black shadow-lg uppercase">
            {memberData.name.charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-heading font-black italic tracking-tighter leading-tight">Bem-vindo, {memberData.name}!</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
              <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/20">Cargo: {memberData.category}</span>
              <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/20">Local: {memberData.congregacao}</span>
              <span className="bg-emerald-400/20 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-400/20 text-emerald-200">Status: {memberData.status}</span>
            </div>
          </div>
        </Card>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-black text-slate-900 italic tracking-tight">Gestão Estratégica</h2>
          <p className="text-slate-500 font-medium text-sm">Monitoramento em tempo real dos dados ministeriais.</p>
        </div>
        {isManager && (
          <div className="hidden"></div> // Button moved to Recepcao tab
        )}
      </header>

      <SectionHeader title="Gestão de Pessoas" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard
          title="Membros Cadastrados"
          value={members.length.toString()}
          change="Total"
          color="indigo"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />

        <button
          onClick={() => { setSelectedStat('prayers'); setShowPrayerDetails(true); }}
          className={`p-3 md:p-4 rounded-2xl border transition-all duration-300 text-left relative group ${selectedStat === 'prayers' ? 'bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-lg shadow-violet-500/30 border-transparent' : 'bg-white border-slate-100 text-slate-600 hover:border-violet-200 hover:shadow-md'}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-1.5 rounded-lg transition-colors ${selectedStat === 'prayers' ? 'bg-white/20 backdrop-blur-sm' : 'bg-violet-50 text-violet-600'}`}>
              <svg className={`w-4 h-4 ${selectedStat === 'prayers' ? 'text-white' : 'text-violet-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeWidth={2} /></svg>
            </div>
            <p className={`text-[9px] font-black uppercase tracking-widest ${selectedStat === 'prayers' ? 'text-violet-100' : 'text-slate-400'}`}>Orações</p>
          </div>
          <p className="text-xl font-heading font-black italic tracking-tighter">{(unreadPrayers as PrayerRequest[]).length} <span className="text-[8px] opacity-60 font-normal not-italic shrink-0">pend.</span></p>
        </button>

        <button
          onClick={() => { setSelectedStat('baptisms'); setShowBaptismDetails(true); }}
          className={`p-3 md:p-4 rounded-2xl border transition-all duration-300 text-left relative group ${selectedStat === 'baptisms' ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30 border-transparent' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:shadow-md'}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-1.5 rounded-lg transition-colors ${selectedStat === 'baptisms' ? 'bg-white/20 backdrop-blur-sm' : 'bg-blue-50 text-blue-600'}`}>
              <svg className={`w-4 h-4 ${selectedStat === 'baptisms' ? 'text-white' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeWidth={2} /></svg>
            </div>
            <p className={`text-[9px] font-black uppercase tracking-widest ${selectedStat === 'baptisms' ? 'text-blue-100' : 'text-slate-400'}`}>Batismos</p>
          </div>
          <p className="text-xl font-heading font-black italic tracking-tighter">{baptismStats.monthCount} <span className="text-[8px] opacity-60 font-normal not-italic">mês</span></p>
        </button>

        <button
          onClick={() => { setSelectedStat('decisions'); setShowDecisionDetails(true); }}
          className={`p-3 md:p-4 rounded-2xl border transition-all duration-300 text-left relative group ${selectedStat === 'decisions' ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/30 border-transparent' : 'bg-white border-slate-100 text-slate-600 hover:border-amber-200 hover:shadow-md'}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-1.5 rounded-lg transition-colors ${selectedStat === 'decisions' ? 'bg-white/20 backdrop-blur-sm' : 'bg-amber-50 text-amber-600'}`}>
              <svg className={`w-4 h-4 ${selectedStat === 'decisions' ? 'text-white' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeWidth={2} /></svg>
            </div>
            <p className={`text-[9px] font-black uppercase tracking-widest ${selectedStat === 'decisions' ? 'text-amber-100' : 'text-slate-400'}`}>Decisões</p>
          </div>
          <p className="text-xl font-heading font-black italic tracking-tighter">{decisionStats.monthCount} <span className="text-[8px] opacity-60 font-normal not-italic">mês</span></p>
        </button>

        <button
          onClick={() => { setSelectedStat('residence'); setShowRsDetails(true); }}
          className={`p-3 md:p-4 rounded-2xl border transition-all duration-300 text-left relative group ${selectedStat === 'residence' ? 'bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-500/30 border-transparent' : 'bg-white border-slate-100 text-slate-600 hover:border-rose-200 hover:shadow-md'}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-1.5 rounded-lg transition-colors ${selectedStat === 'residence' ? 'bg-white/20 backdrop-blur-sm' : 'bg-rose-50 text-rose-600'}`}>
              <svg className={`w-4 h-4 ${selectedStat === 'residence' ? 'text-white' : 'text-rose-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeWidth={2} /></svg>
            </div>
            <p className={`text-[9px] font-black uppercase tracking-widest ${selectedStat === 'residence' ? 'text-rose-100' : 'text-slate-400'}`}>Culto no Lar</p>
          </div>
          <p className="text-xl font-heading font-black italic tracking-tighter">{rsStats.weekCount} <span className="text-[8px] opacity-60 font-normal not-italic">/sem</span></p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <Card className="p-5 md:p-8 animate-fadeIn">
            <h3 className="font-heading font-black text-slate-800 mb-6 uppercase tracking-widest text-[10px] flex items-center">
              <div className="w-2 h-6 bg-red-600 rounded-full mr-4"></div>
              Distribuição Etária
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ageDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={88}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {ageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                    ))}
                    <Label
                      value={members.length}
                      position="center"
                      fill="#1e293b"
                      dy={-4}
                      style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'Inter' }}
                    />
                    <Label
                      value="TOTAL"
                      position="center"
                      dy={16}
                      fill="#94a3b8"
                      style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.2em' }}
                    />
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Legend
                    iconType="circle"
                    verticalAlign="bottom"
                    align="center"
                    iconSize={8}
                    wrapperStyle={{ paddingTop: '25px', paddingBottom: '10px' }}
                    formatter={(value: string) => (
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider ml-1">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 md:p-8">
            <h3 className="font-heading font-black text-slate-800 uppercase text-[10px] tracking-widest mb-6">Discípulos Recentes</h3>
            <div className="space-y-4">
              {[...members].reverse().slice(0, 4).map((member) => (
                <div key={member.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black mr-4 shadow-sm uppercase">{member.name.charAt(0)}</div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-[11px] font-heading font-black text-slate-800 truncate uppercase tracking-tighter">{member.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{member.category} • {member.ageGroup || 'Adulto'}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <Card className="lg:col-span-3 p-5 md:p-8 animate-fadeIn space-y-8 md:space-y-10">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-slate-800 uppercase tracking-widest text-[10px] flex items-center">
              <div className="w-2 h-6 bg-emerald-500 rounded-full mr-4"></div>
              Fluxo de Visitantes: Comparativo & Evolução
            </h3>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">Total do Ano</p>
              <p className="text-xl font-black text-emerald-600">{attendanceRecords.reduce((acc, curr) => acc + (curr.visitors?.length || 0), 0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[9px] font-heading font-black text-slate-400 uppercase tracking-widest text-center">Quantidade por Culto</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventsVisitorsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 8 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '10px' }}
                    />
                    <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20}>
                      <LabelList dataKey="total" position="top" fontSize={10} fontWeight="black" fill="#64748b" offset={8} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[9px] font-heading font-black text-slate-400 uppercase tracking-widest text-center">Evolução Mensal</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyVisitorsData}>
                    <defs>
                      <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '10px' }}
                    />
                    <Area type="monotone" dataKey="total" name="Visitantes" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVis)">
                      <LabelList dataKey="total" position="top" fontSize={9} fontWeight="bold" fill="#10b981" offset={10} />
                    </Area>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Card>


      </div>

      <SectionHeader title="Ensino e EBD" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          title="Matriculados EBD"
          value={ebdStudents.length.toString()}
          change="Ensino"
          color="indigo"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />

        <button
          onClick={() => setSelectedStat('attendance')}
          className={`p-3 md:p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group ${selectedStat === 'attendance' ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-lg shadow-orange-500/30 border-transparent' : 'bg-white border-slate-100 text-slate-600 hover:border-orange-200 hover:shadow-md'}`}
        >
          <div className="flex justify-between items-baseline mb-2">
            <div className={`p-1.5 rounded-lg transition-colors ${selectedStat === 'attendance' ? 'bg-white/20 backdrop-blur-sm' : 'bg-orange-50 text-orange-600'}`}>
              <svg className={`w-4 h-4 ${selectedStat === 'attendance' ? 'text-white' : 'text-orange-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeWidth={2} /></svg>
            </div>
          </div>
          <p className={`text-[9px] font-black uppercase tracking-widest ${selectedStat === 'attendance' ? 'text-orange-100' : 'text-slate-400'}`}>Presença por Classe</p>
          <div className="mt-1">
            <p className="text-sm font-black italic tracking-tighter">Última Aula: {ebdAttendanceLastSunday.totalStudents || 0} alunos ({ebdAttendanceLastSunday.data.length} classes)</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className="p-5 md:p-8 animate-fadeIn">
          <h3 className="font-heading font-black text-slate-800 mb-6 uppercase tracking-widest text-[10px] flex items-center">
            <div className="w-2 h-6 bg-indigo-600 rounded-full mr-4"></div>
            Alunos EBD por Classe
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ebdStudentsPerClass}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="value" name="Total de Alunos" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40}>
                  <LabelList dataKey="value" position="top" fontSize={10} fontWeight="black" fill="#64748b" offset={8} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* EBD Offerings card follows here in the code... */}

        {/* NOVO: Gráfico de Ofertas EBD por Classe */}
        <Card className="p-5 md:p-8 animate-fadeIn">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <h3 className="font-heading font-black text-slate-800 uppercase tracking-widest text-[10px] flex items-center">
              <div className="w-2 h-6 bg-emerald-600 rounded-full mr-4"></div>
              Desempenho Financeiro EBD: Ofertas por Classe
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visualização Semanal</span>
            </div>
          </div>

          <div className="h-64 md:h-80 w-full font-sans">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ebdOfferingsData.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '12px'
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                  labelStyle={{ color: '#1e293b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: '9px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    paddingTop: '30px'
                  }}
                />
                {ebdOfferingsData.classes.map((className, index) => (
                  <Bar
                    key={className}
                    dataKey={className}
                    name={className}
                    stackId="a"
                    fill={[
                      '#10b981', '#6366f1', '#f59e0b', '#ef4444',
                      '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
                    ][index % 8]}
                    radius={index === ebdOfferingsData.classes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    barSize={40}
                  >
                    {index === ebdOfferingsData.classes.length - 1 && (
                      <LabelList
                        dataKey={(data: any) => {
                          return ebdOfferingsData.classes.reduce((sum: number, cls: string) => sum + (data[cls] || 0), 0);
                        }}
                        position="top"
                        fontSize={10}
                        fontWeight="black"
                        fill="#1e293b"
                        offset={10}
                        formatter={(value: any) => typeof value === 'number' ? `R$ ${value.toLocaleString('pt-BR')}` : value}
                      />
                    )}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <SectionHeader title="Valores e Gestão Financeira" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 animate-fadeIn">
          <h3 className="font-heading font-black text-slate-800 mb-6 uppercase tracking-widest text-[10px] flex items-center">
            <div className="w-2 h-6 bg-emerald-500 rounded-full mr-4"></div>
            Evolução Mensal: Dízimos vs Ofertas
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFinancialData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px' }} />
                <Bar dataKey="dizimos" name="Dízimos" fill="#10b981" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="dizimos" position="top" fontSize={9} fontWeight="black" fill="#10b981" offset={8} />
                </Bar>
                <Bar dataKey="ofertas" name="Ofertas" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="ofertas" position="top" fontSize={9} fontWeight="black" fill="#3b82f6" offset={8} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 animate-fadeIn">
          <h3 className="font-heading font-black text-slate-800 mb-6 uppercase tracking-widest text-[10px] flex items-center">
            <div className="w-2 h-6 bg-red-600 rounded-full mr-4"></div>
            Gastos por Categoria
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={100} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Bar dataKey="value" name="Total Gasto" fill="#ef4444" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="value" position="right" fontSize={10} fontWeight="black" fill="#ef4444" offset={10} formatter={(value: any) => typeof value === 'number' ? `R$ ${value.toLocaleString('pt-BR')}` : value} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {
        showPrayerDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden animate-scaleUp border border-white/20 flex flex-col">
              <div className="bg-gradient-to-br from-violet-900 to-fuchsia-900 p-10 text-white flex justify-between items-center relative overflow-hidden shadow-lg z-10">
                <div className="relative z-10">
                  <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Intercessão</h3>
                  <p className="text-3xl font-heading font-black italic tracking-tighter leading-none text-white drop-shadow-sm">Pedidos de Oração</p>
                </div>
                <button onClick={() => setShowPrayerDetails(false)} className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-6">
                {unreadPrayers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-60">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nenhum pedido pendente</p>
                  </div>
                ) : (
                  (unreadPrayers as PrayerRequest[]).map(prayer => (
                    <Card key={prayer.id} className="p-6 bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-heading font-black text-slate-800 uppercase tracking-tight mb-2">{prayer.userName}</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">{prayer.content}</p>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{prayer.timestamp}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => onUpdatePrayerStatus && onUpdatePrayerStatus(prayer.id, true)}
                        className="h-10 px-4 bg-slate-900 shadow-none text-white rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        Lido
                      </Button>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      }
      {
        showRsDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden animate-scaleUp border border-white/20 flex flex-col">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 p-10 text-white flex justify-between items-center relative overflow-hidden shadow-lg z-10">
                <div className="absolute top-0 right-0 p-6 opacity-[0.08]">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                </div>
                <div className="relative z-10">
                  <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Pastoral de Lar</h3>
                  <p className="text-3xl font-heading font-black italic tracking-tighter leading-none text-white drop-shadow-sm">Cultos no Lar</p>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-3">Gestão de Visitas e Edificação</p>
                </div>
                <button onClick={() => setShowRsDetails(false)} className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-6">
                {residenceServices.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-60">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeWidth={2} /></svg>
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nenhuma solicitação encontrada</p>
                  </div>
                ) : (
                  residenceServices.map(rs => (
                    <Card key={rs.id} className={`p-6 flex flex-col md:flex-row gap-6 items-start md:items-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${!rs.isRead ? 'border-rose-100 shadow-[0_4px_20px_-5px_rgba(225,29,72,0.1)] bg-white ring-1 ring-rose-50' : 'bg-slate-50 border-slate-100 opacity-80 hover:opacity-100'}`}>
                      <div className="flex-1 space-y-4 w-full">
                        <div className="flex items-center gap-5">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg transition-transform hover:scale-105 ${!rs.isRead ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-200' : 'bg-white text-slate-300 border border-slate-100'}`}>
                            {rs.memberName.charAt(0)}
                          </div>
                          <div className="flex-1">
                            {!rs.isRead && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black uppercase tracking-widest mb-2 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                Novo
                              </span>
                            )}
                            <h4 className={`text-xl font-heading font-black tracking-tight ${!rs.isRead ? 'text-slate-800' : 'text-slate-500'}`}>{rs.memberName}</h4>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2 pl-2">
                          <div className="flex items-center gap-3 text-slate-500 font-medium bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2} /></svg>
                            </div>
                            {new Date(rs.serviceDate).toLocaleDateString('pt-BR')} <span className="text-slate-300">|</span> {rs.serviceTime}
                          </div>
                          <div className="flex items-center gap-3 text-slate-500 font-medium bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth={2} /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2} /></svg>
                            </div>
                            <span className="truncate">{rs.address}</span>
                          </div>
                        </div>

                        {/* Phone Actions */}
                        {rs.phone && (
                          <div className="flex gap-2 mt-3 pl-2">
                            <a
                              href={`https://wa.me/55${rs.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                              WhatsApp
                            </a>
                            <a
                              href={`tel:${rs.phone}`}
                              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              Ligar
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[180px] p-2 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="relative group">
                          <select
                            value={rs.status}
                            onChange={(e) => handleUpdateStatus(rs.id, e.target.value as any)}
                            className="w-full h-12 appearance-none pl-4 pr-10 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all cursor-pointer text-slate-700 hover:border-rose-300 shadow-sm"
                          >
                            <option value="Pendente">Aguardando</option>
                            <option value="Confirmado">Confirmar</option>
                            <option value="Realizado">Finalizado</option>
                            <option value="Cancelado">Cancelar</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-rose-500 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                          </div>
                        </div>
                        <Button
                          onClick={() => onUpdateResidenceServiceStatus(rs.id, rs.status, true)}
                          disabled={rs.isRead}
                          className={`h-12 rounded-xl font-bold tracking-wide text-[10px] uppercase shadow-md transition-all ${rs.isRead
                            ? 'bg-slate-200 text-slate-400 shadow-none'
                            : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95'
                            }`}
                        >
                          {rs.isRead ? (
                            <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Lido</span>
                          ) : 'Marcar como Lido'}
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      }
      {showBaptismDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden animate-scaleUp border border-white/20 flex flex-col">
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-10 text-white flex justify-between items-center relative overflow-hidden shadow-lg z-10">
              <div className="relative z-10">
                <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Pessoas Alcançadas</h3>
                <p className="text-3xl font-heading font-black italic tracking-tighter leading-none text-white drop-shadow-sm">Relatório de Batismos</p>
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md border border-white/10">
                  <button
                    onClick={() => {
                      const doc = new jsPDF();
                      doc.setFontSize(18);
                      doc.text('Relatório de Batismos - AD Missionária Canaã', 14, 20);
                      const baptizedMembers = members
                        .filter((m: Member) => m.baptismDate)
                        .sort((a: Member, b: Member) => new Date(b.baptismDate!).getTime() - new Date(a.baptismDate!).getTime());
                      const tableData = baptizedMembers.map((m: Member) => [m.name, new Date(m.baptismDate!).toLocaleDateString('pt-BR'), m.congregacao || 'Sede']);
                      autoTable(doc, {
                        head: [['Nome', 'Data Batismo', 'Congregação']],
                        body: tableData,
                        startY: 30,
                        headStyles: { fillColor: [59, 130, 246] }
                      });
                      doc.save('relatorio_batismos.pdf');
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                    title="Exportar PDF"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeWidth={2} /></svg>
                  </button>
                  <button
                    onClick={() => {
                      const baptizedMembers = members
                        .filter((m: Member) => m.baptismDate)
                        .sort((a: Member, b: Member) => new Date(b.baptismDate!).getTime() - new Date(a.baptismDate!).getTime());
                      const headers = ['Nome', 'Data Batismo', 'Congregação'];
                      const csvContent = [
                        headers.join(','),
                        ...baptizedMembers.map((m: Member) => [`"${m.name}"`, `"${m.baptismDate}"`, `"${m.congregacao || 'Sede'}"`].join(','))
                      ].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = 'relatorio_batismos.csv';
                      link.click();
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                    title="Exportar Excel"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2} /></svg>
                  </button>
                </div>
                <button onClick={() => setShowBaptismDetails(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-white/20 rounded-full hover:bg-slate-100 text-slate-800 transition-all shadow-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-8">
              <Card className="p-6">
                <h4 className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest mb-6">Evolução dos Batismos (6 meses)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={baptismStats.last6MonthsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      />
                      <Bar dataKey="total" name="Batismos" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="total" position="top" fontSize={10} fontWeight="black" fill="#3b82f6" offset={8} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div>
                <h4 className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest mb-4">Batizados Recentemente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members
                    .filter(m => m.baptismDate)
                    .sort((a, b) => new Date(b.baptismDate!).getTime() - new Date(a.baptismDate!).getTime())
                    .slice(0, 10)
                    .map(member => (
                      <Card key={member.id} className="p-4 flex items-center gap-4 bg-white border border-slate-100 shadow-sm">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl uppercase">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-heading font-black text-slate-800 uppercase tracking-tight truncate">{member.name}</h5>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Batizado em: {new Date(member.baptismDate!).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </Card>
                    ))}
                  {members.filter(m => m.baptismDate).length === 0 && (
                    <div className="col-span-full py-10 text-center opacity-50 italic text-sm">
                      Nenhum batismo registrado ainda.
                    </div>
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

export default Dashboard;
