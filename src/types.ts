
export type Role = 'Admin' | 'Secretaria' | 'Membro';
// Added 'Novo Convertido' to MemberStatus
export type MemberStatus = 'Visitante' | 'Frequentador' | 'Ativo' | 'Em Observação' | 'Inativo' | 'Novo Convertido';

export interface User {
  id: string;
  name: string;
  role: Role;
  isAuthenticated: boolean;
  avatarUrl?: string;
  customPermissions?: ViewType[];
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  time?: string; // Novo campo para horário do evento
  type: string;
  color: string;
}

export interface PrayerRequest {
  id: string;
  userName: string;
  content: string;
  timestamp: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: MemberStatus;
  category: string;
  congregacao: string; // Local onde congrega (Sede ou Campo)
  ageGroup: string;    // Criança, Adolescente, Jovem, Adulto
  joinDate: string;
  baptismDate?: string;
  birthDate?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  country?: string; // Added Country field
  contributions: number;
  password?: string;
  customPermissions?: ViewType[];
}

export interface AttendanceRecord {
  id: string;
  date: string;
  description: string;
  visitors: string[];
  created_at?: string;
}

export interface EBDClass {
  id: string;
  name: string;
  teacherName?: string;
  ageGroupCriterion: string;
  description?: string;
}

export interface EBDStudent {
  id: string;
  name: string;
  ageGroup: string;
  className: string;
  enrollmentDate: string;
}

export interface EBDAttendance {
  id: string;
  date: string;
  className: string;
  presentStudentIds: string[];
}

export interface MissionField {
  id: string;
  name: string;
  leader: string;
  status: 'Ativo' | 'Implantação' | 'Consolidado';
  progress: number;
  converts: number;
  // New Metrics
  metrics_people_reach?: number;
  metrics_bibles_distributed?: number;
  metrics_baptisms?: number;
  metrics_leadership_training?: number;
  metrics_new_churches?: number;
  financial_sustainability_percentage?: number;
  members: Array<{
    id: string;
    name: string;
    phone: string;
    role: string;
  }>;
}

export interface Transaction {
  id: string;
  date: string;
  // Fix: Added transaction_date to support raw date parsing in components like Dashboard.tsx
  transaction_date?: string;
  type: 'Entrada' | 'Saída';
  amount: number;
  category: string;
  location?: string;
  identifiedPerson?: string;
  auditUser: string;
  notes?: string;
  status?: 'Pendente' | 'Confirmado';
}

export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  SECRETARIA = 'SECRETARIA',
  EBD = 'EBD',
  TESOURARIA = 'TESOURARIA',
  CAMPO_MISSIONARIO = 'CAMPO_MISSIONARIO',
  APP_MEMBRO = 'APP_MEMBRO',
  IA_ASSISTANT = 'IA_ADMISSIONARIA',
  MIDIA = 'MIDIA',
  SETTINGS = 'SETTINGS',
  HISTORIA = 'HISTORIA',
  RECEPCAO = 'RECEPCAO'
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  time?: string; // Adicionado para horário do aviso
  targetAudience: 'Todos' | 'Liderança' | 'Jovens' | 'Crianças';
  viewedBy?: string[]; // IDs dos membros que visualizaram
  priority?: 'Normal' | 'Alta';
  isPermanent?: boolean; // Adicionado para identificar avisos fixos/mural
  weekday?: string; // Ex: Segunda-feira, Domingo
}

export interface ResidenceService {
  id: string;
  memberId: string;
  memberName: string;
  phone: string;
  address: string;
  serviceDate: string;
  serviceTime: string;
  notes?: string;
  status: 'Pendente' | 'Confirmado' | 'Realizado' | 'Cancelado';
  isRead: boolean;
  created_at: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'document' | 'link';
  url: string;
  category: string;
  description?: string;
  metadata?: any;
  created_at?: string;
}


