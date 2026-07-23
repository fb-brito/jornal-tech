# Jornal Tech

Jornal Tech é uma aplicação web moderna construída com Next.js que automatiza a criação de um portal de notícias de tecnologia. O sistema permite extrair conteúdo diretamente de postagens do Xiaohongshu e utilizar modelos de Inteligência Artificial para gerar matérias jornalísticas completas e bem estruturadas em Português do Brasil (PT-BR).

## Tecnologias e Funcionalidades

- **Next.js**: Framework principal com App Router.
- **Banco de Dados Neon (PostgreSQL)**: Armazenamento persistente para todas as matérias extraídas, incluindo dados JSONB para carrosséis de imagens.
- **OpenRouter AI**: Integração com modelos avançados (Gemma, Laguna, OpenAI, etc.) para transformar dados crus em artigos ricos em Markdown, incluindo diagramas automáticos (Mermaid).
- **Extração Avançada de Mídia**:
  - Extração de metadados diretamente do `__INITIAL_STATE__` do Xiaohongshu.
  - Para vídeos, a miniatura em alta resolução é salva localmente.
  - Para posts de imagens, o sistema baixa automaticamente todas as imagens da galeria e as armazena no servidor local, montando um carrossel interativo na página da matéria.
- **PWA (Progressive Web App)**: Configurado via `next-pwa` para instalação e uso offline.
- **Renderização Markdown**: Utiliza `react-markdown` com suporte nativo a diagramas `mermaid` via componente customizado.

## Como Iniciar (Ambiente de Desenvolvimento)

1. **Instalação das dependências:**
   ```bash
   npm install
   ```

2. **Configuração das Variáveis de Ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto com as seguintes chaves:
   ```env
   DATABASE_URL="postgres://usuario:senha@endereco-do-neon.neon.tech/jornaltech_db?sslmode=require"
   OPENROUTER_API_KEY="sk-or-v1-..."
   # ROOM_DATABASE_URL="..." (Opcional, usado para travas de segurança)
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000) no seu navegador. A aplicação pode rodar na porta 3001 caso a 3000 esteja ocupada.

## Estrutura do Projeto

- `src/app/api/extract/route.ts`: Motor principal de extração web, download inteligente de imagens para o disco e processamento com múltiplos modelos de Inteligência Artificial em cascata.
- `src/components/ArticleContent.tsx`: Renderizador da matéria, responsável pelo parse de Markdown, injeção visual dos diagramas e estruturação do carrossel fotográfico.
- `src/lib/db.ts`: Gerenciamento da conexão Serverless com o banco de dados Neon.
- `public/uploads/`: Diretório local onde as imagens extraídas são salvas automaticamente. Arquivos aqui são ignorados pelo Git, mantendo o repositório leve.
- `docs/design.md`: Documento de fundação contendo o Design System e diretrizes de tema do projeto.
