# Roletrando - Projeto Multiplayer

Bem-vindo ao **Roletrando**, um sistema de jogos casuais (Roletrando, Quiz e Millionaire) com suporte a multiplayer em tempo real, temas dinâmicos e arquitetura robusta.

## 🚀 Como Executar

O projeto é dividido em dois grandes módulos:

- **[Backend (Quarkus)](./backend)**: API Java 17+ que gerencia a lógica de jogo e comunicações via WebSocket.
- **[Frontend (React)](./frontend)**: Interface moderna e responsiva construída com Vite e Material UI.

Consulte os READMEs internos de cada diretório para instruções específicas de build e dev mode.

## 🏗️ Arquitetura e Decisões Técnicas

Para detalhes sobre as escolhas tecnológicas, padrões de projeto e evolução do sistema, consulte:
👉 **[Decisões de Arquitetura (ADRs)](./architecture-decisions.md)**

### Destaques Recentes:
- **Temas Dinâmicos**: Suporte a temas customizados (ex: Jataí) com sistema de fallback inteligente para temas padrão.
- **Multiplayer WS**: Sincronização em tempo real entre players usando `quarkus-websockets-next`.

## 🛡️ Segurança e Conformidade OWASP

O projeto passou por um endurecimento de segurança rigoroso, seguindo as diretrizes da **OWASP**:

1.  **Whitelisting de CORS**: Proteção contra requisições de origens não autorizadas.
2.  **Security Headers**: Implementação de CSP (Content Security Policy), X-Frame-Options (proteção contra Clickjacking) e HSTS.
3.  **Input Validation**: Validação de nomes de usuários e salas em níveis de protocolo e aplicação.
4.  **SCA (Software Composition Analysis)**: Dependências verificadas e mitigadas contra vulnerabilidades conhecidas.
5.  **Type Safety**: Eliminação de tipos genéricos (`any`) em fluxos críticos de dados para prevenir runtime injections.

## 📄 Documentação Relacionada
- **[Guia de Deploy](./DEPLOY.md)**
- **[Guia de Geração de Temas](./backend/src/main/resources/THEME_GENERATION_GUIDE.md)**
