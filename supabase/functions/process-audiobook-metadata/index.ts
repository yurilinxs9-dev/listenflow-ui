import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filename } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Generate fictional narrator names
    const narratorNames = [
      "Carlos Mendes", "Ana Silva", "Roberto Santos", "Marina Costa",
      "Fernando Lima", "Juliana Ferreira", "Lucas Oliveira", "Patricia Alves",
      "Ricardo Souza", "Camila Rodrigues", "Bruno Martins", "Sofia Pereira"
    ];
    const randomNarrator = narratorNames[Math.floor(Math.random() * narratorNames.length)];

    // Use AI to extract author and determine genre from filename
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é um assistente que analisa nomes de arquivos de audiobooks. Extraia o autor e o título do livro do nome do arquivo, e determine o gênero mais apropriado. Responda em português do Brasil."
          },
          {
            role: "user",
            content: `Analise este nome de arquivo de audiobook: "${filename}". 
            
Por favor, extraia:
1. O título do livro
2. O nome do autor (geralmente vem junto no nome do arquivo)
3. Determine o gênero literário mais apropriado (escolha um entre: Ficção, Romance, Mistério, Ficção Científica, Fantasia, Biografia, Negócios, Autoajuda, História, Suspense)
4. Crie uma descrição envolvente e atraente do livro em português (2-3 frases), baseada no título, autor e gênero

Responda APENAS no seguinte formato JSON sem nenhum texto adicional:
{"title": "título", "author": "autor", "genre": "gênero", "description": "descrição do livro"}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI gateway error:", aiResponse.status);
      throw new Error("Erro ao processar com IA");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    // Parse the JSON response from AI
    let metadata;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : aiContent;
      metadata = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", aiContent);
      // Fallback to basic parsing
      metadata = {
        title: filename.replace(/\.[^/.]+$/, ""),
        author: "Autor Desconhecido",
        genre: "Ficção",
        description: "Um audiobook fascinante que promete envolver o ouvinte do início ao fim."
      };
    }

    return new Response(
      JSON.stringify({
        title: metadata.title,
        author: metadata.author,
        narrator: randomNarrator,
        genre: metadata.genre,
        description: metadata.description,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
