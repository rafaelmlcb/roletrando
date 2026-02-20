export interface Question {
    question: string;
    options: string[];
    answer: number; // Index of the correct option
}

export const PRIZE_LADDER = [
    "R$ 1.000",
    "R$ 2.000",
    "R$ 3.000",
    "R$ 4.000",
    "R$ 5.000",
    "R$ 10.000",
    "R$ 20.000",
    "R$ 30.000",
    "R$ 40.000",
    "R$ 50.000",
    "R$ 100.000",
    "R$ 200.000",
    "R$ 300.000",
    "R$ 500.000",
    "R$ 1.000.000"
];

export const MILLIONAIRE_QUESTIONS: Question[] = [
    {
        question: "Qual é a capital do Brasil?",
        options: ["Rio de Janeiro", "Brasília", "São Paulo", "Salvador"],
        answer: 1
    },
    {
        question: "Quantos planetas existem no sistema solar?",
        options: ["7", "8", "9", "10"],
        answer: 1
    },
    {
        question: "Quem pintou a 'Mona Lisa'?",
        options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"],
        answer: 2
    },
    {
        question: "Qual é o maior oceano da Terra?",
        options: ["Oceano Atlântico", "Oceano Índico", "Oceano Ártico", "Oceano Pacífico"],
        answer: 3
    },
    {
        question: "Em que ano o homem pisou na Lua pela primeira vez?",
        options: ["1965", "1969", "1972", "1959"],
        answer: 1
    },
    {
        question: "Qual é o elemento químico com símbolo 'Au'?",
        options: ["Prata", "Cobre", "Ouro", "Alumínio"],
        answer: 2
    },
    {
        question: "Qual é a montanha mais alta do mundo?",
        options: ["K2", "Monte Everest", "Monte Branco", "Kilimanjaro"],
        answer: 1
    },
    {
        question: "Quem escreveu 'Dom Casmurro'?",
        options: ["Machado de Assis", "José de Alencar", "Clarice Lispector", "Jorge Amado"],
        answer: 0
    },
    {
        question: "Qual é a capital da França?",
        options: ["Lyon", "Marselha", "Paris", "Bordeaux"],
        answer: 2
    },
    {
        question: "Qual é o rio mais longo do mundo?",
        options: ["Rio Amazonas", "Rio Nilo", "Rio Mississipi", "Rio Yangtzé"],
        answer: 0
    },
    {
        question: "Qual destes países não fica na Europa?",
        options: ["Áustria", "Bélgica", "Egito", "Portugal"],
        answer: 2
    },
    {
        question: "Quantos ossos tem o corpo humano adulto?",
        options: ["186", "206", "216", "226"],
        answer: 1
    },
    {
        question: "Qual é a velocidade da luz?",
        options: ["~300.000 km/s", "~150.000 km/s", "~100.000 km/s", "~500.000 km/s"],
        answer: 0
    },
    {
        question: "Quem descobriu o Brasil?",
        options: ["Cristóvão Colombo", "Pedro Álvares Cabral", "Vasco da Gama", "Américo Vespúcio"],
        answer: 1
    },
    {
        question: "Qual é a fórmula química da água?",
        options: ["CO2", "O2", "H2O", "NaCl"],
        answer: 2
    }
];
