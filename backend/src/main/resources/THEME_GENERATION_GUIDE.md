# Guia para Geração de Novos Temas (Prompt LLM)

Use este guia como prompt para gerar novos arquivos de dados para o jogo.

---

## 🤖 Prompt Base para LLM

**Contexto:** Você é um gerador de conteúdo para um jogo interativo que possui três modos: Roletrando (Roda a Roda), Show do Milhão e Quiz Multiplayer.

**Tarefa:** Com base no tema **[ESPECIFIQUE O TEMA AQUI]**, gere três blocos de código JSON seguindo as estruturas abaixo. Não use explicações, apenas os JSONs puros.

---

### 1. Estrutura Roletrando (`wheel.json`)
Array com `"category"` e `"phrase"`. Mínimo 15 frases. Frases em MAIÚSCULO.
```json
[
  { "category": "ANIMAIS", "phrase": "CAVALO MARINHO" }
]
```

---

### 2. Estrutura Show do Milhão (`millionaire.json`)
Objeto com campo `"levels"` contendo **exatamente 10 níveis** (level 1 a 10).
Cada nível tem `level`, `prize` e `questions` com **mínimo 10 perguntas** (`question`, `options`[4], `answer` índice 0-3).
Dificuldade cresce com o nível.

```json
{
  "levels": [
    {
      "level": 1,
      "prize": "R$ 1.000",
      "questions": [
        { "question": "Pergunta fácil?", "options": ["A", "B", "C", "D"], "answer": 0 }
      ]
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

**Prêmios:** N1: R$ 1.000 | N2: R$ 5.000 | N3: R$ 10.000 | N4: R$ 25.000 | N5: R$ 50.000 | N6: R$ 100.000 | N7: R$ 200.000 | N8: R$ 300.000 | N9: R$ 500.000 | N10: R$ 1.000.000

---

### 3. Estrutura Quiz (`quiz.json`)
Objeto com campo `"levels"` contendo **3 níveis** de dificuldade.
Cada nível tem `level` (1-3), `label` ("Fácil"/"Médio"/"Difícil") e `questions` com **mínimo 10 perguntas**.

```json
{
  "levels": [
    {
      "level": 1,
      "label": "Fácil",
      "questions": [
        { "question": "Pergunta?", "options": ["A", "B", "C", "D"], "answer": 2 }
      ]
    },
    {
      "level": 2,
      "label": "Médio",
      "questions": [...]
    },
    {
      "level": 3,
      "label": "Difícil",
      "questions": [...]
    }
  ]
}
```

> **Regra do campo `answer`:** índice (0 a 3) da opção correta no array `options`.

---

## 📁 Como Aplicar o Tema no Projeto

### Opção 1: Seleção via Interface (Recomendado)
1. Crie a pasta `backend/src/main/resources/data/{nome-do-tema}/`
2. Salve os três arquivos (`wheel.json`, `millionaire.json`, `quiz.json`) dentro dela.
3. Reinicie o backend — o novo tema será detectado automaticamente.
4. Na **tela principal do jogo**, use o seletor **"TEMA DO JOGO"** para escolher o tema desejado.
5. Todos os jogos (Roletrando, Show do Milhão, Quiz) carregarão conteúdo do tema selecionado.

### Opção 2: Configurar o tema padrão (application.properties)
Em `backend/src/main/resources/application.properties`, configure:
```
game.theme={nome-do-tema}
```
O tema configurado aqui será o padrão exibido na interface e usado como fallback.
