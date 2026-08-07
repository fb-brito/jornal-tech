import { logError } from '@/lib/db';

export async function processAiMarkdown(url: string, title: string, desc: string): Promise<{ finalMarkdown: string, generatedTitle: string, generatedDesc: string, rawContent: string }> {
  const rawContent = `Title: ${title}\n\nDescription: ${desc}`;
  let finalMarkdown = "";
  let generatedTitle = title;
  let generatedDesc = desc;

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    finalMarkdown = `# ${title}\n\n${desc}\n\n*(Nota: Chave do OpenRouter não configurada. Conteúdo bruto exibido.)*`;
    return { finalMarkdown, generatedTitle, generatedDesc, rawContent };
  }

  const OPENROUTER_MODELS = [
    "google/gemma-4-26b-a4b-it:free",
    "poolside/laguna-xs-2.1:free",
    "openai/gpt-oss-20b:free",
    "openrouter/free"
  ];

  for (const model of OPENROUTER_MODELS) {
    try {
      const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "Você é um Tradutor e Formatador Estrito. Seu objetivo é pegar o título e a descrição originais e transformá-los em um artigo formatado em Markdown. REGRAS OBRIGATÓRIAS:\n1. Escreva INTEIRAMENTE em Português do Brasil (PT-BR).\n2. O título que você gerar (linha que começa com #) DEVE ser a tradução fiel do título original, adaptado para o português fluído, sem inventar contexto extra.\n3. NUNCA converse com o usuário. NÃO inclua meta-comentários como 'Aqui está a matéria', 'Como você forneceu um texto curto', etc. Retorne EXCLUSIVAMENTE o conteúdo em Markdown.\n4. Se o texto original for extremamente curto, crie uma matéria curta e direta. NUNCA invente informações não presentes no texto original (ex: não comece a explicar o que é a rede social ou o histórico da empresa se isso não foi fornecido).\n5. NUNCA traduza nomes de projetos, tecnologias, ou marcas (ex: 'OpenCut', 'hallmark', 'GitHub').\n6. Inclua 1 diagrama `mermaid` APENAS se o contexto permitir ilustrar um processo. Se o texto for apenas uma frase de humor ou observação curta, NÃO insira diagrama."
            },
            {
              role: "user",
              content: `Traduza e formate o seguinte conteúdo estritamente para Markdown.\n\nTítulo Original: ${title}\nDescrição Original: ${desc}`
            }
          ]
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        if (aiData.choices && aiData.choices.length > 0) {
          finalMarkdown = aiData.choices[0].message.content;
          console.log(`Sucesso com o modelo: ${model}`);
          break;
        }
      } else {
        console.error(`Erro com o modelo ${model}: ${aiResponse.status}`);
        const errTxt = await aiResponse.text();
        await logError(url, `AI Fetch Status (${model})`, `HTTP ${aiResponse.status}`, errTxt);
      }
    } catch (error: any) {
      console.error(`Falha ao tentar o modelo ${model}:`, error);
      await logError(url, `AI Fetch Exception (${model})`, error.message);
    }
  }

  if (!finalMarkdown) {
    finalMarkdown = `# ${title}\n\n${desc}\n\n*(Nota: Todos os modelos de IA falharam. Conteúdo bruto exibido.)*`;
    await logError(url, "AI Processing", "Todos os modelos do OpenRouter falharam em retornar markdown.");
  }

  const lines = finalMarkdown.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const titleLine = lines.find(l => l.startsWith('# '));
  if (titleLine) {
    generatedTitle = titleLine.replace(/^#\s*/, '').replace(/\*\*/g, '');
  }

  const descLine = lines.find(l => l.length > 30 && !l.startsWith('#') && !l.startsWith('!') && !l.startsWith('-') && !l.startsWith('>'));
  if (descLine) {
    generatedDesc = descLine.slice(0, 160) + (descLine.length > 160 ? '...' : '');
  }

  return { finalMarkdown, generatedTitle, generatedDesc, rawContent };
}
