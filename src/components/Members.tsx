import React, { useState } from 'react';
import { Member } from '../types';

const mockMembers: Member[] = [
  // Fix: Added missing required 'contributions', 'congregacao', and 'ageGroup' properties
  { id: '1', name: 'Ricardo Santos', email: 'ricardo@email.com', phone: '(11) 98888-7777', status: 'Líder', category: 'Pastor', congregacao: 'Sede', ageGroup: 'Adulto', joinDate: '2015-05-10', contributions: 1200 },
  { id: '2', name: 'Maria Oliveira', email: 'maria@email.com', phone: '(11) 97777-6666', status: 'Membro', category: 'Membro', congregacao: 'Sede', ageGroup: 'Adulto', joinDate: '2018-02-15', contributions: 450 },
  { id: '3', name: 'João Pereira', email: 'joao@email.com', phone: '(11) 96666-5555', status: 'Visitante', category: 'Membro', congregacao: 'Sede', ageGroup: 'Adulto', joinDate: '2023-11-20', contributions: 0 },
  { id: '4', name: 'Ana Costa', email: 'ana@email.com', phone: '(11) 95555-4444', status: 'Membro', category: 'Diácono', congregacao: 'Sede', ageGroup: 'Adulto', joinDate: '2010-08-05', contributions: 800 },
  { id: '5', name: 'Lucas Lima', email: 'lucas@email.com', phone: '(11) 94444-3333', status: 'Frequentador', category: 'Membro', congregacao: 'Sede', ageGroup: 'Adulto', joinDate: '2019-12-01', contributions: 150 },
];

const Members: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = mockMembers.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-black text-slate-900">Membros</h2>
          <p className="text-slate-500">Gerencie a comunidade da igreja.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            Adicionar Novo
          </button>
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Membro</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cargo</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Desde</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm mr-3">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{member.name}</div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{member.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      // Fix: Updated status comparison to match valid MemberStatus type definitions instead of 'Ativo'/'Inativo'
                      member.status === 'Líder' || member.status === 'Membro' ? 'bg-green-100 text-green-700' :
                        member.status === 'Frequentador' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(member.joinDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button className="text-indigo-600 hover:text-indigo-900 font-medium">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Members;