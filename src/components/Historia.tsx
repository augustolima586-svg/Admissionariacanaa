import React from 'react';
import { Card } from './Card';

const Historia: React.FC = () => {
  const credos = [
    {
      id: 1,
      text: "Que a Bíblia é a resposta de tudo",
      ref: "2Tm 3:16,17",
      verse: "Toda a Escritura é inspirada por Deus e útil para o ensino, para a repreensão, para a correção e para a instrução na justiça, para que o homem de Deus seja apto e plenamente preparado para toda boa obra."
    },
    {
      id: 2,
      text: "Em um só Deus, subsistente em três pessoas: Pai, Filho e Espírito Santo",
      ref: "Dt 6:4",
      verse: "Ouve, Israel, o Senhor nosso Deus é o único Senhor."
    },
    {
      id: 3,
      text: "No novo nascimento pela graça e o poder atuante do Espírito Santo, tornando o homem aceito no reino dos céus",
      ref: "Ef 2:8,9",
      verse: "Porque pela graça sois salvos, mediante a fé; e isto não vem de vós; é dom de Deus; não de obras, para que ninguém se glorie."
    },
    {
      id: 4,
      text: "No batismo nas águas como símbolo de confissão de fé. Realizado por imersão, uma única vez",
      ref: "Mt 28:19",
      verse: "Portanto, ide e fazei discípulos de todas as nações, batizando-os em nome do Pai, e do Filho, e do Espírito Santo."
    },
    {
      id: 5,
      text: "Na atualidade dos dons espirituais para edificação da igreja",
      ref: "1Co 12:1-12",
      verse: "Ora, há diversidade de dons, mas o Espírito é o mesmo. E há diversidade de ministérios, mas o Senhor é o mesmo. E há diversidade de operações, mas é o mesmo Deus que opera tudo em todos."
    },
    {
      id: 6,
      text: "Na segunda vinda de Cristo, no arrebatamento da igreja",
      ref: "Jo 14:1-3",
      verse: "Não se perturbe o coração de vocês. Creiam em Deus; creiam também em mim. Na casa de meu Pai há muitas moradas; se não fosse assim, eu lhes teria dito. Vou preparar lugar para vocês. E, quando eu for e preparar lugar, voltarei e os levarei para mim, para que vocês estejam onde eu estiver."
    },
    {
      id: 7,
      text: "No juízo final",
      ref: "Ap 21:1-4",
      verse: "E vi um novo céu e uma nova terra, pois o primeiro céu e a primeira terra tinham passado, e o mar já não existia. Vi a Cidade Santa, a nova Jerusalém, que descia dos céus, da parte de Deus, preparada como uma noiva adornada para o seu marido. Ouvi uma forte voz que vinha do trono e dizia: 'Agora o tabernáculo de Deus está com os homens, com os quais ele viverá. Eles serão os seus povos; o próprio Deus estará com eles e será o seu Deus. Ele enxugará dos seus olhos toda lágrima. Não haverá mais morte, nem tristeza, nem choro, nem dor, pois a antiga ordem já passou'."
    },
    {
      id: 8,
      text: "Casamento instituído por Deus",
      ref: "Gn 2:18",
      verse: "Disse o Senhor Deus: Não é bom que o homem esteja só; farei para ele uma auxiliadora que lhe seja semelhante."
    },
    {
      id: 9,
      text: "Todo obreiro precisa ser provado",
      ref: "2Tm 2:15",
      verse: "Procura apresentar-te a Deus aprovado, como obreiro que não tem de que se envergonhar, que maneja bem a palavra da verdade."
    },
    {
      id: 10,
      text: "Que o serviço no reino de Deus deve ser executado com excelência e honra",
      ref: "Jr 48:10",
      verse: "Maldito aquele que fizer a obra do Senhor relaxadamente! Maldito aquele que retém a sua espada do sangue!"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn pb-20">
      <header className="text-center space-y-4">
        <div className="inline-block px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-2">
          Nossa Origem
        </div>
        <h2 className="text-4xl md:text-5xl font-heading font-black text-slate-900 tracking-tighter italic leading-tight">
          Assembleia de Deus <br /> <span className="text-red-600">Missionária Canaã</span>
        </h2>
        <p className="text-slate-500 font-bold text-lg uppercase tracking-tight">
          Vivendo o Reino de Deus em poder e amor.
        </p>
      </header>

      <Card className="p-10 md:p-14 !rounded-[3.5rem] relative overflow-hidden border-slate-100 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>

        <h3 className="text-xl font-heading font-black text-slate-800 mb-8 flex items-center uppercase tracking-widest text-xs">
          <div className="w-2 h-6 bg-red-600 rounded-full mr-4"></div>
          Nossa História
        </h3>

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="lg:w-1/2 space-y-6">
            <div className="prose prose-slate max-w-none space-y-6 text-slate-600 font-medium leading-relaxed text-lg">
              <p className="font-black text-slate-900 italic">Tudo começou no dia 10/03/2019, mediante Deus.</p>

              <p>A igreja começou como um sonho que nasceu primeiro no coração de Deus e depois no coração do Pastor Vladimir Gomes e da sua esposa Jociane Arruda Gomes.</p>

              <p>Nosso Pastor, o qual sempre foi apaixonado por ovelhas, abraçou o sonho de Deus e, aos poucos, foi de lar em lar em busca de famílias que precisavam de cuidado e amor, mostrando o credo da Assembleia de Deus Missionária Canaã.</p>

              <p>E, dessa forma, o Senhor trabalhou unindo pessoas que estavam com o anseio de viver o Reino dEle e propagar as boas novas do Evangelho. Com isso, no dia 10 de março de 2019 foi realizado o 1° culto da Assembleia de Deus Missionária Canaã, para honra e glória de Deus, cumprindo as promessas do nosso Senhor ao Pr. Vladimir Gomes e sua família.</p>
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="relative group">
              <div className="absolute -inset-2 bg-red-600/10 rounded-[2.5rem] blur-xl group-hover:bg-red-600/20 transition-all"></div>
              <img
                src="https://i.postimg.cc/HLcnHvvb/Whats_App_Image_2025_12_29_at_17_23_55.jpg"
                alt="Família Pastoral - Pr. Vladimir Gomes e Pra. Jociane Arruda"
                className="relative w-full h-auto rounded-[2rem] shadow-2xl border-4 border-white grayscale-[20%] hover:grayscale-0 transition-all duration-700 object-cover"
              />
              <div className="mt-4 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Família Pastoral</p>
                <p className="text-xs font-bold text-slate-600 italic">"Servindo ao Senhor com alegria e dedicação"</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <section className="space-y-8">
        <div className="flex items-center justify-center space-x-4">
          <div className="h-px flex-1 bg-slate-200"></div>
          <h3 className="text-sm font-heading font-black text-slate-400 uppercase tracking-[0.4em]">Os Nossos Credos</h3>
          <div className="h-px flex-1 bg-slate-200"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {credos.map((credo) => (
            <Card key={credo.id} className="p-6 transition-all group relative border-slate-100 hover:border-red-200 hover:shadow-xl hover:shadow-red-50">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-red-600 transition-colors">
                  {credo.id}
                </div>
                <div className="relative flex-1">
                  <p className="text-slate-800 font-bold text-sm leading-snug mb-2">
                    {credo.text}
                  </p>
                  <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-widest cursor-help inline-block">
                    {credo.ref}
                  </span>

                  {/* Tooltip Versículo */}
                  <div className="absolute z-[100] left-0 top-full mt-2 w-72 p-5 bg-slate-900 text-white text-[11px] leading-relaxed rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 border border-white/10">
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-900 rotate-45 border-l border-t border-white/10"></div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeWidth={2} /></svg>
                      <div>
                        <p className="font-medium italic text-slate-200">"{credo.verse}"</p>
                        <p className="mt-3 font-black text-red-500 uppercase tracking-[0.2em] text-[9px]">{credo.ref}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Historia;
