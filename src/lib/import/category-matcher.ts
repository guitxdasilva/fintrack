import type { Category } from "@/types";

interface KeywordRule {
  keywords: string[];
  categoryNames: string[];
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    keywords: [
      "mercado", "supermercado", "hortifruti", "açougue", "padaria",
      "restaurante", "lanchonete", "ifood", "uber eats", "rappi",
      "burger", "pizza", "sushi", "mcdonald", "subway", "starbucks",
      "café", "cafeteria", "doceria", "sorveteria", "bar ",
      "churrascaria", "cantina", "food", "aliment", "refeição",
      "pão de açúcar", "carrefour", "extra", "atacadão", "assaí",
      "big", "zaffari", "nacional", "bretas", "guanabara",
      "sams club", "costco", "makro",
    ],
    categoryNames: ["alimentação", "alimentacao", "comida", "refeição", "food"],
  },
  {
    keywords: [
      "uber", "99", "cabify", "lyft", "táxi", "taxi",
      "gasolina", "combustível", "combustivel", "posto", "shell", "ipiranga",
      "petrobrás", "petrobras", "estacionamento", "parking",
      "pedágio", "pedagio", "sem parar", "conectcar", "veloe",
      "metro", "metrô", "ônibus", "onibus", "bilhete único",
      "sptrans", "brt", "vlt", "trem",
    ],
    categoryNames: ["transporte", "mobilidade", "transport"],
  },
  {
    keywords: [
      "aluguel", "condomínio", "condominio", "iptu",
      "água", "agua", "sabesp", "copasa", "saneago", "caesb",
      "luz", "energia", "enel", "eletropaulo", "cemig", "cpfl", "celpe",
      "gás", "gas",
      "internet", "fibra", "vivo", "claro", "tim", "oi",
      "net", "sky", "contas",
    ],
    categoryNames: ["moradia", "casa", "habitação", "habitacao"],
  },
  {
    keywords: [
      "farmácia", "farmacia", "drogaria", "droga raia", "drogasil",
      "pacheco", "panvel", "araujo",
      "médico", "medico", "consulta", "hospital", "clínica", "clinica",
      "laboratório", "laboratorio", "exame", "plano de saúde", "unimed",
      "amil", "sulamerica", "bradesco saúde", "hapvida", "notredame",
      "dentista", "odonto", "psicólogo", "psicologo", "terapia",
      "academia", "gym", "smart fit", "bio ritmo",
    ],
    categoryNames: ["saúde", "saude", "health"],
  },
  {
    keywords: [
      "escola", "faculdade", "universidade", "curso", "udemy",
      "alura", "rocketseat", "coursera", "pluralsight",
      "livro", "livraria", "amazon kindle", "saraiva",
      "mensalidade", "matrícula", "matricula", "apostila",
    ],
    categoryNames: ["educação", "educacao", "estudo", "education"],
  },
  {
    keywords: [
      "cinema", "ingresso", "teatro", "show", "evento",
      "parque", "viagem", "hotel", "airbnb", "booking",
      "decolar", "latam", "gol", "azul", "passagem aérea",
      "jogo", "game", "steam", "playstation", "xbox", "nintendo",
      "spotify", "deezer", "tidal", "youtube music",
    ],
    categoryNames: ["lazer", "entretenimento", "diversão", "diversao"],
  },
  {
    keywords: [
      "netflix", "disney", "hbo", "prime video", "apple tv",
      "paramount", "globoplay", "crunchyroll",
      "spotify", "deezer", "youtube premium",
      "icloud", "google one", "dropbox", "onedrive",
      "chatgpt", "openai", "github", "notion",
      "assinatura", "subscription", "mensalidade app",
    ],
    categoryNames: ["assinaturas", "assinatura", "streaming", "subscriptions"],
  },
  {
    keywords: [
      "roupa", "vestuário", "vestuario", "calçado", "calcado",
      "tênis", "tenis", "sapato", "camisa", "calça", "calca",
      "c&a", "renner", "riachuelo", "zara", "hering", "marisa",
      "shein", "shopee", "centauro", "netshoes",
    ],
    categoryNames: ["roupas", "vestuário", "vestuario", "moda"],
  },
  {
    keywords: [
      "salário", "salario", "pagamento", "remuneração",
      "freelance", "prestação de serviço", "honorário",
      "pró-labore", "pro-labore", "comissão", "comissao",
      "bônus", "bonus", "13º", "décimo terceiro",
      "férias", "ferias",
    ],
    categoryNames: ["salário", "salario", "renda", "income", "freelance"],
  },
  {
    keywords: [
      "investimento", "aplicação", "aplicacao", "rendimento",
      "dividendo", "juros", "poupança", "poupanca",
      "cdb", "lci", "lca", "tesouro direto", "ações", "acoes",
      "fundo", "fii", "etf", "cripto", "bitcoin", "btc",
    ],
    categoryNames: ["investimentos", "investimento", "rendimentos"],
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function matchCategory(
  description: string,
  userCategories: Category[]
): string | null {
  if (!description || userCategories.length === 0) return null;

  const normalizedDesc = normalize(description);

  for (const rule of KEYWORD_RULES) {
    const matched = rule.keywords.some((kw) =>
      normalizedDesc.includes(normalize(kw))
    );

    if (matched) {
      const normalizedCatNames = rule.categoryNames.map(normalize);
      const found = userCategories.find((cat) =>
        normalizedCatNames.includes(normalize(cat.name))
      );
      if (found) return found.id;
    }
  }

  for (const cat of userCategories) {
    const normalizedCatName = normalize(cat.name);
    if (
      normalizedCatName.length >= 3 &&
      normalizedDesc.includes(normalizedCatName)
    ) {
      return cat.id;
    }
  }

  return null;
}

export function matchCategories(
  transactions: { description: string }[],
  userCategories: Category[]
): Map<number, string> {
  const result = new Map<number, string>();
  for (let i = 0; i < transactions.length; i++) {
    const catId = matchCategory(transactions[i].description, userCategories);
    if (catId) result.set(i, catId);
  }
  return result;
}
