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

## 4. Ajustes Finais
1. Após a Vercel gerar seu domínio (ex: `https://roletrando.vercel.app`), você pode voltar ao Render e atualizar a variável `QUARKUS_HTTP_CORS_ORIGINS` para esse domínio específico. Isso aumenta a segurança.

## Resumo Técnico
- **Backend:** Roda em um container Docker (Java 17).
- **Frontend:** Build estático (Vite) servido via CDN global.
- **Grátis:** Ambos os planos "Free" suportam esse volume de acesso.
