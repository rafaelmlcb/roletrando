# Documentação de Arquitetura e Decisões de Design (ADRs)

Este documento centraliza as decisões de arquitetura e os requisitos não-funcionais adotados para o projeto **Game (Roletrando, Quiz e Millionaire)**.

## 1. Visão Geral da Arquitetura
O projeto segue o padrão cliente-servidor, sendo constituído por:
- **Frontend**: Aplicação React.js (construída com Vite) orientada a componentes.
- **Backend**: API REST em Java construída com Quarkus.

A comunicação entre eles é inteiramente baseada em JSON sobre HTTP (REST). O frontend consome os endpoints do backend e mantém o estado de apresentação, enquanto o backend detém a lógica de negócio principal (validação de palavras, pontuação, gerenciamento de estado da `GameSession`).

## 2. Stack Tecnológica

### Frontend
- **Framework**: React 19 + TypeScript.
- **Build Tool**: Vite (rápido, otimizado para HMR e suporte a PWA).
- **Estilização e Componentes**: Material UI (MUI) v6 e Tailwind CSS.
- **Animações**: Framer Motion.
- **Ícones**: Lucide React.
- **Requisições API**: Axios.

### Backend
- **Framework**: Quarkus (otimizado para tempo de inicialização e baixo uso de memória, ideal para ambientes serverless ou containerizados).
- **Linguagem**: Java 17+.
- **Build Tool**: Maven.
- **Logging**: JBoss Logging (SLF4J).

## 3. Requisitos Não Funcionais

- **Responsividade e UI/UX**: O jogo deve funcionar fluidamente no Desktop e Mobile, apresentando designs modernos (glassmorphism, cores vibrantes, modo escuro coeso).
- **Baixa Latência para Mídia**: Efeitos sonoros contínuos (roleta, cronômetros) não devem sofrer atrasos ou interrupções, mesmo durante eventos em rápida sucessão.
- **Observabilidade**: O sistema deve prover logs legíveis, tipados e com marcações de tempo que possibilitem debugging eficiente.
- **Acesso em Rede Local**: Os serviços devem estar prontos para serem testados via LAN por diversos dispositivos físicos (smartphones, tablets).

---

## 4. Registro de Decisões Arquiteturais (ADRs)

### ADR 001: Componente de Grid do Masterial UI (MUI v6)
**Contexto:** Erros de warning do React referenciando propriedades legadas do `Grid` (`xs`, `md`, `item`).
**Decisão:** Migrar de `Grid` (MUI v5) para o novo padrão de Grid do MUI v6 e superior. Remoção das propriedades `item` (agora o container controla o comportamento) e alteração das props de responsividade de `xs={12}` para o formato objeto `size={{ xs: 12 }}`.
**Consequência:** Código limpo sem warnings no console e layout previsível compatível com futuras versões do Material UI.

### ADR 002: Sistema de Áudio (Web Audio API & Node Cloning)
**Contexto:** O som da roleta ("ticker") do Roletrando travava ou sofria latência durante o giro rápido se o mesmo `Audio` object tentasse dar `play()` antes de finalizar a execução anterior.
**Decisão:** Implementação de `useSound` hook no React que:
1. Faz pre-load de todos os audios hospedados.
2. Utiliza `audio.cloneNode()` para sons frequentes (como o clique da roda a cada 36 graus).
**Consequência:** Sons sobrepostos perfeitos, sem latência. Tivemos que adicionar controle de Garbage Collector e volume específico para não sobrecarregar falantes de celulares.

### ADR 003: Acesso Múltiplo de Dispositivos (Rede Local e WSL)
**Contexto:** Acessar o ambiente de desenvolvimento usando o IP 192.168.x.x falhava devido à arquitetura de rede padrão do WSL2 e bind do Vite/Quarkus em `localhost`.
**Decisão:** 
- Configurar o Vite (`vite.config.ts`) com `server: { host: true }` para ouvir em `0.0.0.0`.
- Configurar o Quarkus (`application.properties`) com `quarkus.http.host=0.0.0.0`.
- Alterar hardcoded URLs (`http://localhost:8080`) no frontend para `window.location.hostname` dinâmico do navegador, permitindo que o device busque o backend no IP correto da rede local.
**Consequência:** Desenvolvimento PWA Mobile-First simplificado e validado com dispositivos reais.

### ADR 004: Padronização de Logging e Documentação Customizada
**Contexto:** A detecção de bugs no Frontend usava `console.log` disperso e o backend carecia de rastreamento de estado nas sessões da *GameEngine*.
**Decisão (Frontend):** Criação de um Singleton `Logger.ts` que suprime mensagens `DEBUG` unicamente com base na flag de build do Vite e encapsula outputs padronizados de níveis (INFO/WARN/ERROR) sem comprometer lints TypeScript de Erasable Syntax Enums (substituído por Objetos constantes literais).
**Decisão (Backend):** Utilização de SLF4J com formatação transacional e Javadoc detalhado em classes públicas (`GameSession`, `GameEngine`, `GameResource`).
**Consequência:** Rastreio de bugs direto sem poluição; O nível de segurança subiu por não vazar debug prints em build de Produção.

### ADR 005: Multiplayer em Tempo Real com WebSockets
**Contexto:** O projeto necessitava de evolução para suportar multi-jogadores simultâneos, abandonando simulações visuais em favor de sincronia real de pontuações, turnos e animações.
**Decisão (Arquitetura):** Migração do controle de estado do Client (React) para o Server (Quarkus) usando comunicação bidirecional full-duplex sobre WebSockets.
**Decisão (Backend):** Uso de `quarkus-websockets-next` gerindo um `@ServerEndpoint` e implementando um `RoomManager` thread-safe. O backend torna-se a Fonte Absoluta da Verdade (Source of Truth) emitindo eventos Broadcast.
**Decisão (Frontend):** Criação de um custom hook `useWebSocket` para reatividade local sem delay. A UI agora é uma projeção da `GameSession` do servidor (espelhando a Roleta, Letras e Placar).
**Consequência:** Arquitetura robusta para combater trapaças (cheats) e garantir sincronismo perfeito (latência <100ms) em LAN e WAN. O servidor (App Backend) introduziu um sistema de "Lobby" oficial, bloqueando acesso quando a partida inicia. Para o `Roletrando`, há limite de 3 pessoas e auto-completamento com bots. Para o `Quiz`, não há limites de usuários e não há preenchimento com bots, suportando dezenas de jogadores. Pavimentada a trilha final para adicionar o multiplayer no *Millionaire*.
