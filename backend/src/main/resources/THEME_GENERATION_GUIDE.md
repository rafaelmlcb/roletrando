# Guia para Geração de Novos Temas (Prompt LLM)

Use este guia como prompt para gerar novos arquivos de dados para o jogo. O objetivo é transformar um conjunto de fatos ou textos em arquivos JSON compatíveis com o sistema.

---

## 🤖 Prompt Base para LLM

**Contexto:** Você é um gerador de conteúdo para um jogo interativo que possui três modos: Roletrando (Roda a Roda), Show do Milhão e Quiz Multiplayer.

**Tarefa:** Com base no tema **[ESPECIFIQUE O TEMA AQUI]**, gere três blocos de código JSON seguindo as estruturas abaixo. Não use explicações, apenas os JSONs puros.

### 1. Estrutura Roletrando (`wheel.json`)
Deve conter um array de objetos com "category" e "phrase". Gere pelo menos 15 frases.
```json
[
  { "category": "CATEGORIA", "phrase": "FRASE OU PALAVRA" }
]
```

### 2. Estrutura Show do Milhão (`millionaire.json`)
Deve conter um array de exatamente 15 perguntas com dificuldade crescente.
- "question": string
- "options": array de 4 strings
- "answer": índice da resposta correta (0 a 3)
```json
[
  {
    "question": "Pergunta?",
    "options": ["Opção 0", "Opção 1", "Opção 2", "Opção 3"],
    "answer": 1
  }
]
```

### 3. Estrutura Quiz (`quiz.json`)
Deve conter um array de 10 a 20 perguntas rápidas.
- "id": número sequencial
- "question": string
- "options": array de 4 strings
- "answer": índice da resposta correta (0 a 3)
```json
[
  {
    "id": 1,
    "question": "Pergunta?",
    "options": ["Opção 0", "Opção 1", "Opção 2", "Opção 3"],
    "answer": 2
  }
]
```

---

## 📁 Como Aplicar o Tema no Projeto

1. Crie uma nova pasta em `backend/src/main/resources/data/{nome-do-tema}/`.
2. Salve os três arquivos JSON (`wheel.json`, `millionaire.json`, `quiz.json`) dentro desta pasta.
3. No arquivo `backend/src/main/resources/application.properties`, altere a linha:
   `game.theme={nome-do-tema}`
4. Reinicie o backend. Os novos dados serão carregados automaticamente na memória.
