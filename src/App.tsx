
import React, { useState, useEffect, useCallback } from 'react';
import ResponsiveNav from './components/ResponsiveNav';
import Dashboard from './components/Dashboard';
import Secretaria from './components/Secretaria';
import Tesouraria from './components/Tesouraria';
import CampoMissionario from './components/CampoMissionario';
import Midia from './components/Midia';
import AppMembro from './components/AppMembro';
import AITools from './components/AITools';
import Login from './components/Login';
import Settings from './components/Settings';
import EBD from './components/EBD';
import Historia from './components/Historia';
import Recepcao from './components/Recepcao';
import { ViewType, User, Member, Transaction, Role, AttendanceRecord, MissionField, Reminder, EBDStudent, EBDAttendance, EBDClass, PrayerRequest, Notice, ResidenceService, MediaItem } from './types';
import { supabase } from './services/supabase';
import { syncService } from './services/syncService';

const App: React.FC = () => {
  const [user, setUser] = useState<User>({ id: '', name: '', role: 'Membro', isAuthenticated: false });
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [appLogo, setAppLogo] = useState('https://i.postimg.cc/s2QxyHH7/Logo_01.png');

  const [members, setMembers] = useState<Member[]>([]);
  const [missionFields, setMissionFields] = useState<MissionField[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [ebdStudents, setEbdStudents] = useState<EBDStudent[]>([]);
  const [ebdAttendances, setEbdAttendances] = useState<EBDAttendance[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [unreadPrayers, setUnreadPrayers] = useState<PrayerRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [permanentNotices, setPermanentNotices] = useState<Notice[]>([]);
  const [residenceServices, setResidenceServices] = useState<ResidenceService[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [ebdClasses, setEbdClasses] = useState<EBDClass[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncs, setPendingSyncs] = useState(0);
  const [managerToast, setManagerToast] = useState<{ title: string, content: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const { data: mData } = await supabase.from('members').select('*').order('name');
      if (mData) {
        setMembers(mData.map(m => ({
          ...m,
          ageGroup: m.age_group,
          joinDate: m.join_date,
          baptismDate: m.baptism_date,
          birthDate: m.birth_date,
          contributions: 0
        })));
      }

      const { data: fData } = await supabase.from('mission_fields').select('*').order('name');
      if (fData) setMissionFields(fData);

      const { data: tData = [] } = await supabase.from('transactions').select('*').order('transaction_date', { ascending: false });
      if (tData) setTransactions(tData.map(t => ({
        ...t,
        date: new Date(t.transaction_date).toLocaleString('pt-BR'),
        identifiedPerson: t.identified_person,
        auditUser: t.audit_user
      })));

      const { data: rData } = await supabase.from('reminders').select('*').order('created_at', { ascending: false });
      if (rData) setReminders(rData.map(r => ({
        id: String(r.id),
        title: r.title,
        type: r.type,
        color: r.color,
        date: r.display_date,
        time: r.event_time
      })));

      try {
        // Tentativa de buscar com JOIN para garantir que temos o nome da classe, caso o vínculo seja por ID
        // O Supabase mapeia o join como um objeto aninhado. Ex: ebd_classes: { name: '...' }
        const { data: sData, error: sError } = await supabase
          .from('ebd_students')
          .select('*, ebd_classes(name)')
          .order('name');

        if (sError) {
          console.error("Erro CRÍTICO ao carregar EBD Students:", sError);
          setManagerToast({
            title: 'Erro de Dados EBD',
            content: `Falha ao carregar alunos: ${sError.message}`
          });
        } else if (sData) {
          setEbdStudents(sData.map(s => {
            // Se class_name vier vazio, tenta pegar do join
            let className = s.class_name;
            // @ts-ignore - Supabase join keys might not be fully typed automatically without generic injection
            if (!className && s.ebd_classes && s.ebd_classes.name) {
              // @ts-ignore
              className = s.ebd_classes.name;
            }

            return {
              ...s,
              ageGroup: s.age_group,
              className: className || 'Sem Classe', // Fallback visual
              enrollmentDate: s.enrollment_date
            };
          }));
        }
      } catch (err) {
        console.error("Exceção não tratada ao carregar EBD Students:", err);
      }

      try {
        const { data: ebdAttData } = await supabase.from('ebd_attendances').select('*').order('date', { ascending: false });
        if (ebdAttData) setEbdAttendances(ebdAttData.map(a => ({ ...a, className: a.class_name, presentStudentIds: a.present_student_ids })));
      } catch (err) { console.error("Erro EBD Attendances:", err); }

      try {
        const { data: cData } = await supabase.from('ebd_classes').select('*').order('name');
        if (cData) setEbdClasses(cData.map(c => {
          let tName = c.teacher_name || c.teacher || '';
          return {
            ...c,
            teacherName: tName,
            ageGroupCriterion: c.age_group_criterion
          };
        }));
      } catch (err) { console.error("Erro EBD Classes:", err); }

      try {
        const { data: aData } = await supabase
          .from('attendance_records')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });
        if (aData) setAttendanceRecords(aData);
      } catch (err) { console.error("Erro Attendance Records:", err); }

      try {
        const { data: pData } = await supabase.from('prayer_requests').select('*').eq('is_read', false).order('created_at', { ascending: false });
        if (pData) setUnreadPrayers(pData.map(p => ({
          id: p.id,
          userName: p.user_name,
          content: p.content,
          timestamp: new Date(p.created_at).toLocaleString('pt-BR')
        })));
      } catch (err) { console.error("Erro Prayer Requests:", err); }

      try {
        const { data: nData } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
        if (nData) {
          setNotices(nData.map(n => ({
            id: n.id,
            title: n.title,
            content: n.content,
            date: n.date || n.created_at,
            time: n.time || '',
            targetAudience: n.target_audience,
            priority: n.priority || 'Normal',
            isPermanent: n.is_permanent || false
          })));
        }
      } catch (err) { console.error("Erro Notices:", err); }

      try {
        const { data: pnData } = await supabase.from('permanent_notices').select('*').order('created_at', { ascending: false });
        if (pnData) {
          const mapped = pnData.map(n => ({
            id: n.id,
            title: n.title,
            content: n.content,
            date: n.date,
            time: n.time,
            targetAudience: n.target_audience || 'Todos',
            isPermanent: true,
            weekday: n.weekday
          }));
          setPermanentNotices(mapped);
        }
      } catch (err) { console.error("Erro Permanent Notices:", err); }

      try {
        const { data: rsData } = await supabase.from('residence_services').select('*').order('created_at', { ascending: false });
        if (rsData) {
          setResidenceServices(rsData.map(rs => ({
            id: rs.id,
            memberId: rs.member_id,
            memberName: rs.member_name,
            phone: rs.phone,
            address: rs.address,
            serviceDate: rs.service_date,
            serviceTime: rs.service_time,
            notes: rs.notes,
            status: rs.status,
            isRead: rs.is_read,
            created_at: rs.created_at
          })));
        }
      } catch (err) { console.error("Erro Residence Services:", err); }

      try {
        const { data: mData } = await supabase.from('media_items').select('*').order('created_at', { ascending: false });
        if (mData) {
          setMediaItems(mData);
        }
      } catch (err) { console.error("Erro Media Items:", err); }
    } catch (error) {
      console.error("Audit Critical: Falha na sincronização:", error);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleOnline = () => {
      setIsOnline(true);
      syncService.syncAll().then(() => {
        setPendingSyncs(syncService.getQueueSize());
        loadData();
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setPendingSyncs(syncService.getQueueSize());
    }, 3000);

    const globalChannel = supabase
      .channel('system_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prayer_requests' }, (payload) => {
        console.log('Prayer Update', payload);
        loadData();
        if (payload.eventType === 'INSERT' && (user.role === 'Admin' || user.role === 'Secretaria')) {
          const newPrayer = payload.new as any;
          setManagerToast({
            title: 'Novo Pedido de Oração',
            content: `${newPrayer.user_name}: ${newPrayer.content.substring(0, 50)}${newPrayer.content.length > 50 ? '...' : ''}`
          });
          setTimeout(() => setManagerToast(null), 6000);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'residence_services' }, () => { console.log('Residence Update'); loadData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_fields' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ebd_students' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ebd_attendances' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'permanent_notices' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'residence_services' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_items' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ebd_classes' }, () => loadData())
      .subscribe();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      supabase.removeChannel(globalChannel);
    };
  }, [loadData, user.isAuthenticated]);

  const handleSaveMember = async (m: Omit<Member, 'id' | 'contributions'>) => {
    const payload = {
      name: m.name,
      email: m.email,
      phone: m.phone,
      status: m.status,
      category: m.category,
      congregacao: m.congregacao || 'Sede',
      age_group: m.ageGroup,
      join_date: m.joinDate,
      baptism_date: m.baptismDate || null,
      birth_date: m.birthDate || null,
      rua: m.rua || null,
      numero: m.numero || null,
      bairro: m.bairro || null,
      cep: m.cep || null,
      password: m.password
    };

    if (!isOnline) {
      syncService.enqueue('members', 'INSERT', payload);
      setPendingSyncs(syncService.getQueueSize());
      alert('Modo Offline: Membro salvo localmente e será sincronizado quando houver internet.');
      // Local optimistic update
      setMembers(prev => [{ ...m, id: 'temp-' + Date.now(), contributions: 0 } as Member, ...prev]);
      return null;
    }

    const { error } = await supabase.from('members').insert([payload]);
    if (!error) loadData();
    return error;
  };

  const handleUpdateMember = async (id: string, m: Partial<Member>) => {
    const payload: any = { ...m };
    if (m.ageGroup) payload.age_group = m.ageGroup;
    if (m.joinDate) payload.join_date = m.joinDate;
    if (m.baptismDate !== undefined) payload.baptism_date = m.baptismDate || null;
    if (m.birthDate !== undefined) payload.birth_date = m.birthDate || null;

    delete payload.ageGroup;
    delete payload.joinDate;
    delete payload.baptismDate;
    delete payload.birthDate;
    delete payload.contributions;
    delete payload.id;

    const { error } = await supabase.from('members').update(payload).eq('id', id);
    if (!error) loadData();
    return error;
  };

  const handleSaveReminder = async (r: Partial<Reminder>) => {
    const payload = {
      title: r.title,
      type: r.type,
      color: r.color,
      display_date: r.date,
      event_time: r.time
    };

    if (!isOnline) {
      syncService.enqueue('reminders', r.id ? 'UPDATE' : 'INSERT', r.id ? { ...payload, id: r.id } : payload);
      setPendingSyncs(syncService.getQueueSize());
      alert('Aviso salvo localmente (Offline).');
      // Optimistic logic would go here but simpler to wait for sync
      return;
    }

    if (r.id) {
      const { error } = await supabase.from('reminders').update(payload).eq('id', r.id);
      if (!error) loadData();
    } else {
      const { error } = await supabase.from('reminders').insert([payload]);
      if (!error) loadData();
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!id) return;

    // Atualização otimista: remove do estado local imediatamente tratando como string para comparação segura
    const reminderIdToDelete = String(id);
    setReminders(prev => prev.filter(r => String(r.id) !== reminderIdToDelete));

    try {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) {
        console.error("Erro ao deletar lembrete no Supabase:", error);
        alert(`Erro ao excluir: ${error.message}`);
        await loadData(); // Reverte a UI em caso de erro real no banco
      }
    } catch (err) {
      console.error("Falha ao deletar lembrete:", err);
      await loadData();
    }
  };

  const handleSaveEBDStudent = async (student: EBDStudent) => {
    const payload = {
      name: student.name,
      age_group: student.ageGroup,
      class_name: student.className,
      enrollment_date: student.enrollmentDate
    };
    const { error } = await supabase.from('ebd_students').insert([payload]);
    if (!error) loadData();
    return error;
  };

  const handleSaveEBDAttendance = async (attendance: EBDAttendance) => {
    const payload = {
      date: attendance.date,
      class_name: attendance.className,
      present_student_ids: attendance.presentStudentIds
    };
    const { error } = await supabase.from('ebd_attendances').insert([payload]);
    return error;
  };

  const handleSaveEBDClass = async (cls: EBDClass) => {
    const payload: any = {
      name: cls.name,
      teacher_name: cls.teacherName,
      age_group_criterion: cls.ageGroupCriterion,
      description: cls.description
    };

    let error;
    if (cls.id && !cls.id.includes('.')) { // Simple check for real ID
      const { error: err } = await supabase.from('ebd_classes').update(payload).eq('id', cls.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('ebd_classes').insert([payload]);
      error = err;
    }
    if (!error) loadData();
    return error;
  };

  const handleDeleteEBDClass = async (id: string) => {
    const { error } = await supabase.from('ebd_classes').delete().eq('id', id);
    if (!error) loadData();
    return error;
  };

  const handleSaveAppTransaction = async (t: Omit<Transaction, 'id' | 'date' | 'auditUser'>) => {
    const payload = {
      type: t.type,
      amount: t.amount,
      category: t.category,
      location: t.location || 'Sede',
      identified_person: t.identifiedPerson || null,
      notes: t.notes || null,
      transaction_date: new Date().toISOString(),
      audit_user: user.name || 'Sistema',
      status: 'Pendente' // All entries from individual apps start as pending
    };

    if (!isOnline) {
      syncService.enqueue('transactions', 'INSERT', payload);
      setPendingSyncs(syncService.getQueueSize());
      alert('Contribuição registrada localmente. Ficará pendente de confirmação pelo financeiro.');
      return null;
    }

    const { error } = await supabase.from('transactions').insert([payload]);
    if (!error) loadData();
    return error;
  };

  const handleConfirmTransaction = async (id: string) => {
    if (!isOnline) {
      // Offline support for confirmation is complex (order matters), but let's queue it
      syncService.enqueue('transactions', 'UPDATE', { id, status: 'Confirmado' });
      setPendingSyncs(syncService.getQueueSize());
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'Confirmado' } : t));
      return;
    }

    const { error } = await supabase.from('transactions').update({ status: 'Confirmado' }).eq('id', id);
    if (error) {
      alert('Erro ao confirmar lançamento: ' + error.message);
    } else {
      loadData();
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!isOnline) {
      syncService.enqueue('transactions', 'DELETE', { id });
      setPendingSyncs(syncService.getQueueSize());
      setTransactions(prev => prev.filter(t => t.id !== id));
      return;
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir lançamento: ' + error.message);
    } else {
      loadData();
    }
  };



  const handleSaveMissionField = async (field: Omit<MissionField, 'id' | 'converts' | 'members'>) => {
    // Only send fields that exist in the Supabase schema
    const payload = {
      name: field.name,
      leader: field.leader,
      status: field.status || 'Implantação',
      progress: field.progress || 0
    };

    if (!isOnline) {
      syncService.enqueue('mission_fields', 'INSERT', payload);
      setPendingSyncs(syncService.getQueueSize());
      alert('Campo Missionário salvo localmente. Será sincronizado quando houver internet.');
      // Update local state optimistically
      setMissionFields(prev => [{ ...payload, id: 'temp-' + Date.now(), members: [] } as MissionField, ...prev]);
      return null;
    }

    console.log("Attempting to insert mission field:", payload);
    const { data, error } = await supabase.from('mission_fields').insert([payload]).select();
    console.log("Mission field insert result:", { data, error });

    if (error) {
      console.error("Erro ao salvar campo no Supabase:", error);
      alert('Erro ao salvar campo missionário: ' + error.message);
    } else {
      await loadData();
    }
    return error;
  };

  const handleUpdateMissionField = async (id: string, updates: Partial<MissionField>) => {
    if (!isOnline) {
      syncService.enqueue('mission_fields', 'UPDATE', { ...updates, id });
      setPendingSyncs(syncService.getQueueSize());
      // Optimistic local update
      setMissionFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      return null;
    }

    const { error } = await supabase.from('mission_fields').update(updates).eq('id', id);
    if (!error) loadData();
    return error;
  };

  const handleDeleteMissionField = async (id: string) => {
    if (!isOnline) {
      syncService.enqueue('mission_fields', 'DELETE', { id });
      setPendingSyncs(syncService.getQueueSize());
      setMissionFields(prev => prev.filter(f => f.id !== id));
      return;
    }

    const { error } = await supabase.from('mission_fields').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir campo missionário: ' + error.message);
    } else {
      loadData();
    }
  };

  const handleSaveNotice = async (notice: any) => {
    const payload = {
      title: notice.title,
      content: notice.content || '',
      target_audience: notice.targetAudience,
      priority: notice.priority || 'Normal',
      is_permanent: notice.isPermanent || false,
      time: notice.time || '',
      date: notice.date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    let query;
    if (notice.id) {
      query = supabase.from('notices').update(payload).eq('id', notice.id);
    } else {
      query = supabase.from('notices').insert([payload]);
    }

    const { error } = await query;
    if (!error) loadData();
    return error;
  };

  const handleDeleteNotice = async (id: string) => {
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (!error) loadData();
    return error;
  };

  const handleSavePermanentNotice = async (notice: any) => {
    const payload = {
      title: notice.title,
      content: notice.content || '',
      target_audience: notice.targetAudience,
      time: notice.time || '',
      date: notice.date,
      weekday: notice.weekday,
      created_at: new Date().toISOString()
    };

    let query;
    if (notice.id) {
      query = supabase.from('permanent_notices').update(payload).eq('id', notice.id);
    } else {
      query = supabase.from('permanent_notices').insert([payload]);
    }

    console.log("Salvando Mural:", payload);
    const { error } = await query;
    if (error) {
      console.error("Erro ao salvar Mural:", error);
      alert("Erro ao salvar no banco: " + error.message);
    } else {
      loadData();
    }
    return error;
  };

  const handleDeletePermanentNotice = async (id: string) => {
    const { error } = await supabase.from('permanent_notices').delete().eq('id', id);
    if (!error) loadData();
    return error;
  };

  const handleSaveResidenceService = async (rs: Omit<ResidenceService, 'id' | 'created_at' | 'isRead' | 'status'>) => {
    const payload = {
      member_id: rs.memberId || (user.id === '1' ? null : user.id),
      member_name: rs.memberName,
      phone: rs.phone,
      address: rs.address,
      service_date: rs.serviceDate,
      service_time: rs.serviceTime,
      notes: rs.notes || '',
      status: 'Pendente',
      is_read: false
    };
    const { error } = await supabase.from('residence_services').insert([payload]);
    if (!error) loadData();
    return error;
  };

  const handleUpdateResidenceServiceStatus = async (id: string, status: ResidenceService['status'], isRead: boolean = true) => {
    const { error } = await supabase.from('residence_services').update({ status, is_read: isRead }).eq('id', id);
    if (!error) loadData();
    return error;
  };

  const handleSaveMediaItem = async (item: Omit<MediaItem, 'id'>) => {
    console.log("Saving Media Item:", item);
    const { error } = await supabase.from('media_items').insert([item]);
    if (error) {
      console.error("Error saving media item:", error);
    } else {
      loadData();
    }
    return { error };
  };

  const handleDeleteMediaItem = async (id: string, url?: string) => {
    if (url && url.includes('church-media')) {
      const fileName = url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('church-media').remove([fileName]);
      }
    }
    const { error } = await supabase.from('media_items').delete().eq('id', id);
    if (!error) loadData();
    return error;
  };

  const handleUpdatePrayerStatus = async (id: string, isRead: boolean) => {
    const { error } = await supabase.from('prayer_requests').update({ is_read: isRead }).eq('id', id);
    if (!error) loadData();
    return error;
  };

  const handleSendPrayer = async (p: { userName: string; content: string; isAnonymous: boolean }) => {
    const payload = {
      user_name: p.isAnonymous ? 'Anônimo' : p.userName,
      content: p.content,
      is_read: false,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('prayer_requests').insert([payload]);
    if (!error) {
      loadData();
      alert('Pedido de oração enviado com sucesso! Estaremos orando por você.');
    } else {
      alert('Erro ao enviar pedido: ' + error.message);
    }
    return error;
  };

  const renderView = () => {
    const commonProps = { members, transactions, missionFields, reminders, ebdStudents, ebdAttendances, attendanceRecords, userRole: user.role, currentUser: user };

    switch (currentView) {
      case ViewType.DASHBOARD:
        if (user.role === 'Membro' && !user.customPermissions?.includes(ViewType.DASHBOARD)) return (
          <AppMembro
            onNavigate={setCurrentView}
            userRole={user.role}
            currentUser={user}
            reminders={reminders}
            onSendPrayer={handleSendPrayer}
            onSaveReminder={handleSaveReminder}
            onDeleteReminder={handleDeleteReminder}
            onSaveTransaction={handleSaveAppTransaction}
            notices={notices}
            permanentNotices={permanentNotices}
            members={members}
            onSaveNotice={handleSaveNotice}
            onDeleteNotice={handleDeleteNotice}
            onSavePermanentNotice={handleSavePermanentNotice}
            onDeletePermanentNotice={handleDeletePermanentNotice}
            residenceServices={residenceServices}
            onSaveResidenceService={handleSaveResidenceService}
          />
        );
        if (user.role === 'Secretaria' && !user.customPermissions?.includes(ViewType.DASHBOARD)) return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fadeIn">
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-red-100/50 border border-red-100">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-11a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-black text-slate-900 tracking-tight italic uppercase">Acesso Restrito</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Este perfil não tem permissão para<br />acessar o Dashboard Financeiro.</p>
            </div>
            <button onClick={() => setCurrentView(ViewType.SECRETARIA)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-95">Ir para Secretaria</button>
          </div>
        );
        return <Dashboard
          {...commonProps}
          residenceServices={residenceServices}
          unreadPrayers={unreadPrayers}
          onUpdateResidenceServiceStatus={handleUpdateResidenceServiceStatus}
          onUpdatePrayerStatus={handleUpdatePrayerStatus}
          setAttendanceRecords={async (r) => {
            // Performance Fix (Dashboard View): Direct State Update
            const payload = { ...r, created_at: new Date().toISOString() };
            const { data, error } = await supabase.from('attendance_records').insert([payload]).select();
            if (!error && data) {
              setAttendanceRecords(prev => [data[0], ...prev]);
            } else {
              loadData();
            }
          }}
        />;

      case ViewType.SECRETARIA: return <Secretaria
        {...commonProps}
        onSaveMember={handleSaveMember}
        onUpdateMember={handleUpdateMember}
        setMembers={setMembers}
        setReminders={handleSaveReminder}
        notices={notices}
        onSaveNotice={handleSaveNotice}
        onDeleteNotice={handleDeleteNotice}
        unreadPrayers={unreadPrayers}
        residenceServices={residenceServices}
        onUpdateResidenceServiceStatus={handleUpdateResidenceServiceStatus}
        onUpdatePrayerStatus={handleUpdatePrayerStatus}
      />;
      case ViewType.TESOURARIA:
        if (user.role !== 'Admin' && !user.customPermissions?.includes(ViewType.TESOURARIA)) return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fadeIn">
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-red-100/50 border border-red-100">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-11a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-black text-slate-900 tracking-tight italic uppercase">Acesso Restrito</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Este perfil não tem permissão para<br />acessar o Módulo Financeiro.</p>
            </div>
            <button onClick={() => setCurrentView(ViewType.SECRETARIA)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-95">Ir para Secretaria</button>
          </div>
        );
        return <Tesouraria {...commonProps} onSaveTransaction={handleSaveAppTransaction} onConfirmTransaction={handleConfirmTransaction} onDeleteTransaction={handleDeleteTransaction} user={user} />;
      case ViewType.CAMPO_MISSIONARIO: return <CampoMissionario
        fields={missionFields}
        setFields={() => { }}
        onSaveField={handleSaveMissionField}
        onUpdateField={handleUpdateMissionField}
        onDeleteField={handleDeleteMissionField}
        members={members}
        onUpdateMember={handleUpdateMember}
        transactions={transactions}
      />;
      case ViewType.EBD: return <EBD students={ebdStudents} setStudents={setEbdStudents} attendances={ebdAttendances} setAttendances={setEbdAttendances} members={members} userRole={user.role} currentUser={user} onSaveStudent={handleSaveEBDStudent} onSaveAttendance={handleSaveEBDAttendance} onSaveTransaction={handleSaveAppTransaction} onDeleteTransaction={handleDeleteTransaction} ebdClasses={ebdClasses} onSaveClass={handleSaveEBDClass} onDeleteClass={handleDeleteEBDClass} transactions={transactions} />;
      case ViewType.MIDIA: return <Midia userRole={user.role} mediaItems={mediaItems} onSaveMediaItem={handleSaveMediaItem} onDeleteMediaItem={handleDeleteMediaItem} />;
      case ViewType.APP_MEMBRO: return (
        <AppMembro
          onNavigate={setCurrentView}
          userRole={user.role}
          currentUser={user}
          reminders={reminders}
          onSendPrayer={handleSendPrayer}
          onSaveReminder={handleSaveReminder}
          onDeleteReminder={handleDeleteReminder}
          onSaveTransaction={handleSaveAppTransaction}
          notices={notices}
          permanentNotices={permanentNotices}
          members={members}
          onSaveNotice={handleSaveNotice}
          onDeleteNotice={handleDeleteNotice}
          onSavePermanentNotice={handleSavePermanentNotice}
          onDeletePermanentNotice={handleDeletePermanentNotice}
          residenceServices={residenceServices}
          onSaveResidenceService={handleSaveResidenceService}
        />
      );
      case ViewType.IA_ASSISTANT: return <AITools />;
      case ViewType.SETTINGS: return <Settings currentLogo={appLogo} onUpdateLogo={setAppLogo} members={members} onUpdateMember={handleUpdateMember} />;
      case ViewType.HISTORIA: return <Historia />;
      case ViewType.RECEPCAO: return (
        <Recepcao
          members={members}
          attendanceRecords={attendanceRecords}
          setAttendanceRecords={async (r) => {
            const payload = { ...r, created_at: new Date().toISOString() };
            const { data, error } = await supabase.from('attendance_records').insert([payload]).select();
            if (!error && data) {
              setAttendanceRecords(prev => [data[0], ...prev]);
            } else {
              loadData();
            }
          }}
          onSaveMember={handleSaveMember}
        />
      );
      default: return <Dashboard

        {...commonProps}
        setAttendanceRecords={async (r) => {
          // Performance Fix: Optimistic Update / Return Insert
          // Instead of reloading ALL data (loadData), we just insert and update the local list
          const payload = { ...r, created_at: new Date().toISOString() };
          const { data, error } = await supabase.from('attendance_records').insert([payload]).select();

          if (!error && data) {
            setAttendanceRecords(prev => [data[0], ...prev]);
          } else {
            // Fallback in case of error, ensuring consistent state
            loadData();
          }
        }}
      />;
    }
  };

  if (!user.isAuthenticated) {
    return <Login onLogin={(name, role, customPermissions) => {
      setUser({ id: '1', name, role, isAuthenticated: true, customPermissions });
      if (role === 'Secretaria' && !customPermissions?.includes(ViewType.DASHBOARD)) {
        setCurrentView(ViewType.SECRETARIA);
      }
    }} onRegister={handleSaveMember} logoUrl={appLogo} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <ResponsiveNav
        currentView={currentView}
        onViewChange={setCurrentView}
        userRole={user.role}
        logoUrl={appLogo}
        onLogout={() => setUser({ id: '', name: '', role: 'Membro', isAuthenticated: false, customPermissions: [] })}
        customPermissions={user.customPermissions}
      />

      {/* TOAST PARA GESTORES (NOTIFICAÇÃO EM TEMPO REAL) */}
      {managerToast && (
        <div className="fixed top-6 left-4 right-4 z-[150] animate-fadeIn pointer-events-none">
          <div className="max-w-md mx-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 p-5 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex items-center gap-5 ring-1 ring-white/10 pointer-events-auto">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-violet-500/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeWidth={2.5} /></svg>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">Intercessão em Tempo Real</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Agora</span>
              </div>
              <h4 className="text-sm font-black text-white tracking-tight mb-0.5">{managerToast.title}</h4>
              <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{managerToast.content}</p>
            </div>
            <button onClick={() => setManagerToast(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 h-full p-4 md:p-10 lg:p-14 pb-24 md:pb-14 overflow-y-auto relative custom-scrollbar">
        {/* Offline / Sync Status Indicator */}
        {(!isOnline || pendingSyncs > 0) && (
          <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2">
            {!isOnline && (
              <div className="bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse text-xs font-black uppercase tracking-widest">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536m0 0L4.222 11.93a9 9 0 010-12.728M4.222 11.93l-2.829 2.829" strokeWidth={3} /></svg>
                Offline
              </div>
            )}
            {pendingSyncs > 0 && (
              <div className="bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth={3} /></svg>
                Sincronizando {pendingSyncs} {pendingSyncs === 1 ? 'item' : 'itens'}
              </div>
            )}
          </div>
        )}

        {/* Mobile Header Removed - Using Bottom Nav */}
        <div className="md:hidden flex justify-center mb-6">
          <img src={appLogo} alt="Logo" className="h-10 object-contain drop-shadow-md" />
        </div>

        {renderView()}
      </main>


    </div>
  );
};

export default App;
