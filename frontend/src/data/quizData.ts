export interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    answer: number; // Index of the correct option
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        id: 1,
        question: "Qual é a cor resultante da mistura de azul e amarelo?",
        options: ["Roxo", "Verde", "Laranja", "Marrom"],
        answer: 1
    },
    {
        id: 2,
        question: "Qual animal é conhecido como o 'Rei da Selva'?",
        options: ["Tigre", "Elefante", "Leão", "Gorila"],
        answer: 2
    },
    {
        id: 3,
        question: "Qual é o maior planeta do nosso sistema solar?",
        options: ["Terra", "Marte", "Saturno", "Júpiter"],
        answer: 3
    },
    {
        id: 4,
        question: "Quem escreveu a peça 'Romeu e Julieta'?",
        options: ["William Shakespeare", "Charles Dickens", "Machado de Assis", "Oscar Wilde"],
        answer: 0
    },
    {
        id: 5,
        question: "Em qual continente fica o deserto do Saara?",
        options: ["Ásia", "América", "África", "Oceania"],
        answer: 2
    },
    {
        id: 6,
        question: "Qual é o metal cujo símbolo químico é Fe?",
        options: ["Ouro", "Ferro", "Prata", "Cobre"],
        answer: 1
    },
    {
        id: 7,
        question: "Qual é a capital da Itália?",
        options: ["Veneza", "Florença", "Milão", "Roma"],
        answer: 3
    },
    {
        id: 8,
        question: "Qual é o idioma oficial do Egito?",
        options: ["Árabe", "Egípcio", "Francês", "Inglês"],
        answer: 0
    },
    {
        id: 9,
        question: "Quantos segundos há em um minuto?",
        options: ["30", "60", "90", "120"],
        answer: 1
    },
    {
        id: 10,
        question: "Qual é o nome da galáxia em que vivemos?",
        options: ["Andrômeda", "Via Láctea", "Sombreiro", "Olho Negro"],
        answer: 1
    }
];
