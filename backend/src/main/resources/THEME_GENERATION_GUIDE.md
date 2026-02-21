# Guia para Geração de Novos Temas (Prompt LLM)

Use este guia como prompt para gerar novos arquivos de dados para o jogo. O objetivo é transformar um conjunto de fatos ou textos em arquivos JSON compatíveis com o sistema.

---

## 🤖 Prompt Base para LLM

**Contexto:** Você é um gerador de conteúdo para um jogo interativo que possui três modos: Roletrando (Roda a Roda), Show do Milhão e Quiz Multiplayer.

**Tarefa:** Com base no tema **[ESPECIFIQUE O TEMA AQUI]**, gere três blocos de código JSON seguindo as estruturas abaixo. Não use explicações, apenas os JSONs puros.

---

### 1. Estrutura Roletrando (`wheel.json`)
Array de objetos com "category" e "phrase". Mínimo 15 frases.
Categorias sugeridas: ANIMAIS, LUGARES, ESPORTES, FILMES, COMIDA, OBJETOS.
```json
[
  { "category": "CATEGORIA", "phrase": "FRASE EM MAIUSCULO" }
]
```

---

### 2. Estrutura Show do Milhão (`millionaire.json`)
Objeto raiz com campo `"levels"` contendo **exatamente 10 níveis**.
Cada nível tem: `level` (int, 1 a 10), `prize` (string), e `questions` (array com **mínimo 10 perguntas**).
Dificuldade cresce com o nível: nível 1 fácil, nível 10 muito difícil.

```json
{
  "levels": [
    {
      "level": 1,
      "prize": "R$ 1.000",
      "questions": [
        {
          "question": "Pergunta fácil sobre o tema?",
          "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
          "answer": 1
        }
      ]
    },
    {
      "level": 2,
      "prize": "R$ 5.000",
      "questions": [...]
    },
    ...
    {
      "level": 10,
      "prize": "R$ 1.000.000",
      "questions": [...]
    }
  ]
}
```

Prêmios sugeridos:
- Nível 1: R$ 1.000 | 2: R$ 5.000 | 3: R$ 10.000 | 4: R$ 25.000 | 5: R$ 50.000
- Nível 6: R$ 100.000 | 7: R$ 200.000 | 8: R$ 300.000 | 9: R$ 500.000 | 10: R$ 1.000.000

> **Regra do campo `answer`:** É o **índice** (0 a 3) da opção correta no array `options`.

---

### 3. Estrutura Quiz (`quiz.json`)
Array de 10 a 20 perguntas rápidas com `id`, `question`, `options` e `answer`.
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

1. Crie uma nova pasta em `backend/src/main/resources/data/{nome-do-tema}/`
2. Salve os três arquivos JSON (`wheel.json`, `millionaire.json`, `quiz.json`) dentro dela.
3. Em `backend/src/main/resources/application.properties`, altere a propriedade:
   ```
   game.theme={nome-do-tema}
   ```
4. Reinicie o backend. Os dados do novo tema serão carregados automaticamente.
