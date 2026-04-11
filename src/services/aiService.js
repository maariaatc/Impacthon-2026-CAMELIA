const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function generateBiologyReport(data) {
    const { structural_data, biological_data, protein_metadata } = data;

    const plddt_mean = structural_data?.confidence?.plddt_mean ?? "N/A";
    const plddt_histogram = structural_data?.confidence?.plddt_histogram ?? [];
    const mean_pae = structural_data?.confidence?.mean_pae ?? "N/A";
    const solubility_score = biological_data?.solubility_score ?? "N/A";
    const instability_index = biological_data?.instability_index ?? "N/A";
    const protein_name = protein_metadata?.protein_name ?? "Desconocida";
    const organism = protein_metadata?.organism ?? "Desconocido";

    const prompt = `CONTEXTO: Eres un experto en bioinformática que explica resultados científicos a investigadores sin formación técnica en computación. Tu tono es claro, directo y útil, como un colega científico que traduce jerga técnica.

TAREA: Analiza los siguientes datos de una predicción de estructura proteica hecha con AlphaFold2 y genera una explicación en lenguaje natural en español.

DATOS DE ENTRADA:
plddt_mean: ${plddt_mean}
plddt_histogram: ${JSON.stringify(plddt_histogram)}
mean_pae: ${mean_pae}
solubility_score: ${solubility_score}
instability_index: ${instability_index}
protein_name: ${protein_name}
organism: ${organism}

INSTRUCCIONES:
- Explica en 2-3 frases si la estructura es fiable o no, basándote en el pLDDT
- Indica si hay regiones problemáticas (pLDDT bajo = regiones desordenadas)
- Comenta la solubilidad y estabilidad en términos prácticos para el laboratorio
- Termina con una recomendación concreta: ¿vale la pena continuar con esta proteína?

FORMATO DE RESPUESTA:
- Sin tecnicismos innecesarios
- Máximo 150 palabras
- Usa frases como "Esta proteína...", "Las regiones con..."
- NO menciones números crudos, tradúcelos a significado biológico`;

    const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
            "HTTP-Referer": "http://localhost:5173",
        },
        body: JSON.stringify({
            model: "nvidia/nemotron-3-super-120b-a12b:free",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || "Error al contactar con OpenRouter");
    }

    const result = await response.json();
    return result.choices[0].message.content;
}