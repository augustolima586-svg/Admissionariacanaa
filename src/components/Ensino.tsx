
import React from 'react';

const Ensino: React.FC = () => {
  const schools = [
    { name: 'Escola Bíblica Dominical', manager: 'Pr. André', classes: 8, students: 124 },
    { name: 'Curso de Liderança', manager: 'Missionária Sarah', classes: 2, students: 45 },
    { name: 'Classe de Batismo', manager: 'Diác. Roberto', classes: 1, students: 12 },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-black text-slate-900 tracking-tight">Ensino & Formação</h2>
          <p className="text-slate-500 font-medium">Gestão de escolas, turmas e crescimento espiritual.</p>
        </div>
        <button className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all">
          Criar Escola
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {schools.map((school, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all border-b-4 border-b-yellow-400">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeWidth={2} /></svg>
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{school.classes} Turmas</span>
            </div>
            <h3 className="text-lg font-heading font-black text-slate-900 mb-1">{school.name}</h3>
            <p className="text-xs text-slate-500 font-bold mb-4">Gestor: {school.manager}</p>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <span className="text-xs font-black text-red-600">{school.students} Alunos</span>
              <button className="text-[10px] font-black uppercase text-slate-400 hover:text-red-600 transition-colors tracking-widest">Gerenciar</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
        <h3 className="text-xl font-heading font-black text-slate-900 mb-6">Turmas em Destaque</h3>
        <div className="space-y-4">
          {[
            { class: 'Adolescentes - Nível 1', teacher: 'Irmã Carla', pres: '92%', status: 'Ativa' },
            { class: 'Casais - Fortalecendo a Aliança', teacher: 'Prs. Nelson e Lúcia', pres: '88%', status: 'Finalizando' },
            { class: 'Novos Convertidos', teacher: 'Diác. Fábio', pres: '100%', status: 'Ativa' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors group">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-600 font-bold mr-4">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-heading font-black text-slate-800 text-sm">{item.class}</h4>
                  <p className="text-xs text-slate-500">Prof: {item.teacher}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className="text-xs font-black text-slate-700">{item.pres}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Frequência</p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-lg transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" strokeWidth={3} /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Ensino;
