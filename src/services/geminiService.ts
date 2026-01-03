import { GoogleGenAI } from "@google/genai";

// Fix: Vite uses import.meta.env instead of process.env
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export const sermonAssistant = async (theme: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere um esboço estruturado de sermão para o tema: "${theme}". O esboço deve conter: Título, Introdução, 3 Pontos Principais com referências bíblicas e Conclusão. Formate em Markdown.`,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    // Fix: Using the .text property getter as recommended
    return response.text || "Não foi possível gerar o sermão no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com a IA ministerial.";
  }
};

export const financeAnalyst = async (data: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise estes dados financeiros da igreja e forneça 3 sugestões estratégicas para melhoria da saúde financeira ou investimentos sociais: ${JSON.stringify(data)}. Seja breve e profissional.`,
      config: {
        temperature: 0.5
      }
    });
    // Fix: Using the .text property getter as recommended
    return response.text;
  } catch (error) {
    return "Análise indisponível no momento.";
  }
};