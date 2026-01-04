import React, { useState } from 'react';
import { Member, ViewType, Role } from '../types';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';

interface SettingsProps {
  currentLogo: string;
  onUpdateLogo: (newUrl: string) => void;
  currentTheme: string;
  onUpdateTheme: (theme: string) => void;
  members: Member[];
  onUpdateMember: (id: string, updates: Partial<Member>) => Promise<any>;
}

const Settings: React.FC<SettingsProps> = ({ currentLogo, onUpdateLogo, currentTheme, onUpdateTheme, members, onUpdateMember }: SettingsProps) => {
  const [urlInput, setUrlInput] = useState(currentLogo);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [secPwd, setSecPwd] = useState(localStorage.getItem('canaa_secretaria_pwd') || 'canaa2025');
  const [secPwdStatus, setSecPwdStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [memberSearch, setMemberSearch] = useState('');
  const [permissionTarget, setPermissionTarget] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSecPwd(password);
  };

  const handleSaveLogo = () => {
    setSaveStatus('saving');
    onUpdateLogo(urlInput);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  const handleSaveSecPwd = () => {
    setSecPwdStatus('saving');
    localStorage.setItem('canaa_secretaria_pwd', secPwd);
    setTimeout(() => {
      setSecPwdStatus('saved');
      setTimeout(() => setSecPwdStatus('idle'), 2000);
    }, 800);
  };

  const filteredMembers = (members || []).filter((m: Member) =>
    (m.name || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(memberSearch.toLowerCase())
  ).slice(0, 10);

  const togglePermission = async (member: Member, view: ViewType) => {
    const currentPerms = member.customPermissions || [];
    const newPerms = currentPerms.includes(view)
      ? currentPerms.filter(p => p !== view)
      : [...currentPerms, view];

    await onUpdateMember(member.id, { customPermissions: newPerms });
  };

  const updateRole = async (member: Member, role: Role) => {
    await onUpdateMember(member.id, { category: role });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-heading font-black text-slate-900 tracking-tight italic">Painel de Governança</h2>
          <p className="text-slate-500 font-medium">Controle de identidade visual e chaves de segurança mestre.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gestão de Logo */}
        <Card className="p-8 !rounded-[2.5rem] space-y-8 border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform duration-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-heading font-black text-slate-800 uppercase text-[10px] tracking-[0.2em]">Identidade Visual</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Customização da Marca</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL da Logo do Sistema</label>
              <Input
                type="text"
                placeholder="Link da imagem PNG/SVG"
                value={urlInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrlInput(e.target.value)}
                className="h-14 px-6 bg-slate-100 border-slate-200 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-red-600/5 focus:border-red-600/20 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleSaveLogo}
              disabled={saveStatus !== 'idle'}
              className={`group relative w-full h-16 text-white rounded-xl font-black text-base uppercase tracking-[0.15em] shadow-[0_8px_30px_rgb(185,28,28,0.35)] hover:shadow-[0_12px_40px_rgb(185,28,28,0.5)] transition-all duration-300 overflow-hidden ${saveStatus === 'saved'
                ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 shadow-[0_8px_30px_rgb(5,150,105,0.35)]'
                : saveStatus === 'saving'
                  ? 'bg-gradient-to-br from-red-600 via-red-700 to-red-900 opacity-75 cursor-not-allowed'
                  : 'bg-gradient-to-br from-red-600 via-red-700 to-red-900 hover:scale-[1.01] active:scale-[0.99]'
                }`}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>

              {/* Glowing border effect */}
              <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300 ${saveStatus === 'saved'
                ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600'
                : 'bg-gradient-to-r from-red-400 via-red-500 to-red-600'
                }`}></div>

              <span className="relative z-10 flex items-center justify-center gap-3">
                {saveStatus === 'saved' ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Logo Atualizada!
                  </>
                ) : saveStatus === 'saving' ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Salvar Logo
                  </>
                )}
              </span>
            </button>

            {/* Temas Comemorativos */}
            <div className="pt-6 border-t border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Cores por Temporada / Comemoração</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'default', label: 'Padrão', color: 'bg-red-600' },
                  { id: 'womens-day', label: 'Outubro Rosa', color: 'bg-rose-500' },
                  { id: 'movember', label: 'Novembro Azul', color: 'bg-sky-600' },
                  { id: 'christmas', label: 'Temporada Natal', color: 'bg-emerald-600' },
                  { id: 'jubilee', label: 'Jubileu / Ouro', color: 'bg-amber-500' },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => onUpdateTheme(theme.id)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${currentTheme === theme.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 bg-white hover:border-slate-200'}`}
                  >
                    <div className={`w-8 h-8 rounded-full ${theme.color} shadow-lg`}></div>
                    <span className="text-[9px] font-black uppercase tracking-tight text-slate-700">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Gestão de Senha da Secretaria */}
        <Card className="p-8 !rounded-[2.5rem] space-y-8 bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" /></svg>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-red-600 text-white rounded-2xl animate-pulse">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h3 className="font-heading font-black text-white uppercase text-[10px] tracking-[0.2em]">Acesso Secretaria</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Segurança Operacional</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Chave de Acesso Operacional</label>
              <div className="flex gap-3">
                <Input
                  type="text"
                  className="h-14 px-6 bg-white/10 border-white/10 text-white font-black tracking-[0.2em] rounded-2xl flex-1 focus:ring-8 focus:ring-red-600/20 focus:border-red-600/40 outline-none transition-all"
                  placeholder="Defina a senha"
                  value={secPwd}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecPwd(e.target.value)}
                />
                <button
                  onClick={generateRandomPassword}
                  className="w-14 h-14 bg-red-600 text-white rounded-2xl hover:bg-red-700 hover:rotate-180 transition-all duration-700 flex items-center justify-center shrink-0 shadow-[0_8px_25px_rgba(220,38,38,0.4)] hover:shadow-[0_12px_35px_rgba(220,38,38,0.6)] relative overflow-hidden group"
                  title="Gerar Senha Forte"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <svg className="w-6 h-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic leading-tight mt-2 flex items-center gap-2">
                <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                Automação de segurança para obreiros
              </p>
            </div>

            <button
              onClick={handleSaveSecPwd}
              disabled={secPwdStatus !== 'idle'}
              className={`group relative w-full h-16 rounded-xl font-black text-base uppercase tracking-[0.15em] transition-all duration-300 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.3)] ${secPwdStatus === 'saved'
                ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white shadow-[0_8px_30px_rgb(5,150,105,0.3)]'
                : secPwdStatus === 'saving'
                  ? 'bg-white text-slate-900 opacity-75 cursor-not-allowed'
                  : 'bg-white text-slate-900 hover:bg-red-600 hover:text-white hover:scale-[1.01] active:scale-[0.99] hover:shadow-[0_12px_40px_rgba(220,38,38,0.3)]'
                }`}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 group-hover:via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>

              {/* Glowing border effect */}
              <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300 ${secPwdStatus === 'saved'
                ? 'bg-emerald-400'
                : 'bg-red-500'
                }`}></div>

              <span className="relative z-10 flex items-center justify-center gap-3">
                {secPwdStatus === 'saved' ? (
                  <>
                    <svg className="w-5 h-5 animate-bounce-short" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Segurança Atualizada!
                  </>
                ) : secPwdStatus === 'saving' ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Validando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A3.33 3.33 0 0018.377 2.864l-1.04-.451a3.333 3.333 0 01-2.071-2.071l-.451-1.04a3.33 3.33 0 00-6.103 0l-.451 1.04a3.333 3.333 0 01-2.071 2.071l-1.04.451a3.33 3.33 0 00-1.748 4.292l.451 1.04a3.333 3.333 0 010 2.846l-.451 1.04a3.33 3.33 0 001.748 4.292l1.04.451a3.333 3.333 0 012.071 2.071l.451 1.04a3.33 3.33 0 006.103 0l.451-1.04a3.333 3.333 0 012.071-2.071l1.04-.451a3.33 3.33 0 001.748-4.292l-.451-1.04a3.333 3.333 0 010-2.846l.451-1.04a3.33 3.33 0 00-1.748-4.292l-1.04-.451z" />
                    </svg>
                    Efetivar Nova Chave
                  </>
                )}
              </span>
            </button>
          </div>
        </Card>
      </div>

      {/* Gestão de Permissões de Membros */}
      <Card className="p-8 md:p-12 !rounded-[3rem] space-y-10 border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100/50">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div>
              <h3 className="text-2xl font-heading font-black text-slate-900 tracking-tight italic uppercase">Gestão de Obreiros e Permissões</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Conceda acesso a módulos específicos para membros de confiança</p>
            </div>
          </div>
          <div className="w-full md:w-80">
            <Input
              type="text"
              placeholder="Buscar membro por nome ou e-mail..."
              value={memberSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberSearch(e.target.value)}
              className="h-14 px-6 bg-slate-100 border-slate-200 rounded-2xl font-black text-slate-800 text-sm focus:ring-8 focus:ring-amber-600/5 focus:border-amber-600/20 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map(member => (
            <div key={member.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-slate-400 text-lg shadow-sm border border-slate-100 group-hover:text-red-600 transition-colors">
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading font-black text-slate-900 truncate uppercase text-xs tracking-tight">{member.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">{member.email || 'Sem e-mail'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil Base</label>
                  <select
                    value={member.category}
                    onChange={(e) => updateRole(member, e.target.value as Role)}
                    className="w-full h-10 px-4 bg-white border border-slate-200 rounded-xl font-black text-[10px] text-slate-600 uppercase tracking-widest outline-none focus:ring-4 focus:ring-red-600/5 transition-all cursor-pointer"
                  >
                    <option value="Membro">Membro Comum</option>
                    <option value="Secretaria">Secretaria Geral</option>
                    <option value="Admin">Administrador Total</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Módulos Ativos</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: ViewType.DASHBOARD, label: 'Dashboard', icon: '📊' },
                        { id: ViewType.SECRETARIA, label: 'Secretaria', icon: '📝' },
                        { id: ViewType.TESOURARIA, label: 'Financeiro', icon: '💰' },
                        { id: ViewType.EBD, label: 'EBD', icon: '📖' },
                        { id: ViewType.CAMPO_MISSIONARIO, label: 'DP Missões', icon: '🌍' },
                        { id: ViewType.MIDIA, label: 'Mídia', icon: '🎬' },
                        { id: ViewType.RECEPCAO, label: 'Recepção', icon: '🤝' },
                        { id: ViewType.IA_ASSISTANT, label: 'IA Bíblica', icon: '✨' }
                      ].filter(tab => (member.customPermissions?.includes(tab.id) || member.category === 'Admin') && tab.id !== ViewType.APP_MEMBRO).map(tab => {
                        const isDefault = (member.category === 'Admin') || (member.category === 'Secretaria' && [ViewType.SECRETARIA, ViewType.CAMPO_MISSIONARIO].includes(tab.id));

                        return (
                          <div
                            key={tab.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[8px] uppercase tracking-widest transition-all bg-slate-900 text-white shadow-sm border border-slate-800 ${isDefault ? 'opacity-80' : 'hover:bg-red-600 hover:border-red-500 hover:scale-105'}`}
                          >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {!isDefault && (
                              <button
                                onClick={() => togglePermission(member, tab.id)}
                                className="ml-1 hover:text-white/60 transition-colors"
                                title="Remover Acesso"
                              >
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {!(member.customPermissions?.length) && member.category !== 'Admin' && (
                        <p className="text-[8px] text-slate-400 font-bold uppercase italic py-2 leading-none">Nenhum módulo manual ativo.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Adicionar Módulos</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: ViewType.DASHBOARD, label: 'Dashboard', icon: '📊' },
                        { id: ViewType.SECRETARIA, label: 'Secretaria', icon: '📝' },
                        { id: ViewType.TESOURARIA, label: 'Financeiro', icon: '💰' },
                        { id: ViewType.EBD, label: 'EBD', icon: '📖' },
                        { id: ViewType.CAMPO_MISSIONARIO, label: 'DP Missões', icon: '🌍' },
                        { id: ViewType.MIDIA, label: 'Mídia', icon: '🎬' },
                        { id: ViewType.RECEPCAO, label: 'Recepção', icon: '🤝' },
                        { id: ViewType.IA_ASSISTANT, label: 'IA Bíblica', icon: '✨' }
                      ].filter(tab => !member.customPermissions?.includes(tab.id) && member.category !== 'Admin').map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => togglePermission(member, tab.id)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-slate-400 border border-dashed border-slate-200 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 font-black text-[8px] uppercase tracking-widest transition-all"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredMembers.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Nenhum membro encontrado.</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-10 !rounded-[3rem] border-slate-100 shadow-sm">
        <h3 className="font-heading font-black text-slate-900 mb-6 flex items-center uppercase text-xs tracking-widest">
          <div className="w-2 h-6 bg-red-600 rounded-full mr-4"></div>
          Guia de Segurança para Administrador
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-slate-500 leading-relaxed">
          <div className="space-y-3 p-6 bg-slate-100 rounded-[2rem] border border-slate-200">
            <p className="font-heading font-black text-slate-900 uppercase tracking-widest">1. Senha da Secretaria</p>
            <p>O Administrador deve gerar e fornecer a senha para os obreiros autorizados. Recomenda-se trocar a senha a cada 30 dias para manter o controle absoluto dos acessos.</p>
          </div>
          <div className="space-y-3 p-6 bg-slate-100 rounded-[2rem] border border-slate-200">
            <p className="font-heading font-black text-slate-900 uppercase tracking-widest">2. Gerador Inteligente</p>
            <p>Utilize o botão de geração aleatória para criar combinações que evitam ataques de força bruta. Senhas geradas automaticamente são mais difíceis de serem adivinhadas.</p>
          </div>
          <div className="space-y-3 p-6 bg-slate-100 rounded-[2rem] border border-slate-200">
            <p className="font-heading font-black text-slate-900 uppercase tracking-widest">3. Acesso de Membros</p>
            <p>Lembre-se: Você não tem acesso às senhas pessoais dos membros. Eles as gerenciam de forma independente para garantir a privacidade de suas contas.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
