
import React, { useState } from 'react';
import { sermonAssistant } from '../services/geminiService';

const AITools: React.FC = () => {
  const [theme, setTheme] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!theme) return;
    setIsLoading(true);
    const content = await sermonAssistant(theme);
    setResult(content);
    setIsLoading(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn">
      <header className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-50 to-amber-50 rounded-[2rem] mb-6 shadow-2xl shadow-red-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-100/50 to-amber-100/50 animate-pulse"></div>
          <img src="/logo-igreja.png?v=2" alt="Logo Admissionária Canaã" className="w-16 h-16 object-contain relative z-10 drop-shadow-lg" />
        </div>
        <h2 className="text-5xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-red-700 via-red-600 to-amber-600 italic tracking-tight mb-2">IA Admissionária</h2>
        <p className="text-slate-500 mt-3 font-bold text-base tracking-wide">Seu guia inteligente para estudos e auxílio bíblico.</p>
      </header>

      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-white to-red-50/30 p-12 md:p-16 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(185,28,28,0.15)] border border-red-100/50 flex flex-col items-center text-center relative overflow-hidden backdrop-blur-sm">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-400 to-red-500 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-red-500 to-amber-400 rounded-full blur-[60px] opacity-15 -ml-12 -mb-12"></div>

          {/* Dot Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #991b1b 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

          <div className="relative z-10 w-full">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-8 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-amber-500 rounded-full"></span>
              <h3 className="text-[10px] font-heading font-black text-red-600 uppercase tracking-[0.3em]">Consultoria Teológica</h3>
              <span className="w-8 h-0.5 bg-gradient-to-r from-amber-500 via-red-500 to-transparent rounded-full"></span>
            </div>
            <p className="text-sm text-slate-600 mb-10 font-semibold max-w-md mx-auto leading-relaxed">Esboços de sermões, significados de versículos e esclarecimento de dúvidas doutrinárias em segundos.</p>

            <div className="space-y-5 w-full">
              <div className="relative group">
                <textarea
                  placeholder="Digite o tema do sermão ou sua dúvida bíblica..."
                  className="w-full px-8 py-6 bg-white/80 backdrop-blur-sm border-2 border-red-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-400 transition-all text-sm font-semibold resize-none h-36 shadow-lg shadow-red-100/50 placeholder:text-slate-400"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                />
                <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-400 tracking-wider">
                  {theme.length}/500
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isLoading || !theme}
                className={`w-full py-6 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.15em] transition-all duration-300 shadow-2xl relative overflow-hidden group ${isLoading || !theme
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white shadow-red-300 hover:shadow-red-400 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      A IA está refletindo...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Gerar Resposta
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-red-100 animate-scaleUp relative overflow-hidden">
          {/* Decorative Corner Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100 to-transparent opacity-50 rounded-bl-[3rem]"></div>

          <div className="flex justify-between items-start mb-10 border-b-2 border-red-50 pb-8 relative z-10">
            <div>
              <h3 className="font-heading font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-red-700 to-red-900 italic tracking-tighter mb-1">Resultado da Consulta</h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">IA Admissionária - Canaã</p>
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(result);
                alert('Conteúdo copiado com sucesso!');
              }}
              className="px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 rounded-xl text-white text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth={2.5} /></svg>
              Copiar
            </button>
          </div>
          <div className="prose prose-slate prose-lg max-w-none whitespace-pre-wrap text-slate-700 font-medium leading-relaxed relative z-10">
            {result}
          </div>
        </div>
      )}
    </div>
  );
};

export default AITools;
