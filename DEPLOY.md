# Roletrando - Guia de Deploy

Siga este guia para colocar o seu jogo online gratuitamente usando **Render** (Backend) e **Vercel** (Frontend).

## 1. Preparação (Obrigatório)
1. Coloque seu código em um repositório no **GitHub**.
2. Certifique-se de que a estrutura de pastas no GitHub seja igual à local:
   - `/backend`
   - `/frontend`
   - `render.yaml` (na raiz)

---

## 2. Deploy do Backend (Render)
O Render usará o arquivo `render.yaml` que já configurei para você.

1. Crie uma conta no [Render.com](https://render.com).
2. No painel, clique em **"New"** -> **"Blueprint"**.
3. Conecte seu repositório do GitHub.
4. O Render lerá o arquivo `render.yaml` e criará o serviço automaticamente.
5. **Importante:** Após o deploy terminar, o Render te dará uma URL (ex: `https://roletrando-backend.onrender.com`). **Copie essa URL.**

---

## 3. Deploy do Frontend (Vercel)
A Vercel é a melhor casa para o React.

1. Crie uma conta na [Vercel.com](https://vercel.com).
2. Clique em **"Add New"** -> **"Project"**.
3. Importe seu repositório do GitHub.
4. Nas configurações da Vercel:
   - **Root Directory:** selecione a pasta `frontend`.
   - **Environment Variables:** Adicione uma variável:
     - **Key:** `VITE_API_URL`
     - **Value:** `https://SUA-URL-DO-RENDER.onrender.com/api/game` (A URL que você copiou no passo 2).
5. Clique em **"Deploy"**.

---

## 4. Ajustes Finais (Segurança OWASP)
1. **Whitelist de CORS:** Por padrão, o backend bloqueia todas as origens exceto localhost. Para habilitar o acesso pela URL da Vercel, você deve adicionar seu domínio (ex: `https://roletrando.vercel.app`) à lista `ALLOWED_ORIGINS` no arquivo `backend/src/main/java/com/rafael/config/CorsFilter.java`.
2. **SSL/HTTPS:** O Render e a Vercel gerenciam certificados SSL automaticamente. O código do frontend já está configurado para ajustar dinamicamente o protocolo WebSocket para `wss://` quando detecta HTTPS, garantindo a conformidade com as políticas de Mixed Content.

## Resumo Técnico
- **Backend:** Roda em um container Docker (Java 17).
- **Frontend:** Build estático (Vite) servido via CDN global.
- **Grátis:** Ambos os planos "Free" suportam esse volume de acesso.
- **Compliance:** Sistema protegido com Headers de Segurança e validação de pacotes WS.
