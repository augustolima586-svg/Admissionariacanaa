import React, { useState, useEffect, useMemo } from 'react';
import { ViewType, Role, Reminder, Notice, User, MissionField, Member, ResidenceService } from '../types';
import ClusteredMap from './ClusteredMap';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';



interface AppMembroProps {
  onNavigate: (view: any) => void;
  userRole: string;
  currentUser: User;
  reminders: Reminder[];
  onSendPrayer: (p: any) => Promise<any>;
  onSaveReminder: (r: any) => Promise<any>;
  onDeleteReminder: (id: string) => Promise<any>;
  onSaveTransaction: (t: any) => Promise<any>;
  notices?: Notice[];
  permanentNotices?: Notice[];
  members?: Member[];
  onSaveNotice?: (n: any) => Promise<any>;
  onDeleteNotice?: (id: string) => Promise<any>;
  onSavePermanentNotice: (notice: any) => Promise<any>;
  onDeletePermanentNotice: (id: string) => Promise<any>;
  residenceServices: ResidenceService[];
  onSaveResidenceService: (rs: any) => Promise<any>;
}

// MAPA GLOBAL COMPONENT (SVG SIMPLIFICADO)


const AppMembro: React.FC<AppMembroProps> = ({
  onNavigate,
  userRole,
  reminders,
  onSendPrayer,
  onSaveReminder,
  onDeleteReminder,
  onSaveTransaction,
  notices,
  permanentNotices,
  members,
  onSaveNotice,
  onDeleteNotice,
  onSavePermanentNotice,
  onDeletePermanentNotice,
  residenceServices,
  onSaveResidenceService,
  currentUser
}) => {
  const [prayer, setPrayer] = useState('');
  const [contribAmount, setContribAmount] = useState('');
  const [contribType, setContribType] = useState<'Dízimo' | 'Oferta'>('Dízimo');
  const [showPixInfo, setShowPixInfo] = useState(false);
  const [showBirthdayWishes, setShowBirthdayWishes] = useState(false);

  // Gestão de Lembretes e Alertas
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [reminderForm, setReminderForm] = useState({ title: '', type: 'Aviso', date: '', time: '', color: 'bg-indigo-600' });
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [lastNotification, setLastNotification] = useState<Reminder | null>(null);

  // Gestão de Mural de Avisos Permanentes
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', date: '', time: '', targetAudience: 'Todos' as any, isPermanent: false, weekday: 'Segunda-feira' });

  // Residence Service State
  const [isRsModalOpen, setIsRsModalOpen] = useState(false);
  const [rsForm, setRsForm] = useState({ memberId: '', memberName: '', address: '', phone: '', serviceDate: '', serviceTime: '', notes: '' });
  const [rsSearch, setRsSearch] = useState('');
  const [showRsResults, setShowRsResults] = useState(false);
  const [isRsSaving, setIsRsSaving] = useState(false);

  // Prayer Request Modal State
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [prayerName, setPrayerName] = useState('');
  const [isPrayerSaving, setIsPrayerSaving] = useState(false);

  const isManager = userRole === 'Admin' || userRole === 'Secretaria';
  const pixKey = 'admcanaa2021@gmail.com';

  useEffect(() => {
    if (isRsModalOpen && currentUser && !rsForm.memberId) {
      // Auto-fill form for current user
      const linkedMember = members?.find(m => m.name === currentUser.name);
      setRsForm(prev => ({
        ...prev,
        memberId: linkedMember?.id || currentUser.id || '',
        memberName: currentUser.name || '',
        phone: linkedMember?.phone || '',
        address: linkedMember ? `${linkedMember.rua}, ${linkedMember.numero}, ${linkedMember.bairro}` : ''
      }));
      setRsSearch(currentUser.name || '');
    }
  }, [isRsModalOpen, currentUser, members, rsForm.memberId]);

  // Simula o recebimento de uma nova notificação prioritária
  useEffect(() => {
    if (reminders.length > 0) {
      const latest = reminders[0];
      if (latest.type === 'Alerta de Culto' || latest.type === 'Urgente') {
        setLastNotification(latest);
        const timer = setTimeout(() => setLastNotification(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [reminders]);

  // Birthday Check Effect
  useEffect(() => {
    if (members && currentUser && currentUser.name) {
      const memberRecord = members.find(m => m.name === currentUser.name);
      if (memberRecord && memberRecord.birthDate) {
        // Simple day/month match to avoid timezone offset issues on exact date
        const birth = new Date(memberRecord.birthDate);
        const birthDay = birth.getUTCDate();
        const birthMonth = birth.getUTCMonth();

        const now = new Date();
        const nowDay = now.getDate();
        const nowMonth = now.getMonth();

        if (birthDay === nowDay && birthMonth === nowMonth) {
          setShowBirthdayWishes(true);
        }
      }
    }
  }, [members, currentUser]);

  const formatDateWithWeekday = (dateStr: string) => {
    if (!dateStr) return 'Recurrente';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Recurrente';
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  // Filter Notices based on User Role/Category
  const filteredNotices = notices?.filter(n => {
    if (n.isPermanent) return false; // exclui avisos permanentes da lista principal
    if (n.targetAudience === 'Todos' || n.targetAudience === 'Geral') return true;
    if (n.targetAudience === 'Liderança' && (userRole === 'Admin' || userRole === 'Secretaria' || userRole === 'Líder')) return true;
    // Fix: Allow viewing notices for 'Jovens' and 'Crianças' for all users (or filter by specific member data if available)
    if (n.targetAudience === 'Jovens' || n.targetAudience === 'Crianças') return true;
    return false;
  }) || [];

  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(contribAmount);
    if (!isNaN(amount) && amount > 0) {
      if (onSaveTransaction) {
        onSaveTransaction({
          type: 'Entrada',
          amount: amount,
          category: contribType,
          location: 'Sede',
          identifiedPerson: currentUser.name,
          notes: `${contribType} via App - ${currentUser.name}`,
          status: 'Pendente'
        });
        alert('Sua fidelidade de R$ ' + amount.toFixed(2) + ' como ' + contribType + ' foi registrada com sucesso! Aguarde a confirmação do tesoureiro.');
        setContribAmount('');
        setShowPixInfo(false);
      } else {
        alert('Erro ao conectar com o sistema financeiro. Tente mais tarde.');
      }
    }
  };

  const handlePrayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayer.trim() || !prayerName.trim()) {
      alert('Por favor, preencha seu nome e o motivo da oração.');
      return;
    }

    setIsPrayerSaving(true);
    try {
      if (onSendPrayer) {
        await onSendPrayer({
          userName: prayerName,
          content: prayer,
          isAnonymous: false
        });
      }
      setPrayer('');
      setPrayerName('');
      setIsPrayerModalOpen(false);
    } catch (error) {
      alert('Erro ao enviar pedido de oração. Tente novamente.');
    } finally {
      setIsPrayerSaving(false);
    }
  };

  useEffect(() => {
    if (isPrayerModalOpen && currentUser && !prayerName) {
      setPrayerName(currentUser.name || '');
    }
  }, [isPrayerModalOpen, currentUser]);

  const handleOpenReminderModal = (rem?: Reminder) => {
    if (rem) {
      setEditingReminder(rem);
      setReminderForm({
        title: rem.title,
        type: rem.type,
        date: rem.date,
        time: rem.time || '',
        color: rem.color
      });
    } else {
      setEditingReminder(null);
      setReminderForm({ title: '', type: 'Aviso', date: '', time: '', color: 'bg-indigo-600' });
    }
    setIsReminderModalOpen(true);
  };

  const handleSubmitReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveReminder) {
      await onSaveReminder({
        id: editingReminder?.id,
        ...reminderForm
      });
      setIsReminderModalOpen(false);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!id) return;
    const confirmDelete = window.confirm('Excluir este informativo permanentemente?');
    if (confirmDelete && onDeleteReminder) {
      try {
        await onDeleteReminder(id);
      } catch (err) {
        console.error("Falha ao processar exclusão no componente:", err);
        alert("Erro ao excluir. Tente novamente.");
      }
    }
  };

  const handleClearAllAlerts = async () => {
    if (reminders.length === 0) {
      setShowNotificationCenter(false);
      return;
    }

    const confirmClear = window.confirm('Deseja realmente limpar todos os alertas da central? Esta ação removerá os registros permanentemente.');
    if (confirmClear && onDeleteReminder) {
      try {
        // Exclui todos os lembretes visíveis na central
        await Promise.all(reminders.map(rem => onDeleteReminder(rem.id)));
        setShowNotificationCenter(false);
      } catch (err) {
        console.error("Erro ao limpar central de notificações:", err);
        alert("Ocorreu um erro ao tentar limpar as notificações.");
      }
    }
  };

  const handleOpenNoticeModal = (notice?: Notice) => {
    if (notice) {
      setEditingNotice(notice);
      setNoticeForm({
        title: notice.title,
        content: notice.content,
        targetAudience: notice.targetAudience,
        priority: notice.priority || 'Normal',
        isPermanent: notice.isPermanent || false,
        time: notice.time || '',
        date: notice.date,
        weekday: notice.weekday || 'Segunda-feira'
      });
    } else {
      setEditingNotice(null);
      setNoticeForm({
        title: '',
        content: '',
        targetAudience: 'Todos',
        priority: 'Normal',
        isPermanent: true,
        time: '',
        date: new Date().toISOString().split('T')[0],
        weekday: 'Segunda-feira'
      });
    }
    setIsNoticeModalOpen(true);
  };

  const handleSubmitNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (noticeForm.isPermanent && onSavePermanentNotice) {
      await onSavePermanentNotice({
        id: editingNotice?.id,
        ...noticeForm
      });
      setIsNoticeModalOpen(false);
    } else if (onSaveNotice) {
      await onSaveNotice({
        id: editingNotice?.id,
        ...noticeForm
      });
      setIsNoticeModalOpen(false);
    }
  };

  const handleDeleteNotice = async (id: string, permanent: boolean = false) => {
    if (!id) return;
    if (window.confirm(`Excluir este aviso ${permanent ? 'permanente' : ''}?`)) {
      if (permanent && onDeletePermanentNotice) {
        await onDeletePermanentNotice(id);
      } else if (onDeleteNotice) {
        await onDeleteNotice(id);
      }
    }
  };

  const handleSubmitRs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRsSaving(true);
    try {
      const error = await onSaveResidenceService({
        ...rsForm,
        memberName: rsForm.memberName || currentUser.name // Ensure name is set even if typed manually
      });
      if (!error) {
        setIsRsModalOpen(false);
        setRsForm({ memberId: '', memberName: '', address: '', phone: '', serviceDate: '', serviceTime: '', notes: '' });
        setRsSearch('');
        alert('Pedido de Culto no Lar enviado com sucesso!');
      } else {
        alert('Erro ao agendar: ' + error.message);
      }
    } finally {
      setIsRsSaving(false);
    }
  };

  const handleSeedMural = async () => {
    const initialNotices = [
      { title: 'Culto de Ensino', content: 'Doutrina e aprendizado da Palavra.', date: '', time: '19:30', targetAudience: 'Todos' as any, isPermanent: true, weekday: 'Segunda-feira' },
      { title: 'Culto de Oração', content: 'Momento de intercessão e clamor.', date: '', time: '19:30', targetAudience: 'Todos' as any, isPermanent: true, weekday: 'Quarta-feira' },
      { title: 'Incendiar', content: 'Movimento jovem e avivamento.', date: '', time: '19:30', targetAudience: 'Jovens' as any, isPermanent: true, weekday: 'Sábado' },
      { title: 'EBD', content: 'Estudo sistemático da Bíblia.', date: '', time: '08:30', targetAudience: 'Todos' as any, isPermanent: true, weekday: 'Domingo' },
      { title: 'Culto da Família', content: 'Participação de toda a família Canaã.', date: '', time: '18:00', targetAudience: 'Todos' as any, isPermanent: true, weekday: 'Domingo' },
    ];

    if (onSavePermanentNotice) {
      for (const notice of initialNotices) {
        await onSavePermanentNotice(notice);
      }
      alert('Mural configurado com sucesso! Os horários foram adicionados.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn pb-10 relative">

      {/* NOVO: TOAST ESTILO SMARTPHONE (IOS/ANDROID) */}
      {lastNotification && (
        <div className="fixed top-6 left-4 right-4 z-[150] animate-fadeIn pointer-events-none">
          <div className="max-w-md mx-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 p-5 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex items-center gap-5 ring-1 ring-white/10 pointer-events-auto">
            <div className={`w-14 h-14 ${lastNotification.color} rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={2.5} /></svg>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">{lastNotification.type}</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Agora</span>
              </div>
              <h4 className="text-sm font-heading font-black text-white tracking-tight leading-none mb-1">{lastNotification.title}</h4>
              <p className="text-[11px] text-slate-400 font-medium">Você tem um novo comunicado oficial.</p>
            </div>
            <button onClick={() => setLastNotification(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
            </button>
          </div>
        </div>
      )}

      {/* BIRTHDAY WISHES BANNER */}
      {showBirthdayWishes && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white max-w-sm w-full rounded-[3rem] p-8 text-center shadow-2xl relative overflow-hidden animate-scaleUp">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-pink-500 to-transparent opacity-20"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-pink-50 rounded-full mx-auto flex items-center justify-center text-4xl shadow-inner mb-6 animate-bounce">
                🎂
              </div>
              <h3 className="text-2xl font-heading font-black text-slate-900 italic tracking-tighter mb-2">Feliz Aniversário!</h3>
              <p className="text-sm font-bold text-slate-500 mb-6">
                Parabéns, {currentUser.name.split(' ')[0]}! 🎉<br />
                A família Canaã celebra sua vida hoje. Que Deus te abençoe ricamente!
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Versículo para você</p>
                <p className="text-xs font-bold text-slate-700 italic">"Ensina-nos a contar os nossos dias para que o nosso coração alcance sabedoria."</p>
                <p className="text-[9px] text-pink-500 mt-1 font-black uppercase">Salmos 90:12</p>
              </div>

              <Button onClick={() => setShowBirthdayWishes(false)} className="w-full bg-pink-600 text-white shadow-pink-200">
                Amém, Obrigado!
              </Button>
            </div>
          </div>
          {/* Confetti Effect (CSS only simple particle simulation could be added here or via library, keeping it clean for now) */}
        </div>
      )}

      {/* CABEÇALHO PREMIUM - REDESIGN REFINADO E PROFISSIONAL */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 p-12 rounded-[4rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] text-white relative overflow-hidden group">
        {/* Elementos Decorativos Abstratos */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-red-600/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>

        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={() => setShowNotificationCenter(true)}
            className="relative p-4 bg-white/5 backdrop-blur-xl rounded-[2rem] hover:bg-white/10 transition-all border border-white/10 shadow-xl group/btn"
          >
            <svg className="w-7 h-7 group-hover/btn:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeWidth={2.5} /></svg>
            {(reminders.length > 0 || filteredNotices.length > 0) && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-full border-4 border-slate-900 text-[10px] font-black flex items-center justify-center shadow-lg">
                {reminders.length + filteredNotices.length}
              </span>
            )}
          </button>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-1 bg-gradient-to-r from-red-500 to-amber-500 rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Bem-vindo(a) de volta</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-black mb-3 italic tracking-tighter leading-tight">
            A Paz do <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-amber-500">Senhor!</span>
          </h2>
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">Portal oficial do membro • Admissionária Canaã</p>

          {/* Versículo do Dia Integrado */}
          {(() => {
            const dailyVerses = [
              { text: "Lâmpada para os meus pés é tua palavra e luz, para o meu caminho.", ref: "Salmos 119:105" },
              { text: "O Senhor é o meu pastor, nada me faltará.", ref: "Salmos 23:1" },
              { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
              { text: "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti.", ref: "Números 6:24-25" },
              { text: "Mil cairão ao teu lado, e dez mil à tua direita, mas não chegará a ti.", ref: "Salmos 91:7" },
              { text: "Alegrei-me quando me disseram: Vamos à casa do Senhor.", ref: "Salmos 122:1" },
              { text: "Pois eu bem sei os planos que tenho para vós, diz o Senhor, planos de paz e não de mal.", ref: "Jeremias 29:11" },
              { text: "Buscai primeiro o Reino de Deus e a sua justiça, e todas estas coisas vos serão acrescentadas.", ref: "Mateus 6:33" }
            ];
            const today = new Date();
            const index = (today.getFullYear() + today.getMonth() + today.getDate()) % dailyVerses.length;
            const selected = dailyVerses[index];

            return (
              <div className="mt-8 p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 max-w-2xl">
                <div className="flex items-start gap-3 mb-3">
                  <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z" /></svg>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white/90 leading-relaxed italic">"{selected.text}"</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-400 mt-2">{selected.ref}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="flex gap-4 mt-12">
            <button
              onClick={() => onNavigate?.(ViewType.IA_ASSISTANT)}
              className="group relative flex-1 h-16 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-2xl shadow-red-900/50 hover:shadow-red-900/70 transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center justify-center gap-3 w-full">
                <svg className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                IA Bíblica
              </span>
            </button>
            <button
              onClick={() => onNavigate?.(ViewType.MIDIA)}
              className="group relative flex-1 h-16 bg-white/5 backdrop-blur-xl border-2 border-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-xl hover:shadow-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center justify-center gap-3 w-full">
                <svg className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" strokeWidth={2.5} /></svg>
                Mídias
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* CENTRAL DE NOTIFICAÇÕES (GAVETA ESTILO SMARTPHONE) */}
      {showNotificationCenter && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xl animate-fadeIn flex justify-end">
          <div className="w-full max-w-sm bg-white h-full shadow-[0_0_80px_rgba(0,0,0,0.2)] animate-slideInRight flex flex-col border-l border-slate-100">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center gap-4 bg-white sticky top-0 z-20">
              <div>
                <h3 className="text-2xl font-heading font-black text-slate-900 italic tracking-tighter">Central</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Notificações</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClearAllAlerts}
                  className="px-5 h-10 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center"
                >
                  Limpar
                </button>
                <button
                  onClick={() => setShowNotificationCenter(false)}
                  className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12" strokeWidth={3} />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 pt-2">
              {/* MERGED LIST: Reminders + Notices */}
              {filteredNotices.map((notice: Notice) => (
                <div key={`notice-${notice.id}`} className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100/50 relative overflow-hidden group hover:bg-white hover:shadow-xl hover:border-red-100/50 transition-all duration-500">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${notice.priority === 'Alta' ? 'bg-red-600' : 'bg-indigo-600'}`}></div>
                  <div className="flex justify-between items-center mb-4">
                    <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${notice.priority === 'Alta' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500 border border-slate-200'} italic`}>
                      {notice.priority === 'Alta' ? 'Urgente' : 'Comunicado'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{notice.time || '19:30'}</span>
                  </div>
                  <h4 className="text-base font-heading font-black text-slate-900 tracking-tighter leading-snug group-hover:text-red-700 transition-colors uppercase italic">{notice.title}</h4>

                  <div className="mt-5 flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-100 shadow-sm inline-flex">
                    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2.5} /></svg>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{formatDateWithWeekday(notice.date)}</span>
                  </div>
                </div>
              ))}

              {reminders.map((rem) => (
                <div key={rem.id} className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100/50 group hover:bg-white hover:shadow-xl hover:border-red-100/50 transition-all duration-500">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${rem.color.replace('bg-', 'bg-')}`}></div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{rem.type}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{rem.time || '19:30'}</span>
                  </div>
                  <h4 className="text-base font-heading font-black text-slate-800 tracking-tighter leading-snug mb-4">{rem.title}</h4>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-100 shadow-sm inline-flex">
                    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2.5} /></svg>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      {rem.date === 'Hoje' || rem.date === 'Amanhã' ? rem.date : (rem.date ? formatDateWithWeekday(rem.date) : 'Recurrente')}
                    </span>
                  </div>
                </div>
              ))}

              {reminders.length === 0 && filteredNotices.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 py-20">
                  <div className="w-16 h-16 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300 shadow-sm mb-6">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeWidth={2} /></svg>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Nenhum alerta pendente</p>
                  <p className="text-[9px] text-slate-300 mt-2 font-bold max-w-[150px] mx-auto">Tudo certo com sua agenda por enquanto!</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* QUADRO DE AVISOS OFICIAL - REDESIGN PROFISSIONAL */}
      {filteredNotices && filteredNotices.length > 0 && (
        <div className="px-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] flex items-center">
              <span className="relative flex h-3 w-3 mr-3 mt-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              Informativos em Destaque
            </h3>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x no-scrollbar">
            {filteredNotices.map((notice: Notice) => (
              <div key={notice.id} className="snap-center min-w-[300px] bg-white p-8 rounded-[2.5rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] border border-slate-50 relative overflow-hidden group transition-all hover:shadow-2xl hover:-translate-y-1">
                <div className={`absolute top - 0 left - 0 w - 2 h - full ${notice.priority === 'Alta' ? 'bg-gradient-to-b from-red-600 to-red-400' : 'bg-gradient-to-b from-indigo-700 to-indigo-500'} `}></div>

                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{notice.targetAudience}</span>
                    <span className="text-[10px] text-slate-900 font-black">{formatDateWithWeekday(notice.date)}</span>
                  </div>
                  {notice.priority === 'Alta' && (
                    <span className="px-3 py-1 bg-red-50 text-red-600 text-[8px] font-black uppercase rounded-full border border-red-100 animate-pulse">Urgente</span>
                  )}
                </div>

                <h4 className="font-heading font-black text-slate-800 text-lg mb-3 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{notice.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{notice.content}</p>

                <div className="mt-6 flex items-center text-[8px] font-black uppercase tracking-widest text-indigo-600">
                  Ver detalhes completa
                  <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth={3} /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 space-y-8 animate-fadeIn">


        {/* MURAL DE AVISOS PERMANENTES - REDESIGN INTUITIVO E PREMIUM */}
        <div className="bg-slate-50/50 p-1 md:p-2 rounded-[3.5rem] border border-slate-100/50">
          <div className="bg-white p-10 rounded-[3rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h3 className="font-black text-slate-900 flex items-center uppercase text-[10px] tracking-[0.25em] mb-2">
                  <div className="w-1.5 h-4 bg-red-600 rounded-full mr-3"></div>
                  Mural da Igreja
                </h3>
                <p className="text-3xl font-heading font-black text-slate-900 italic tracking-tighter">Agenda Permanente</p>
              </div>
              {isManager && (
                <button
                  onClick={() => handleOpenNoticeModal()}
                  className="group relative h-14 px-8 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-red-200 hover:shadow-red-300 transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center gap-3">
                    <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={3} /></svg>
                    Adicionar ao Mural
                  </span>
                </button>
              )}
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(!permanentNotices || permanentNotices.length === 0) && (
                <div className="col-span-full py-16 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-300 shadow-sm mb-6">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeWidth={2} /></svg>
                  </div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">O mural está disponível</p>
                  {isManager && (
                    <>
                      <p className="text-xs text-slate-400 mt-3 mb-8 max-w-xs mx-auto leading-relaxed">Deseja carregar os horários de culto padrão fornecidos pela secretaria?</p>
                      <Button
                        onClick={handleSeedMural}
                        variant="outline"
                        className="px-10 h-14"
                      >
                        Configurar Mural Inicial
                      </Button>

                    </>
                  )}
                </div>
              )}
              {permanentNotices?.map((notice) => (
                <div key={notice.id} className="p-6 bg-white rounded-[2rem] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden group transition-all hover:scale-[1.02] hover:shadow-2xl hover:border-red-100">
                  {/* Accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-amber-500"></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2} /></svg>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Frequência</span>
                        <span className="block text-[9px] font-black text-red-600 uppercase">Semanal</span>
                      </div>
                    </div>

                    <h4 className="font-heading font-black text-lg text-slate-900 mb-2 tracking-tight leading-tight">{notice.title}</h4>

                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                        <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2.5} /></svg>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">{notice.time ? `${notice.time} h` : 'Não definido'}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                        <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2.5} /></svg>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">
                          {notice.weekday ? notice.weekday : (notice.date && !isNaN(new Date(notice.date).getTime()) ? formatDateWithWeekday(notice.date).split(',')[0] : 'Geral')}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{notice.content}</p>
                  </div>

                  {isManager && (
                    <div className="mt-8 pt-6 border-t border-slate-50 flex gap-3">
                      <button onClick={() => handleOpenNoticeModal(notice)} className="flex-1 py-3 bg-slate-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5" strokeWidth={2.5} /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth={2.5} /></svg>
                        Editar
                      </button>
                      <button onClick={() => handleDeleteNotice(notice.id, true)} className="py-3 px-4 bg-slate-50 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SOLICITAÇÃO DE CULTO NO LAR (SECTION) */}
        <div className="bg-white p-10 rounded-[3rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-red-600">
            <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-black text-slate-900 flex items-center justify-center md:justify-start uppercase text-[10px] tracking-[0.25em] mb-2">
                <div className="w-1.5 h-4 bg-red-600 rounded-full mr-3"></div>
                Ministério nos Lares
              </h3>
              <p className="text-3xl font-heading font-black text-slate-900 italic tracking-tighter leading-none mb-3">Culto na sua Residência</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-sm mb-6">Agende um culto em sua casa ou compartilhe um pedido de oração com os intercessores da igreja.</p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsRsModalOpen(true)}
                  className="group relative flex-1 h-14 px-6 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-red-200 hover:shadow-red-300 transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={3} /></svg>
                    Agendar Culto
                  </span>
                </button>

                <button
                  onClick={() => setIsPrayerModalOpen(true)}
                  className="group relative flex-1 h-14 px-6 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-red-200 hover:shadow-red-300 transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeWidth={2.5} /></svg>
                    Pedido de Oração
                  </span>
                </button>
              </div>

            </div>

            <div className="w-full md:w-80 space-y-4">
              <h4 className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest ml-1 italic">Meus Agendamentos</h4>
              <div className="space-y-3">
                {residenceServices?.filter(rs => rs.memberName === currentUser.name).length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Nenhum pedido recente</p>
                  </div>
                ) : (
                  residenceServices.filter(rs => rs.memberName === currentUser.name).slice(0, 2).map(rs => (
                    <div key={rs.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black text-slate-900 uppercase tracking-tighter">{new Date(rs.serviceDate).toLocaleDateString('pt-BR')}</p>
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">{rs.memberName}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">{rs.address.length > 20 ? rs.address.substring(0, 17) + '...' : rs.address}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase ${rs.status === 'Concluído' || rs.status === 'Confirmado' || rs.status === 'Agendado' ? 'bg-emerald-100 text-emerald-700' :
                        rs.status === 'Realizado' ? 'bg-indigo-100 text-indigo-700' :
                          rs.status === 'Cancelado' || rs.status === 'PENDENTE' || rs.status === 'Pendente' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                        }`}>
                        {rs.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>


        {/* LEMBRETES E INFORMATIVOS - REDESIGN PROFISSIONAL */}
        <div className="bg-gradient-to-br from-white to-red-50/30 p-10 rounded-[3rem] shadow-[0_15px_40px_-15px_rgba(185,28,28,0.08)] border border-red-100/50 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-500/5 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-500/5 to-transparent rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="font-black text-slate-900 flex items-center uppercase text-[10px] tracking-[0.25em] mb-1">
                  <div className="w-1.5 h-4 bg-gradient-to-b from-red-600 to-red-700 rounded-full mr-3"></div>
                  Atividade Recente
                </h3>
                <p className="text-2xl font-heading font-black text-slate-900 italic tracking-tighter">Lembretes & Informativos</p>
              </div>
              {isManager && (
                <button
                  onClick={() => handleOpenReminderModal()}
                  className="group relative h-12 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-red-200 hover:shadow-red-300 transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={3} /></svg>
                    Novo Registro
                  </span>
                </button>
              )}
            </div>


            <div className="space-y-4">
              {reminders.length === 0 && (
                <div className="py-10 text-center bg-white/50 rounded-2xl border-2 border-dashed border-red-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sem atividades agendadas</p>
                </div>
              )}
              {reminders.slice(0, 3).map((rem) => (
                <div key={rem.id} className="flex items-center p-5 bg-white rounded-2xl border border-red-50 shadow-sm hover:shadow-lg hover:border-red-100 transition-all group">
                  <div className={`w-12 h-12 ${rem.color} rounded-xl flex items-center justify-center text-white mr-5 shadow-md group-hover:scale-110 transition-transform`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2.5} /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{rem.type}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">{rem.time || 'Horário Geral'}</span>
                    </div>
                    <h4 className="font-heading font-black text-slate-800 text-base mb-1 tracking-tight">{rem.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2} /></svg>
                      <span className="font-black text-slate-700 uppercase tracking-widest leading-none">{formatDateWithWeekday(rem.date)}</span>
                    </div>
                  </div>
                  {isManager && (
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenReminderModal(rem)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Editar">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5" strokeWidth={2.5} /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth={2.5} /></svg>
                      </button>
                      <button onClick={() => handleDeleteReminder(rem.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Excluir">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5} /></svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SEÇÃO DE CONTRIBUIÇÃO (DÍZIMOS E OFERTAS) */}
        {/* SEÇÃO DE CONTRIBUIÇÃO - PREMIUM UI */}
        <div className="bg-white p-10 rounded-[3rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100">
          <div className="mb-10 text-center md:text-left">
            <h3 className="font-black text-slate-900 flex items-center justify-center md:justify-start uppercase text-[10px] tracking-[0.25em] mb-2">
              <div className="w-1.5 h-4 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full mr-3"></div>
              Apoie o Ministério
            </h3>
            <p className="text-3xl font-heading font-black text-slate-900 italic tracking-tighter leading-none mb-3">Dízimos e Ofertas</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Contribua para a expansão do Reino de Deus</p>
          </div>

          <form onSubmit={handleContributeSubmit} className="space-y-8">
            <div className="flex gap-4 p-2 bg-slate-50 rounded-[2rem] border border-slate-100">
              <label className={`flex-1 p-4 rounded-3xl cursor-pointer transition-all flex items-center justify-center font-black uppercase text-[10px] tracking-widest ${contribType === 'Dízimo' ? 'bg-white text-emerald-600 shadow-md ring-1 ring-emerald-100' : 'text-slate-400 hover:bg-white/50'}`}>
                <input type="radio" name="type" value="Dízimo" checked={contribType === 'Dízimo'} onChange={() => { setContribType('Dízimo'); setShowPixInfo(true); }} className="hidden" />
                Dízimo
              </label>
              <label className={`flex-1 p-4 rounded-3xl cursor-pointer transition-all flex items-center justify-center font-black uppercase text-[10px] tracking-widest ${contribType === 'Oferta' ? 'bg-white text-emerald-600 shadow-md ring-1 ring-emerald-100' : 'text-slate-400 hover:bg-white/50'}`}>
                <input type="radio" name="type" value="Oferta" checked={contribType === 'Oferta'} onChange={() => { setContribType('Oferta'); setShowPixInfo(true); }} className="hidden" />
                Oferta
              </label>
            </div>

            {showPixInfo && (
              <div className="animate-fadeIn relative overflow-hidden group">
                {/* Background Glassmorphism Card */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-slate-800 relative z-10 overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-emerald-500/20 transition-all duration-1000"></div>

                  <div className="flex flex-col items-center text-center">
                    {/* PIX Icon & Badge */}
                    <div className="mb-6 flex flex-col items-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center p-3.5 shadow-lg shadow-emerald-500/20 mb-3">
                        <svg viewBox="0 0 512 512" className="w-full h-full text-white fill-current">
                          <path d="M123.6 339c-20 0-36.2-16.2-36.2-36.2V209.2c0-20 16.2-36.2 36.2-36.2h104.2l30 36.2h-134.2v93.6h134.2l-30 36.2H123.6zm264.8-129.8c20 0 36.2 16.2 36.2 36.2V339c0 20-16.2 36.2-36.2 36.2H284.2l-30-36.2h134.2V245.4h-134.2l30-36.2h104.2zM232.05 311.9l23.95-28.9 23.95 28.9-23.95 28.9-23.95-28.9zm0-111.8l23.95-28.9 23.95 28.9-23.95 28.9-23.95-28.9zM304.5 256l28.9-23.95L362.3 256l-28.9 23.95L304.5 256zM149.7 256l28.9-23.95L207.5 256l-28.9 23.95L149.7 256z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Sistema de Pagamentos Instantâneos</span>
                    </div>

                    <div className="w-full h-px bg-slate-800 mb-6"></div>

                    <div className="space-y-1 mb-8 w-full">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chave Pix Ofical (CNPJ)</p>
                      <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex items-center justify-center gap-3 group/key hover:border-emerald-500/30 transition-all cursor-pointer active:scale-95" onClick={() => { navigator.clipboard.writeText(pixKey); setLastNotification({ title: 'Chave Copiada!', type: 'Sucesso', color: 'bg-emerald-600' }); }}>
                        <p className="text-lg font-black text-white tracking-widest leading-none">{pixKey}</p>
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover/key:text-white group-hover/key:bg-emerald-500/20 transition-all">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" strokeWidth={2} /></svg>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest max-w-[240px] leading-relaxed">
                      Após realizar o pagamento, confirme o valor abaixo para registrar em nosso sistema.
                    </p>
                  </div>
                </div>
              </div>
            )}


            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor da Contribuição (R$)</label>
              <Input
                type="number"
                step="0.01"
                required
                className="text-2xl font-black text-emerald-700"
                placeholder="0,00"
                value={contribAmount}
                onChange={e => setContribAmount(e.target.value)}
              />
            </div>

            <button type="submit" className="group relative w-full h-14 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:via-emerald-800 hover:to-emerald-900 text-white rounded-xl font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-emerald-200 hover:shadow-emerald-300 transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth={2.5} /></svg>
                Confirmar e Registrar
              </span>
            </button>

          </form>
        </div>

      </div >

      {
        isReminderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-scaleUp">
              <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 border-b border-slate-800/50 flex justify-between items-center">
                <h3 className="text-white font-heading font-black uppercase tracking-widest text-xs italic">Novo Lembrete / Aviso</h3>
                <button onClick={() => setIsReminderModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5} /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmitReminder} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Evento</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Ex: Culto de Jovens"
                    value={reminderForm.title}
                    onChange={e => setReminderForm({ ...reminderForm, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                    <Input
                      type="text"
                      required
                      placeholder="Ex: Hoje"
                      className="px-6 py-4 bg-slate-50 border-slate-100 rounded-2xl font-black uppercase tracking-[0.15em] text-slate-800 text-[11px] h-14 focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20"
                      value={reminderForm.date}
                      onChange={e => setReminderForm({ ...reminderForm, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horário</label>
                    <Input
                      type="text"
                      placeholder="19:30"
                      className="px-6 py-4 bg-slate-50 border-slate-100 rounded-2xl font-black uppercase tracking-[0.15em] text-slate-800 text-[11px] h-14 focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20"
                      value={reminderForm.time}
                      onChange={e => setReminderForm({ ...reminderForm, time: e.target.value })}
                    />
                  </div>
                </div>


                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Evento</label>
                  <select
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-800 text-sm appearance-none cursor-pointer"
                    value={reminderForm.type}
                    onChange={e => setReminderForm({ ...reminderForm, type: e.target.value })}
                  >
                    <option value="Aviso">Aviso Geral</option>
                    <option value="Culto">Culto Oficial</option>
                    <option value="Evento">Evento Especial</option>
                    <option value="Urgente">Urgente / Importante</option>
                    <option value="Alerta de Culto">Alerta de Culto (Push)</option>
                  </select>
                </div>

                <div className="space-y-2 mb-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor do Card</label>
                  <div className="flex gap-2">
                    {['bg-indigo-600', 'bg-red-600', 'bg-emerald-600', 'bg-slate-800', 'bg-orange-500'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setReminderForm({ ...reminderForm, color })}
                        className={`w-8 h-8 rounded-full ${color} ${reminderForm.color === color ? 'ring-4 ring-slate-200 scale-110' : ''} transition-all`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="group relative w-full h-14 mt-6 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white rounded-xl font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-red-200 hover:shadow-red-300 transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth={2.5} /></svg>
                    Salvar Lembrete
                  </span>
                </button>

              </form>
            </div>
          </div>
        )
      }
      {
        isNoticeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleUp border border-slate-100">
              <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.08]">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z" /></svg>
                </div>
                <div className="relative z-10">
                  <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Central de Comunicados</h3>
                  <p className="text-2xl font-heading font-black italic tracking-tighter leading-none">{editingNotice ? 'Editar Aviso' : 'Novo Mural'}</p>
                </div>
                <button onClick={() => setIsNoticeModalOpen(false)} className="relative z-10 w-12 h-12 p-0 bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center transition-all">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
                </button>
              </div>

              <form onSubmit={handleSubmitNotice} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Título do Aviso</label>
                    <input
                      type="text"
                      required
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300"
                      placeholder="Ex: Culto da Família"
                      value={noticeForm.title}
                      onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{noticeForm.isPermanent ? 'Dia da Semana' : 'Data do Evento'}</label>
                      {noticeForm.isPermanent ? (
                        <select
                          className="w-full px-8 h-14 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-slate-800 text-xs uppercase tracking-widest appearance-none cursor-pointer focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all"
                          value={noticeForm.weekday}
                          onChange={e => setNoticeForm({ ...noticeForm, weekday: e.target.value })}
                        >
                          {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type="date"
                          required
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 text-xs focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20"
                          value={noticeForm.date}
                          onChange={e => setNoticeForm({ ...noticeForm, date: e.target.value })}
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horário</label>
                      <Input
                        type="time"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 text-xs focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20"
                        value={noticeForm.time}
                        onChange={e => setNoticeForm({ ...noticeForm, time: e.target.value })}
                      />
                    </div>
                  </div>


                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Público Alvo</label>
                    <select
                      className="w-full px-8 h-16 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-slate-800 text-xs uppercase tracking-widest appearance-none cursor-pointer focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all"
                      value={noticeForm.targetAudience}
                      onChange={e => setNoticeForm({ ...noticeForm, targetAudience: e.target.value as any })}
                    >
                      <option value="Todos">🕊️ Todos os Membros</option>
                      <option value="Liderança">👑 Apenas Liderança</option>
                      <option value="Jovens">🔥 Geração Eleita (Jovens)</option>
                      <option value="Crianças">🎨 Crianças (Kids)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Descrição do Aviso</label>
                    <textarea
                      className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-black text-slate-800 text-sm h-32 resize-none focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300"
                      placeholder="Descreva detalhes do aviso..."
                      value={noticeForm.content}
                      onChange={e => setNoticeForm({ ...noticeForm, content: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <input
                    type="checkbox"
                    id="isPermanent"
                    className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-600"
                    checked={noticeForm.isPermanent}
                    onChange={e => setNoticeForm({ ...noticeForm, isPermanent: e.target.checked })}
                  />
                  <label htmlFor="isPermanent" className="text-[10px] font-black text-indigo-900 uppercase tracking-widest cursor-pointer">Definir como Aviso Permanente (Mural)</label>
                </div>

                <button
                  type="submit"
                  className="group relative w-full h-16 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white rounded-xl font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-red-200 hover:shadow-red-300 transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth={3} /></svg>
                    {editingNotice ? 'Confirmar Alterações' : 'Publicar no Mural'}
                  </span>
                </button>

              </form>
            </div>
          </div>
        )
      }
      {
        isRsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleUp border border-slate-100">
              <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.08]">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                </div>
                <div className="relative z-10">
                  <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Agenda Ministerial</h3>
                  <p className="text-3xl font-heading font-black italic tracking-tighter leading-none">Culto no Lar</p>
                </div>
                <Button onClick={() => setIsRsModalOpen(false)} className="relative z-10 w-12 h-12 p-0 bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
                </Button>

              </div>

              <form onSubmit={handleSubmitRs} className="p-10 space-y-8">
                <div className="space-y-6">
                  {/* Busca de Membro */}
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Membro Solicitante</label>
                    <Input
                      type="text"
                      required={!rsForm.memberId}
                      className="pl-12"
                      placeholder="Pesquise o nome do membro..."
                      value={rsSearch}
                      onChange={(e) => {
                        setRsSearch(e.target.value);
                        setShowRsResults(true);
                      }}
                      onFocus={() => setShowRsResults(true)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none top-6">
                      <svg className="w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2} /></svg>
                    </div>


                    {showRsResults && rsSearch.length > 2 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 max-h-60 overflow-y-auto animate-fadeIn">
                        {members?.filter(m => m.name.toLowerCase().includes(rsSearch.toLowerCase())).length === 0 ? (
                          <div className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum membro encontrado</div>
                        ) : (
                          members?.filter(m => m.name.toLowerCase().includes(rsSearch.toLowerCase())).map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setRsForm({ ...rsForm, memberId: m.id, memberName: m.name });
                                setRsSearch(m.name);
                                setShowRsResults(false);
                              }}
                              className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
                            >
                              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm uppercase">
                                {m.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800">{m.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.category} • {m.congregacao}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {rsForm.memberId && !showRsResults && (
                      <div className="mt-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 animate-fadeIn">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth={3} /></svg>
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Membro Vinculado: {rsForm.memberName}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço do Local</label>
                    <div className="relative group">
                      <Input
                        type="text"
                        required
                        className="pl-12"
                        placeholder="Rua, Número, Bairro"
                        value={rsForm.address}
                        onChange={e => setRsForm({ ...rsForm, address: e.target.value })}
                      />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth={2} /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2} /></svg>
                      </div>
                    </div>

                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone para Contato</label>
                    <div className="relative group">
                      <Input
                        type="tel"
                        required
                        className="pl-12"
                        placeholder="(00) 00000-0000"
                        value={rsForm.phone}
                        onChange={e => setRsForm({ ...rsForm, phone: e.target.value })}
                      />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeWidth={2} /></svg>
                      </div>
                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Sugerida</label>
                      <input
                        type="date"
                        required
                        className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-slate-800 text-sm focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600/20 outline-none transition-all"
                        value={rsForm.serviceDate}
                        onChange={e => setRsForm({ ...rsForm, serviceDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horário</label>
                      <input
                        type="time"
                        required
                        className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-slate-800 text-sm focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600/20 outline-none transition-all"
                        value={rsForm.serviceTime}
                        onChange={e => setRsForm({ ...rsForm, serviceTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações / Motivo</label>
                    <textarea
                      className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-bold text-slate-800 text-sm h-32 resize-none focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300"
                      placeholder="Ex: Aniversário, enfermidade, ação de graças..."
                      value={rsForm.notes}
                      onChange={e => setRsForm({ ...rsForm, notes: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRsSaving}
                  className="group relative w-full h-16 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white rounded-xl font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-red-200 hover:shadow-red-300 transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth={3} /></svg>
                    {isRsSaving ? 'Enviando Pedido...' : 'Confirmar Agendamento'}
                  </span>
                </button>

              </form>
            </div>
          </div>
        )
      }

      {/* MODAL DE PEDIDO DE ORAÇÃO - DEDICADO E PREMIUM */}
      {/* MODAL DE PEDIDO DE ORAÇÃO - DEDICADO E PREMIUM */}
      {isPrayerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleUp border border-slate-100">
            <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.08]">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <div className="relative z-10">
                <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Intercessão</h3>
                <p className="text-3xl font-heading font-black italic tracking-tighter leading-none">Pedido de Oração</p>
              </div>
              <button onClick={() => setIsPrayerModalOpen(false)} className="relative z-10 w-12 h-12 p-0 bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center transition-all">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
              </button>
            </div>

            <form onSubmit={handlePrayerSubmit} className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Nome</label>
                  <Input
                    type="text"
                    required
                    className="pl-6"
                    placeholder="Digite seu nome completo"
                    value={prayerName}
                    onChange={(e) => setPrayerName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo da Oração</label>
                  <textarea
                    required
                    className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-bold text-slate-800 text-sm h-40 resize-none focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Descreva aqui o seu motivo para oração..."
                    value={prayer}
                    onChange={(e) => setPrayer(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPrayerSaving}
                className="group relative w-full h-16 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white rounded-xl font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-red-200 hover:shadow-red-300 transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeWidth={3} /></svg>
                  {isPrayerSaving ? 'Enviando...' : 'Enviar Pedido'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div >
  );
};

export default AppMembro;
