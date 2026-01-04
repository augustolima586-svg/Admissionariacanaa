import React from 'react';
import { Button } from './Button';
import { Card } from './Card';

const Celulas: React.FC = () => {
  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-heading font-black text-slate-900 tracking-tight italic">Mapa de Células</h2>
          <p className="text-slate-500 font-medium">Expansão e geolocalização da igreja.</p>
        </div>
        <Button className="w-full sm:w-auto h-touch bg-red-600 text-white px-8">
          Cadastrar Nova Célula
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-4 !rounded-[2.5rem] h-[500px] relative overflow-hidden border-slate-100 shadow-sm">
          {/* Mapa Placeholder Simulando Grounding */}
          <div className="w-full h-full bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center">
            <div className="p-5 bg-indigo-100 text-indigo-600 rounded-full mb-6">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth={2} /></svg>
            </div>
            <h4 className="font-heading font-black text-slate-800 text-lg mb-2 underline underline-offset-4 decoration-red-600/30">Visualização Geográfica Ativa</h4>
            <p className="text-sm text-slate-500 max-w-xs font-medium">Integrado ao Google Maps para mostrar densidade de membros e localizações de grupos familiares.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 text-[10px] font-black uppercase tracking-widest text-red-600">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> 12 Células Ativas
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                <span className="w-2 h-2 bg-indigo-600 rounded-full"></span> 3 Em Implantação
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <h3 className="font-heading font-black text-slate-400 uppercase text-[10px] tracking-widest ml-4">Relatórios Recentes</h3>
          {[
            { name: 'Célula Boas Novas', leader: 'Irmão Jonas', status: 'Crescendo', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            { name: 'Grupo Família Canaã', leader: 'Diác. Ana', status: 'Estável', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
            { name: 'Célula Redenção', leader: 'Pr. Marcos', status: 'Atenção', color: 'bg-red-50 text-red-600 border-red-100' },
            { name: 'Ponto de Luz', leader: 'Missionária Cláudia', status: 'Crescendo', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
          ].map((cell, i) => (
            <Card key={i} className="p-6 transition-all hover:shadow-lg border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-heading font-black text-slate-900 italic uppercase text-xs tracking-tight">{cell.name}</h4>
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${cell.color}`}>
                  {cell.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Líder: <span className="text-slate-600">{cell.leader}</span></p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between gap-3">
                <Button variant="outline" className="flex-1 h-touch text-[10px] px-0">Ver Mapa</Button>
                <Button variant="outline" className="flex-1 h-touch text-[10px] px-0">Relatório</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Celulas;
