
import React, { useState } from 'react';
import { ViewType, Role, Member } from '../types';
import { supabase } from '../services/supabase';
import { Button } from './Button';
import { Input } from './Input';

interface LoginProps {
  onLogin: (name: string, role: Role, customPermissions?: ViewType[]) => void;
  onRegister: (m: Omit<Member, 'id' | 'contributions'>) => Promise<any>;
  logoUrl: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, logoUrl }: LoginProps) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [baptismDate, setBaptismDate] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cep, setCep] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('Membro');
  const [autoLogin, setAutoLogin] = useState(true);
  const [pais, setPais] = useState('Brasil');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('Adulto');

  const ageGroups = ["Criança 3 a 5 anos", "Criança de 6 a 11 anos", "Adolescente", "Jovem", "Adulto"];

  const calculateAgeGroup = (dob: string): string => {
    if (!dob) return 'Adulto';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    if (age <= 12) return 'Criança';
    if (age <= 17) return 'Adolescente';
    if (age <= 29) return 'Jovem';
    return 'Adulto';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (selectedRole === 'Admin') {
        if (email === 'admissionariacanaa19@gmail.com' && password === 'admissionaria') {
          onLogin('ADMINISTRADOR', 'Admin');
        } else {
          setError('Credenciais de Administrador incorretas.');
        }
        return;
      }

      if (selectedRole === 'Secretaria') {
        const { data: secData } = await supabase.from('settings').select('value').eq('key', 'secretaria_pwd').single();
        const secPwd = secData?.value || 'canaa2025';
        if (password === secPwd) {
          onLogin('Secretaria Geral', 'Secretaria');
        } else {
          setError('Senha da Secretaria inválida.');
        }
        return;
      }

      if (selectedRole === 'Membro') {
        if (isRegistering) {
          if (!name || !email || !password || !whatsapp) {
            setError('Preencha os campos obrigatórios.');
            return;
          }

          const newMemberData = {
            name,
            email,
            phone: whatsapp,
            status: 'Frequentador',
            category: 'Membro',
            congregacao: 'Sede',
            ageGroup: selectedAgeGroup,
            joinDate: new Date().toISOString().split('T')[0],
            birthDate,
            baptismDate,
            rua,
            numero,
            bairro,
            cep,
            country: pais,
            password: password
          };

          const errorMsg = await onRegister(newMemberData as any);

          if (errorMsg) {
            setError('Falha ao registrar: ' + (errorMsg.message || 'Erro ao salvar no banco de dados.'));
          } else {
            if (autoLogin) {
              onLogin(name, 'Membro');
            } else {
              alert('Cadastro realizado com sucesso! Use seu e-mail e senha para acessar.');
              setIsRegistering(false);
              setPassword('');
            }
          }
        } else {
          const { data, error: loginErr } = await supabase
            .from('members')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();

          if (data) {
            onLogin(data.name, 'Membro', data.custom_permissions);
          } else {
            setError('E-mail ou senha incorretos.');
          }
        }
      }
    } catch (err) {
      setError('Erro crítico de autenticação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden p-4 md:p-6 font-sans">
      {/* Background Blobs - Professional Glow */}
      <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] bg-red-500/5 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-red-400/5 rounded-full blur-[80px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '4s' }}></div>

      <div className="w-full max-w-[480px] bg-white rounded-[2.5rem] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)] border border-slate-200 relative z-10 overflow-hidden">

        {/* Premium Header */}
        <div className="bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 p-10 text-white flex flex-col items-center relative overflow-hidden border-b border-white/5">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
          </div>
          <div className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-3xl p-5 flex items-center justify-center border border-white/10 shadow-2xl mb-6 relative z-10 transition-all hover:scale-105 hover:rotate-3 duration-500">
            <img
              src={logoUrl}
              alt="Logo"
              className="w-full h-full object-contain filter brightness-110 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
              onError={(e) => e.currentTarget.src = "https://ui-avatars.com/api/?name=AD&background=ef4444&color=ffffff"}
            />
          </div>
          <div className="text-center relative z-10">
            <h1 className="text-3xl font-heading font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-amber-100 drop-shadow-sm">AD Missionária Canaã</h1>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-4">Plataforma de Gestão Ministerial</p>
          </div>
        </div>

        <form onSubmit={handleAuth} className="p-5 md:p-8 space-y-6 max-w-full overflow-x-hidden">

          {/* Segmented Control */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
            <div className="grid grid-cols-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
              {(['Membro', 'Secretaria', 'Admin'] as Role[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role);
                    setIsRegistering(false);
                    setError('');
                  }}
                  className={`py-3 text-[10px] font-black rounded-xl transition-all duration-300 uppercase tracking-[0.1em]
                    ${selectedRole === role
                      ? 'bg-red-600 text-white shadow-lg shadow-red-200 ring-1 ring-red-500 scale-[1.02]'
                      : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-primary-light border border-primary/20 text-primary-text text-xs font-bold rounded-xl flex items-center gap-3">
              <div className="w-1 h-8 bg-primary-glow rounded-full"></div>
              {error}
            </div>
          )}

          <div className="space-y-6">
            {isRegistering && selectedRole === 'Membro' ? (
              <div className="space-y-8 animate-fadeIn">

                {/* Seção Pessoal */}
                <div className="space-y-4">
                  <h2 className="text-sm font-heading font-black text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs border border-red-200 shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </span>
                    Dados Pessoais
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nome Completo</label>
                      <Input
                        className="h-14 px-6 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-900 text-sm focus:ring-8 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all placeholder:text-slate-300"
                        placeholder="Digite seu nome completo"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nascimento</label>
                        <Input
                          type="date"
                          className="h-14 px-6 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-900 text-sm focus:ring-8 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all"
                          value={birthDate}
                          onChange={e => {
                            setBirthDate(e.target.value);
                            setSelectedAgeGroup(calculateAgeGroup(e.target.value));
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Faixa Etária</label>
                        <select
                          className="w-full h-14 px-6 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-900 text-xs uppercase tracking-widest focus:ring-8 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all appearance-none cursor-pointer"
                          value={selectedAgeGroup}
                          onChange={e => setSelectedAgeGroup(e.target.value)}
                          required
                        >
                          {ageGroups.map(ag => <option key={ag} value={ag} className="bg-white">{ag}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">País de Origem</label>
                      <Input
                        className="h-14 px-6 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-900 text-sm focus:ring-8 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all placeholder:text-slate-300"
                        placeholder="Ex: Brasil"
                        value={pais}
                        onChange={e => setPais(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">E-mail de Acesso</label>
                        <Input
                          type="email"
                          className="h-14 px-6 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-900 text-sm focus:ring-8 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all placeholder:text-slate-300"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Senha de Segurança</label>
                        <Input
                          type="password"
                          className="h-14 px-6 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-900 text-sm focus:ring-8 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all placeholder:text-slate-300"
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Célular / WhatsApp</label>
                        <Input
                          type="tel"
                          className="h-14 px-6 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-900 text-sm focus:ring-8 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all placeholder:text-slate-300"
                          placeholder="(00) 00000-0000"
                          value={whatsapp}
                          onChange={e => setWhatsapp(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção Endereço */}
                <div className="space-y-4">
                  <h2 className="text-sm font-heading font-black text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xs border border-amber-200 shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </span>
                    Endereço
                  </h2>

                  <div className="flex flex-col gap-4">
                    <div className="w-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Rua / Avenida</label>
                      <Input
                        className="h-14 px-4 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-900 text-sm focus:ring-8 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all placeholder:text-slate-300 w-full"
                        placeholder="Rua / Avenida"
                        value={rua}
                        onChange={e => setRua(e.target.value)}
                      />
                    </div>
                    <div className="w-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Número</label>
                      <Input
                        className="h-14 px-4 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-900 text-sm focus:ring-8 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all placeholder:text-slate-300 w-full"
                        placeholder="Número"
                        value={numero}
                        onChange={e => setNumero(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Bairro</label>
                      <Input
                        className="h-14 px-6 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-900 text-sm focus:ring-8 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all placeholder:text-slate-300"
                        placeholder="Bairro"
                        value={bairro}
                        onChange={e => setBairro(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">CEP</label>
                      <Input
                        className="h-14 px-6 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-900 text-sm focus:ring-8 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all placeholder:text-slate-300"
                        placeholder="00000-000"
                        value={cep}
                        onChange={e => setCep(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Login Automático */}
                <div className="flex items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">Login Automático</p>
                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">Entrar ao finalizar o cadastro</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={autoLogin} onChange={() => setAutoLogin(!autoLogin)} />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 shadow-sm"></div>
                  </label>
                </div>

              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                    {selectedRole === 'Membro' ? 'E-mail Cadastrado' : 'Identificação do Gestor'}
                  </label>
                  <Input
                    className="h-14 px-6 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-900 text-sm focus:ring-8 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all placeholder:text-slate-300"
                    placeholder={selectedRole === 'Admin' ? 'admin@exemplo.com' : 'exemplo@email.com'}
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Senha de Segurança</label>
                  <Input
                    type="password"
                    className="h-14 px-6 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-900 text-sm focus:ring-8 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all placeholder:text-slate-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full h-16 bg-gradient-to-r from-red-600 to-red-900 text-white rounded-2xl font-black text-base uppercase tracking-[0.15em] shadow-lg shadow-red-900/20 transition-all duration-300 flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99] hover:shadow-red-600/30'}`}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>

              {/* Glowing border effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-light via-primary-glow to-primary opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>

              <span className="relative z-10 flex items-center justify-center gap-3">
                {isSubmitting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Autenticando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    {isRegistering ? 'Finalizar Cadastro' : 'Acessar Conta'}
                  </>
                )}
              </span>
            </button>
          </div>

          {selectedRole === 'Membro' && !isSubmitting && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="text-[10px] font-black text-slate-400 hover:text-red-600 uppercase tracking-[0.2em] transition-all py-2 hover:scale-105"
              >
                {isRegistering ? 'Já tenho conta? Acessar Portal' : 'Criar nova conta ministerial'}
              </button>
            </div>
          )}
        </form>
      </div >
    </div >
  );
};

export default Login;
