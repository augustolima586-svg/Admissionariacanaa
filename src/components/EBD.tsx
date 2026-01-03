
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EBDStudent, EBDAttendance, Member, Role, EBDClass, User, Transaction } from '../types';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';

interface EBDProps {
  students: EBDStudent[];
  setStudents: React.Dispatch<React.SetStateAction<EBDStudent[]>>;
  attendances: EBDAttendance[];
  setAttendances: React.Dispatch<React.SetStateAction<EBDAttendance[]>>;
  members: Member[];
  userRole: Role;
  currentUser: User;
  onSaveStudent?: (student: EBDStudent) => Promise<any>;
  onSaveAttendance?: (attendance: EBDAttendance) => Promise<any>;
  onSaveTransaction?: (transaction: any) => Promise<any>;
  onDeleteTransaction?: (id: string) => Promise<any>;
  ebdClasses: EBDClass[];
  onSaveClass: (cls: EBDClass) => Promise<any>;
  onDeleteClass: (id: string) => Promise<any>;
  transactions: Transaction[];
}

const EBD: React.FC<EBDProps> = ({
  students,
  setStudents,
  attendances,
  setAttendances,
  members,
  userRole,
  currentUser,
  onSaveStudent,
  onSaveAttendance,
  onSaveTransaction,
  ebdClasses,
  onSaveClass,
  onDeleteClass,
  transactions,
  onDeleteTransaction
}) => {
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classModalMode, setClassModalMode] = useState<'create' | 'edit' | 'delete'>('create');
  const [showClassMenu, setShowClassMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<EBDStudent | null>(null);
  const [isSelfEnrollmentModalOpen, setIsSelfEnrollmentModalOpen] = useState(false);

  const [isMemberSelectionModalOpen, setIsMemberSelectionModalOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const isManager = userRole === 'Admin' || userRole === 'Secretaria';
  const isMember = userRole === 'Membro';

  const isAlreadyEnrolled = useMemo(() => {
    if (!isMember) return false;
    // Tenta encontrar o membro na lista de alunos pelo nome (já que o ID do aluno no schema EBD pode ser diferente do ID do membro)
    // No entanto, o correto seria vincular pelo nome ou ID se estivesse unificado.
    return students.some(s => s.name.toLowerCase() === currentUser.name.toLowerCase());
  }, [students, isMember, currentUser.name]);

  // Estados para Gestão Dinâmica de Classes - Agora via Props (App.tsx)

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowClassMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [studentForm, setStudentForm] = useState({
    name: '',
    ageGroup: 'Adulto',
    className: ''
  });

  const [classForm, setClassForm] = useState({
    name: '',
    teacherName: '',
    ageGroupCriterion: 'Adulto',
    description: ''
  });

  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    className: '',
    presentIds: [] as string[]
  });

  // States for Offering feature
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [isIndividualOffering, setIsIndividualOffering] = useState(false);
  const [offeringClass, setOfferingClass] = useState<EBDClass | null>(null);
  const [offeringAmount, setOfferingAmount] = useState('');
  const [offeringMemberId, setOfferingMemberId] = useState('');
  const [offeringType, setOfferingType] = useState<'Dízimo' | 'Oferta'>('Oferta');
  const [showPixInfo, setShowPixInfo] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const pixKey = 'admcanaa2021@gmail.com';

  const ageGroups = ["Criança 3 a 5 anos", "Criança de 6 a 11 anos", "Adolescente", "Jovem", "Adulto"];

  // Lista consolidada de classes (da DB + das matrículas existentes)
  const allAvailableClasses = useMemo(() => {
    const fromDB = ebdClasses.map(c => c.name);
    const fromStudents = students.map(s => s.className).filter(Boolean);
    return Array.from(new Set([...fromDB, ...fromStudents])).sort();
  }, [ebdClasses, students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.className.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const filteredMembers = useMemo(() => {
    return members.filter(m =>
      m.name.toLowerCase().includes(memberSearchTerm.toLowerCase())
    );
  }, [members, memberSearchTerm]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const newStudent: EBDStudent = {
      id: Math.random().toString(36).substr(2, 9),
      name: studentForm.name,
      ageGroup: studentForm.ageGroup,
      className: studentForm.className || (ebdClasses[0]?.name || 'Doutrina'),
      enrollmentDate: new Date().toISOString().split('T')[0]
    };

    // ---- Automatic class creation if needed ----
    if (studentForm.className) {
      const classExists = ebdClasses.some(c => c.name === studentForm.className);
      if (!classExists && onSaveClass) {
        const newClass: EBDClass = {
          id: '',
          name: studentForm.className,
          teacherName: '',
          ageGroupCriterion: 'Adulto',
          description: ''
        };
        const classError = await onSaveClass(newClass);
        if (classError) {
          alert('Erro ao criar classe automaticamente: ' + classError.message);
        }
      }
    }
    // -------------------------------------------

    if (onSaveStudent) {
      const error = await onSaveStudent(newStudent);
      if (error) {
        alert('Erro ao matricular aluno: ' + error.message);
        return;
      }
    }

    // Update local state ONLY after successful DB save or if no save function is provided
    setStudents(prev => [...prev, newStudent]);
    setIsStudentModalOpen(false);
    setIsSelfEnrollmentModalOpen(false);
    setStudentForm({ name: '', ageGroup: 'Adulto', className: '' });
  };

  const handleSelectMemberForEnrollment = (member: Member) => {
    // Preenche o formulário com dados do membro e abre o modal de cadastro manual para confirmação/ajustes
    setStudentForm({
      name: member.name,
      ageGroup: member.ageGroup || 'Adulto',
      className: '' // Força o usuário a escolher a classe
    });
    setIsMemberSelectionModalOpen(false);
    setIsStudentModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const cls: EBDClass = {
      id: editingClassId || '',
      name: classForm.name,
      teacherName: classForm.teacherName,
      ageGroupCriterion: classForm.ageGroupCriterion,
      description: classForm.description
    };
    const error = await onSaveClass(cls);
    if (error) {
      alert('Erro ao salvar classe: ' + error.message);
    } else {
      setEditingClassId(null);
      setIsClassModalOpen(false);
      setClassForm({ name: '', teacherName: '', ageGroupCriterion: 'Adulto', description: '' });
    }
  };

  const startEditClass = (cls: EBDClass) => {
    setEditingClassId(cls.id);
    setClassForm({
      name: cls.name,
      teacherName: cls.teacherName || '',
      ageGroupCriterion: cls.ageGroupCriterion,
      description: cls.description || ''
    });
    setClassModalMode('edit');
    setIsClassModalOpen(true);
  };

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;

    const className = attendanceForm.className || (ebdClasses[0]?.name || 'Doutrina');
    const newAtt: EBDAttendance = {
      id: Math.random().toString(36).substr(2, 9),
      date: attendanceForm.date,
      className,
      presentStudentIds: attendanceForm.presentIds
    };
    if (onSaveAttendance) {
      onSaveAttendance(newAtt);
    }
    setAttendances(prev => [...prev, newAtt]);
    setIsAttendanceModalOpen(false);
    setAttendanceForm({ date: new Date().toISOString().split('T')[0], className: '', presentIds: [] });
  };

  const openAttendanceModal = (className?: string) => {
    setAttendanceForm({
      date: new Date().toISOString().split('T')[0],
      className: className || (ebdClasses.length > 0 ? ebdClasses[0].name : ''),
      presentIds: []
    });
    setIsAttendanceModalOpen(true);
  };

  const togglePresence = (id: string) => {
    if (!isManager) return; // Only managers can change presence
    setAttendanceForm(prev => ({
      ...prev,
      presentIds: prev.presentIds.includes(id)
        ? prev.presentIds.filter(pid => pid !== id)
        : [...prev.presentIds, id]
    }));
  };

  const removeClass = async (id: string) => {
    if (window.confirm('Excluir esta classe? Alunos vinculados continuarão com o nome da classe antigo até serem editados.')) {
      const error = await onDeleteClass(id);
      if (error) alert('Erro ao excluir classe: ' + error.message);
    }
  };

  const openClassModal = (mode: 'create' | 'edit' | 'delete') => {
    setClassModalMode(mode);
    setEditingClassId(null);
    setClassForm({ name: '', teacherName: '', ageGroupCriterion: 'Adulto', description: '' });
    setIsClassModalOpen(true);
    setShowClassMenu(false);
  };

  const calculateStudentStats = (student: EBDStudent) => {
    // Total de aulas computadas para a classe do aluno desde que ele se matriculou
    // Para simplificar, consideramos todas as aulas da classe registradas no sistema que sejam posteriores ou iguais a data de matrícula
    // Se a data de matrícula não estiver definida, considera todas.
    const studentClassEvents = attendances.filter(a => {
      const isSameClass = a.className === student.className;
      const isAfterEnrollment = student.enrollmentDate ? a.date >= student.enrollmentDate : true;
      return isSameClass && isAfterEnrollment;
    });

    const totalClasses = studentClassEvents.length;
    const presences = studentClassEvents.filter(a => a.presentStudentIds.includes(student.id)).length;
    const percentage = totalClasses > 0 ? (presences / totalClasses) * 100 : 0; // Se 0 aulas, 0% ou 100%? Vamos deixar 0% para incentivar criação de aulas.

    let status: 'Regular' | 'Atenção' | 'Crítico' = 'Regular';
    let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';

    if (percentage < 50) {
      status = 'Crítico';
      statusColor = 'text-red-600 bg-red-50 border-red-100';
    } else if (percentage < 75) {
      status = 'Atenção';
      statusColor = 'text-amber-600 bg-amber-50 border-amber-100';
    }

    return { totalClasses, presences, percentage, status, statusColor, history: studentClassEvents };
  };

  const handleOpenStudentDetails = (student: EBDStudent) => {
    setSelectedStudentForDetails(student);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-heading font-black text-slate-900 tracking-tight italic leading-tight">EBD - Escola Bíblica</h2>
          <p className="text-slate-500 font-medium">Gestão dinâmica de classes, critérios e matrículas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Botão Gerenciar Classes com Dropdown - Alinhado */}
          {isManager && (
            <div className="relative flex-1 md:flex-none" ref={menuRef}>
              <Button
                onClick={() => setShowClassMenu(!showClassMenu)}
                className="h-12 w-full md:w-auto px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <svg className="w-4 h-4 mr-1 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth={2.5} /></svg>
                Gerenciar Classes
                <svg className={`w-3 h-3 ml-2 transition-transform ${showClassMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth={3} /></svg>
              </Button>


              {showClassMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-40 animate-fadeIn">
                  <div className="p-1.5 space-y-0.5">
                    <button onClick={() => openClassModal('create')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all flex items-center gap-3 group">
                      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors text-[9px]">1</span>
                      Criar Classe
                    </button>
                    <button onClick={() => openClassModal('edit')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all flex items-center gap-3 group">
                      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors text-[9px]">2</span>
                      Editar Classe
                    </button>
                    <button onClick={() => openClassModal('delete')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-red-600 rounded-xl transition-all flex items-center gap-3 group">
                      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-red-50 text-red-600 font-black group-hover:bg-red-600 group-hover:text-white transition-colors text-[9px]">3</span>
                      Excluir Classe
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => openAttendanceModal()}
            className="flex-1 md:flex-none h-12 px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-slate-200 hover:shadow-slate-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            {isManager ? 'Lançar Presença' : 'Mapa de Presença'}
          </Button>


          {isManager && (
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                onClick={() => setIsMemberSelectionModalOpen(true)}
                className="flex-1 md:flex-none h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <svg className="w-4 h-4 mr-1 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth={2.5} /></svg>
                Matricular
              </Button>
            </div>
          )}

          {isMember && !isAlreadyEnrolled && (
            <Button
              onClick={() => {
                const memberData = members.find(m => m.name.toLowerCase() === currentUser.name.toLowerCase());
                setStudentForm({
                  name: currentUser.name,
                  ageGroup: memberData?.ageGroup || 'Adulto',
                  className: ''
                });
                setIsSelfEnrollmentModalOpen(true);
              }}
              className="flex-1 md:flex-none h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <svg className="w-4 h-4 mr-1 group-hover:bounce transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeWidth={2.5} /></svg>
              Matricular-se na EBD
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:border-slate-200 transition-all">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Alunos</p>
          <h3 className="text-2xl font-heading font-black text-slate-900 mt-1">{students.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:border-emerald-100 transition-all">
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">3-5 Anos</p>
          <h3 className="text-2xl font-heading font-black text-emerald-600 mt-1">{students.filter(s => s.ageGroup.includes('3 a 5')).length}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:border-emerald-100 transition-all">
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">6-11 Anos</p>
          <h3 className="text-2xl font-heading font-black text-emerald-600 mt-1">{students.filter(s => s.ageGroup.includes('6 a 11')).length}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:border-red-100 transition-all">
          <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Adolescentes</p>
          <h3 className="text-2xl font-heading font-black text-red-600 mt-1">{students.filter(s => s.ageGroup.toLowerCase().includes('adolescente')).length}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:border-red-100 transition-all">
          <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Jovens/Adultos</p>
          <h3 className="text-2xl font-heading font-black text-red-600 mt-1">{students.filter(s => s.ageGroup.toLowerCase().includes('jovem') || s.ageGroup.toLowerCase().includes('adulto')).length}</h3>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <h3 className="font-heading font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Ficha de Alunos Matriculados</h3>
          <div className="relative w-full sm:w-80">
            <Input
              type="text"
              placeholder="Pesquisar por nome ou classe..."
              className="pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 absolute left-4 top-[14px] text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2.5} /></svg>
          </div>

        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100 bg-slate-50/20">
                <th className="px-10 py-6">Nome do Aluno</th>
                <th className="px-10 py-6">Critério Etário</th>
                <th className="px-10 py-6">Classe Vinculada</th>
                <th className="px-10 py-6">Data de Matrícula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map(student => (
                <tr key={student.id} onClick={() => handleOpenStudentDetails(student)} className="hover:bg-slate-50/80 transition-all cursor-pointer group">
                  <td className="px-10 py-6 font-bold text-slate-800 text-sm">{student.name}</td>
                  <td className="px-10 py-6 text-xs font-medium text-slate-500">{student.ageGroup}</td>
                  <td className="px-10 py-6">
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100/50">
                      {student.className}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-[10px] text-slate-400 font-bold">{student.enrollmentDate}</td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-10 py-16 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.3em]">Nenhum aluno encontrado para os critérios</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seção de Histórico Financeiro da EBD (Exclusivo para Gestores) */}
      {isManager && (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden mt-8">
          <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-100">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="font-heading font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Fluxo Financeiro EBD</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ofertas e Dízimos via Classe</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100 bg-slate-50/20">
                  <th className="px-10 py-6">Data</th>
                  <th className="px-10 py-6">Origem (Classe)</th>
                  <th className="px-10 py-6">Tipo/Membro</th>
                  <th className="px-10 py-6">Valor</th>
                  <th className="px-10 py-6">Status</th>
                  <th className="px-10 py-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions
                  .filter(t => t.notes?.includes('EBD') || t.category === 'EBD')
                  .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
                  .map(transaction => (
                    <tr key={transaction.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-10 py-6 text-[10px] text-slate-400 font-black">{new Date(transaction.date || '').toLocaleDateString('pt-BR')}</td>
                      <td className="px-10 py-6">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">
                          {transaction.location || 'N/A'}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{transaction.category}</span>
                          <span className="text-[9px] text-slate-400 font-medium truncate max-w-[150px]">{transaction.notes}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-sm font-black text-emerald-600 tracking-tight">
                          {transaction.amount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${transaction.status === 'Confirmado'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                          {transaction.status || 'Pendente'}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        {isManager && (
                          <button
                            disabled={deletingTransactionId === transaction.id}
                            onClick={async () => {
                              if (window.confirm('Deseja realmente excluir este lançamento?')) {
                                setDeletingTransactionId(transaction.id);
                                try {
                                  if (onDeleteTransaction) {
                                    await onDeleteTransaction(transaction.id);
                                  }
                                } finally {
                                  setDeletingTransactionId(null);
                                }
                              }
                            }}
                            className={`p-2 text-slate-300 hover:text-red-600 transition-all ${deletingTransactionId === transaction.id ? 'opacity-50' : ''}`}
                            title="Excluir Lançamento"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                {transactions.filter(t => t.notes?.includes('EBD') || t.category === 'EBD').length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-10 py-16 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.3em]">Nenhum lançamento financeiro registrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Gerenciar Classes Centralizado */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
            <div className={`p-10 text-white flex justify-between items-center sticky top-0 z-10 relative overflow-hidden ${classModalMode === 'delete' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-red-950' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950'}`}>
              <div className="absolute top-0 right-0 p-6 opacity-[0.08]">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" /></svg>
              </div>
              <div className="relative z-10">
                <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Escola Bíblica</h3>
                <p className="text-2xl font-heading font-black italic tracking-tighter leading-none">
                  {classModalMode === 'create' ? 'Nova Unidade EBD' :
                    classModalMode === 'edit' ? (editingClassId ? 'Alterar Unidade' : 'Escolha a Unidade') :
                      'Remover Unidade'}
                </p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-3">Configurações Dinâmicas de Ensino</p>
              </div>
              <button onClick={() => setIsClassModalOpen(false)} className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all duration-300 hover:rotate-90">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
              </button>
            </div>

            <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
              {(classModalMode === 'create' || (classModalMode === 'edit' && editingClassId)) && (
                <form onSubmit={handleSaveClass} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200/50 space-y-6 animate-fadeIn">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-indigo-600 rounded-full"></span>
                    {classModalMode === 'edit' ? 'Modificar Registro' : 'Cadastro de Classe'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Identificador</label>
                      <Input
                        type="text"
                        required
                        placeholder="Ex: Berçário Arca de Noé"
                        value={classForm.name}
                        onChange={e => setClassForm({ ...classForm, name: e.target.value })}
                        className="h-14 px-6 bg-white border border-slate-200 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600/20 outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professor Titular</label>
                      <Input
                        type="text"
                        placeholder="Nome do Professor..."
                        value={classForm.teacherName}
                        onChange={e => setClassForm({ ...classForm, teacherName: e.target.value })}
                        className="h-14 px-6 bg-white border border-slate-200 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600/20 outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Público Alvo</label>
                      <select className="w-full px-6 h-14 bg-white border border-slate-200 rounded-2xl font-black text-slate-800 text-xs uppercase tracking-widest appearance-none focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600/20 outline-none transition-all cursor-pointer" value={classForm.ageGroupCriterion} onChange={e => setClassForm({ ...classForm, ageGroupCriterion: e.target.value })}>
                        {ageGroups.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="flex-1 h-14 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                      {classModalMode === 'edit' ? 'Salvar Alterações' : 'Criar Agora'}
                    </button>
                    {classModalMode === 'edit' && (
                      <button type="button" onClick={() => setEditingClassId(null)} className="px-8 bg-slate-200 text-slate-600 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all">Cancelar</button>
                    )}
                  </div>
                </form>
              )}

              {(classModalMode === 'edit' && !editingClassId || classModalMode === 'delete') && (
                <div className="space-y-6 animate-fadeIn">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                    <div className={`w-2 h-5 rounded-full mr-4 ${classModalMode === 'delete' ? 'bg-red-600' : 'bg-indigo-600'}`}></div>
                    {classModalMode === 'delete' ? 'Escolha a classe para remoção imediata' : 'Escolha para iniciar a edição'}
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {allAvailableClasses.map(className => {
                      const c = ebdClasses.find(cls => cls.name === className) || {
                        id: '',
                        name: className,
                        teacherName: '',
                        ageGroupCriterion: 'Adulto',
                        description: ''
                      };
                      return (
                        <div key={className} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[2rem] group hover:border-slate-300 hover:shadow-lg transition-all">
                          <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white ${classModalMode === 'delete' ? 'bg-red-500 shadow-red-100' : 'bg-indigo-500 shadow-indigo-100'} shadow-lg`}>
                              {c.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-base">{c.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{c.teacherName ? `Prof. ${c.teacherName}` : 'Sem Professor'}</p>
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Critério: {c.ageGroupCriterion}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {/* Botão de Oferta da Classe */}
                            <button onClick={() => { setOfferingClass(c); setIsOfferingModalOpen(true); setShowPixInfo(true); }} className="flex items-center justify-center w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm group-hover:shadow-md" title="Lançar Oferta da Classe">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} /></svg>
                            </button>
                            {c.id && classModalMode === 'edit' && (
                              <button onClick={() => startEditClass(c)} className="flex items-center h-11 gap-2 bg-indigo-50 text-indigo-600 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2.5} /></svg>
                                Editar
                              </button>
                            )}
                            {c.id && classModalMode === 'delete' && (
                              <button onClick={() => removeClass(c.id)} className="flex items-center h-11 gap-2 bg-red-50 text-red-600 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" strokeWidth={2.5} /></svg>
                                Excluir
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Oferta da Classe */}
      {
        isOfferingModalOpen && offeringClass && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-scaleUp">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-10 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.08]">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19 20 15.19 20 10.5 16.19 2 11.5 2zm0 14.5c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" /></svg>
                </div>
                <div className="relative z-10">
                  <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Minha Unidade</h3>
                  <p className="text-2xl font-heading font-black italic tracking-tighter leading-none">Oferta da Classe</p>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2">{offeringClass.name}</p>
                </div>
                <button onClick={() => { setIsOfferingModalOpen(false); setOfferingAmount(''); }} className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
              </div>
              <div className="p-10 space-y-8">
                {showPixInfo && (
                  <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col items-center text-center space-y-4 shadow-xl">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Chave Pix Oficial</p>
                      <p className="text-sm font-bold">{pixKey}</p>
                    </div>
                    <button type="button" onClick={() => { navigator.clipboard.writeText(pixKey); alert('Chave Pix copiada!'); }} className="px-6 py-2 bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                      Copiar Chave
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setIsIndividualOffering(false)}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isIndividualOffering ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Oferta da Classe
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsIndividualOffering(true)}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isIndividualOffering ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Dízimo/Oferta Individual
                  </button>
                </div>

                {isIndividualOffering && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Lançamento</label>
                      <div className="flex gap-2">
                        {['Dízimo', 'Oferta'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setOfferingType(type as any)}
                            className={`flex-1 py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${offeringType === type ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificar Membro</label>
                      <select
                        required
                        className="w-full px-6 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 text-sm appearance-none cursor-pointer focus:ring-8 focus:ring-emerald-600/5 focus:border-emerald-600/20 outline-none transition-all pr-12"
                        value={offeringMemberId}
                        onChange={e => setOfferingMemberId(e.target.value)}
                      >
                        <option value="">Selecione o Membro...</option>
                        {members.sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor {isIndividualOffering ? offeringType : 'da Oferta'} (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    className="h-20 text-3xl font-black px-8 bg-slate-50 border-slate-100 rounded-[2rem] text-emerald-600 focus:ring-8 focus:ring-emerald-600/5 focus:border-emerald-600/20 outline-none transition-all placeholder:text-slate-200"
                    placeholder="0,00"
                    value={offeringAmount}
                    onChange={e => setOfferingAmount(e.target.value)}
                  />
                </div>


                <button
                  type="button"
                  onClick={async () => {
                    if (!offeringAmount || parseFloat(offeringAmount) <= 0) { alert('Digite um valor válido'); return; }
                    if (isIndividualOffering && !offeringMemberId) { alert('Selecione um membro'); return; }

                    if (onSaveTransaction) {
                      const transactionData = {
                        type: 'Entrada',
                        amount: parseFloat(offeringAmount),
                        category: isIndividualOffering ? offeringType : 'EBD',
                        location: offeringClass.name,
                        notes: isIndividualOffering
                          ? `${offeringType} de ${offeringMemberId} via EBD - Classe: ${offeringClass.name}`
                          : `Oferta da Classe: ${offeringClass.name} - Prof. ${offeringClass.teacherName || 'N/A'}`
                      };

                      await onSaveTransaction(transactionData);
                      alert(`${isIndividualOffering ? offeringType : 'Oferta'} registrada com sucesso!`);
                      setIsOfferingModalOpen(false);
                      setOfferingAmount('');
                      setOfferingMemberId('');
                      setIsIndividualOffering(false);
                    } else {
                      alert('Erro: Sistema financeiro não conectado.');
                    }
                  }}
                  className="group relative w-full h-18 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth={3.5} /></svg>
                    Confirmar Lançamento
                  </span>
                </button>

              </div>
            </div>
          </div>
        )
      }

      {/* Modal Matrícula Manual */}
      {
        isStudentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-scaleUp">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 p-10 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.08]">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
                </div>
                <div className="relative z-10">
                  <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Escola Bíblica</h3>
                  <p className="text-2xl font-heading font-black italic tracking-tighter leading-none">Matrícula EBD</p>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2">Vinculação de Novos Discípulos</p>
                </div>
                <button onClick={() => setIsStudentModalOpen(false)} className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
              </div>
              <form onSubmit={handleAddStudent} className="p-10 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo do Aluno</label>
                  <Input
                    type="text"
                    required
                    placeholder="Nome do discípulo..."
                    value={studentForm.name}
                    onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="h-14 px-6 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil Etário</label>
                    <select className="w-full px-6 h-14 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 text-xs uppercase tracking-widest appearance-none cursor-pointer focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all" value={studentForm.ageGroup} onChange={e => setStudentForm({ ...studentForm, ageGroup: e.target.value })}>
                      {ageGroups.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classe</label>
                    <select className="w-full px-6 h-14 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 text-xs uppercase tracking-widest appearance-none cursor-pointer focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all" value={studentForm.className} onChange={e => setStudentForm({ ...studentForm, className: e.target.value })}>
                      <option value="">Selecione a Classe...</option>
                      {allAvailableClasses.map(className => <option key={className} value={className}>{className}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="group relative w-full h-18 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-red-100 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={3.5} /></svg>
                    Confirmar Admissão
                  </span>
                </button>
              </form>
            </div>
          </div>
        )
      }

      {/* Modal Seleção de Membro para Matrícula */}
      {isMemberSelectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 p-10 text-white flex justify-between items-center sticky top-0 z-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.08]">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
              </div>
              <div className="relative z-10">
                <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Rol de Membros</h3>
                <p className="text-2xl font-heading font-black italic tracking-tighter leading-none">Importar Membro</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2">Matrícula via Banco Federativo</p>
              </div>
              <button onClick={() => setIsMemberSelectionModalOpen(false)} className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
            </div>

            <div className="p-10 space-y-6 overflow-hidden flex flex-col h-full">
              <div className="relative">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Pesquisar membro para matrícula..."
                    className="pl-14 h-14 bg-slate-50 border-slate-100 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-300"
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                  />
                  <svg className="w-5 h-5 absolute left-5 top-[18px] text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={3} /></svg>
                </div>
              </div>


              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {filteredMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleSelectMemberForEnrollment(member)}
                    className="w-full flex items-center p-4 bg-white border border-slate-100 rounded-2xl hover:bg-red-50 hover:border-red-100 transition-all group text-left"
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black mr-4 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-heading font-bold text-slate-800 text-sm group-hover:text-red-900">{member.name}</h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{member.ageGroup || 'N/A'} • {member.category || 'Membro'}</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2.5} /></svg>
                  </button>
                ))}
                {filteredMembers.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum membro encontrado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lançar Presença (Mapa de Presença) */}
      {
        isAttendanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-scaleUp">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden">
                {/* Intensified Red Glow Accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 rounded-full blur-[80px] -mr-16 -mt-16 animate-pulse"></div>
                <div className="absolute top-0 right-0 p-4 opacity-[0.1]">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" /></svg>
                </div>
                <div className="relative z-10">
                  <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Escola Bíblica</h3>
                  <p className="text-2xl font-heading font-black italic tracking-tighter leading-none">Mapa de Presença</p>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2">Controle de Frequência Dominical</p>
                </div>
                <button onClick={() => setIsAttendanceModalOpen(false)} className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
              </div>
              <form onSubmit={handleSaveAttendance} className="p-10 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data da Aula</label>
                    <Input
                      type="date"
                      required
                      readOnly={!isManager}
                      value={attendanceForm.date}
                      onChange={e => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Classe</label>
                    <div className="relative">
                      <select
                        className="w-full px-6 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 text-sm appearance-none cursor-pointer focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all pr-12"
                        value={attendanceForm.className}
                        onChange={e => setAttendanceForm({ ...attendanceForm, className: e.target.value })}
                      >
                        <option value="">Selecione a Classe...</option>
                        {allAvailableClasses.map(className => <option key={className} value={className}>{className}</option>)}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth={3} /></svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alunos Matriculados (Chamada Nominal)</label>
                  <div className="max-h-60 overflow-y-auto space-y-2 p-4 bg-slate-50 rounded-[2rem] border border-slate-200/50 custom-scrollbar">
                    {!attendanceForm.className ? (
                      <div className="text-center py-10">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed italic">Aguardando seleção<br />da classe...</p>
                      </div>
                    ) : students.filter(s => s.className?.trim().toLowerCase() === attendanceForm.className?.trim().toLowerCase()).length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">Nenhum aluno matriculado<br />nesta unidade</p>
                      </div>
                    ) : (
                      students.filter(s => s.className?.trim().toLowerCase() === attendanceForm.className?.trim().toLowerCase()).map(student => (
                        <label key={student.id} className="flex items-center p-4 bg-white rounded-2xl border border-slate-100 cursor-pointer hover:bg-red-50/30 hover:border-red-100 transition-all select-none group">
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              disabled={!isManager}
                              className="w-6 h-6 text-red-600 rounded-lg border-slate-300 focus:ring-offset-0 focus:ring-0 transition-all cursor-pointer disabled:cursor-not-allowed checked:bg-red-600"
                              checked={attendanceForm.presentIds.includes(student.id)}
                              onChange={() => togglePresence(student.id)}
                            />
                          </div>
                          <div className="ml-4 flex-1">
                            <span className="text-sm font-heading font-black text-slate-800 tracking-tight block group-hover:text-red-700 transition-colors">{student.name}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{student.ageGroup}</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                {isManager && (
                  <button
                    type="submit"
                    className="group relative w-full h-18 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-red-100 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth={3.5} /></svg>
                      Confirmar Presença
                    </span>
                  </button>
                )}

                {!isManager && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                    <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Apenas Administradores e Secretaria podem registrar presenças.</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        )
      }

      {/* Modal Detalhes do Aluno (Ficha de Acompanhamento) */}
      {
        selectedStudentForDetails && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-10 text-white flex justify-between items-start sticky top-0 z-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.08]">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
                </div>
                <div className="relative z-10">
                  <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Escola Bíblica</h3>
                  <p className="text-2xl font-heading font-black italic tracking-tighter leading-none">Ficha do Aluno</p>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2">Histórico e Desempenho</p>
                </div>
                <button onClick={() => setSelectedStudentForDetails(null)} className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
              </div>

              <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
                {/* Cabeçalho do Perfil */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-100">
                    {selectedStudentForDetails.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-black text-slate-900 tracking-tight leading-none mb-2">{selectedStudentForDetails.name}</h2>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">{selectedStudentForDetails.className}</span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">{selectedStudentForDetails.ageGroup}</span>
                    </div>
                  </div>
                </div>

                {/* Cartões de Estatísticas */}
                {(() => {
                  const stats = calculateStudentStats(selectedStudentForDetails);
                  return (
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Frequência Global</p>
                          <p className="text-3xl font-heading font-black text-slate-800">{stats.percentage.toFixed(0)}%</p>
                        </div>
                        <div className={`p-6 rounded-[2rem] border text-center flex flex-col justify-center items-center ${stats.statusColor}`}>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Status Atual</p>
                          <p className="text-xl font-heading font-black">{stats.status}</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden">
                        <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico de Aulas Recentes</h4>
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-4 space-y-2">
                          {stats.history.slice(0, 10).map(att => { // Últimas 10 aulas
                            const isPresent = att.presentStudentIds.includes(selectedStudentForDetails.id);
                            return (
                              <div key={att.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(att.date).toLocaleDateString('pt-BR')}</span>
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-emerald-600' : 'bg-red-600'}`}></div>
                                  {isPresent ? 'Presente' : 'Ausente'}
                                </span>
                              </div>
                            )
                          })}
                          {stats.history.length === 0 && (
                            <div className="text-center py-8 text-slate-300 font-black text-[10px] uppercase tracking-widest">Nenhuma aula registrada para esta classe</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )
      }
      {/* Modal Auto-Matrícula (Para Membros) */}
      {isSelfEnrollmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-scaleUp">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-10 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.08]">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
              </div>
              <div className="relative z-10">
                <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-1 text-slate-400">Escola Bíblica</h3>
                <p className="text-2xl font-heading font-black italic tracking-tighter leading-none">Matricular na EBD</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2">Escolha sua unidade de ensino</p>
              </div>
              <button onClick={() => setIsSelfEnrollmentModalOpen(false)} className="relative z-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
            </div>
            <form onSubmit={handleAddStudent} className="p-10 space-y-8">
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Olá <strong>{currentUser.name}</strong>, selecione abaixo a classe em que deseja se matricular. Seus dados básicos já estão vinculados ao seu perfil.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classe de Ensino</label>
                  <select
                    required
                    className="w-full px-6 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 text-sm appearance-none cursor-pointer focus:ring-8 focus:ring-emerald-600/5 focus:border-emerald-600/20 outline-none transition-all pr-12"
                    value={studentForm.className}
                    onChange={e => setStudentForm({ ...studentForm, className: e.target.value })}
                  >
                    <option value="">Selecione a Classe...</option>
                    {ebdClasses.map(cls => (
                      <option key={cls.id} value={cls.name}>{cls.name} ({cls.ageGroupCriterion})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="group relative w-full h-18 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth={3.5} /></svg>
                  Confirmar Matrícula
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div >
  );
};

export default EBD;
