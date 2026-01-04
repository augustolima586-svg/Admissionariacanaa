# 🏛️ Admissionária Canaã

Sistema de gestão para a Assembleia de Deus Missionária Canaã, desenvolvido com React, TypeScript, Vite e Supabase.

## 🚀 Funcionalidades

- **Gestão de Membros**: Cadastro, edição e visualização de membros
- **Células**: Gerenciamento de células e grupos
- **EBD (Escola Bíblica Dominical)**: Controle de classes e frequência
- **Financeiro**: Gestão de transações e relatórios
- **Campos Missionários**: Acompanhamento de missões
- **Recepção/Portaria**: Registro de visitantes e decisões
- **Avisos e Comunicados**: Sistema de notificações
- **Mídia**: Galeria de fotos e vídeos
- **IA Assistente**: Integração com Gemini AI para suporte

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- Conta no [Supabase](https://supabase.com)
- Chave da API do [Google Gemini](https://ai.google.dev/)

## 🔧 Configuração Local

1. **Clone o repositório**
   ```bash
   git clone <seu-repositorio>
   cd copy-of-assembleia-de-deus-missionária-canãa
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   
   Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` e preencha com suas credenciais:
   ```env
   VITE_GEMINI_API_KEY=sua_chave_gemini_aqui
   VITE_SUPABASE_URL=sua_url_supabase_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_supabase_aqui
   ```

4. **Execute o projeto**
   ```bash
   npm run dev
   ```

   O aplicativo estará disponível em `http://localhost:5173`

## 🗄️ Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute os scripts SQL necessários para criar as tabelas (consulte a documentação do banco)
3. Copie a URL do projeto e a chave anônima (anon key) para o arquivo `.env`

## 🌐 Deploy na Vercel

### Primeira vez

1. Faça login na [Vercel](https://vercel.com)
2. Importe o repositório do GitHub
3. Configure as variáveis de ambiente no painel da Vercel:
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clique em "Deploy"

### Atualizações

Para enviar atualizações para o Vercel:

```bash
# Adicione as mudanças
git add .

# Faça o commit
git commit -m "Descrição das mudanças"

# Envie para o repositório
git push origin main
```

A Vercel detectará automaticamente as mudanças e fará o deploy.

## 🔨 Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

## 🧪 Testes

```bash
npm run test
```

## 📱 Capacitor (Mobile)

Este projeto está configurado para gerar apps mobile com Capacitor:

```bash
# Android
npx cap sync android
npx cap open android

# iOS
npx cap sync ios
npx cap open ios
```

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **IA**: Google Gemini
- **Maps**: Leaflet, React Leaflet
- **Charts**: Recharts
- **PDF**: jsPDF
- **Mobile**: Capacitor

## 📄 Licença

Este projeto é privado e destinado ao uso exclusivo da Assembleia de Deus Missionária Canaã.

## 🔗 Links

- **Deploy**: [https://admissionariacanaa.vercel.app/](https://admissionariacanaa.vercel.app/)
- **Supabase**: [https://supabase.com](https://supabase.com)
- **Vercel**: [https://vercel.com](https://vercel.com)
