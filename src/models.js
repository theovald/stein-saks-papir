// Models offered on the start screen: names as the Kantega proxy config
// lists them, with list prices in USD per million tokens (input / output).
// approx: price not confirmed against the proxy, treat as a guess.
// Used only for cost estimates.

export const MODELS = [
    { id: "vertex_ai/claude-haiku-4-5", label: "Claude Haiku 4.5", input: 1.0, output: 5.0 },
    { id: "azure/gpt-5.6-luna", label: "GPT-5.6 Luna", input: 0.1, output: 0.5, approx: true },
    { id: "azure/gpt-5.4-nano", label: "GPT-5.4 Nano", input: 0.05, output: 0.4, approx: true },
    { id: "azure/gpt-5-mini", label: "GPT-5 Mini", input: 0.25, output: 2.0 },
    { id: "azure_ai/DeepSeek-V4-Flash", label: "DeepSeek V4 Flash", input: 0.19, output: 0.51 },
    { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", input: 0.1, output: 0.4, approx: true },
    { id: "vertex_ai/gemini-3.5-flash", label: "Gemini 3.5 Flash", input: 0.3, output: 2.5, approx: true },
    { id: "vertex_ai/mistral-small", label: "Mistral Small", input: 0.1, output: 0.3, approx: true },
    { id: "azure/gpt-5.6-sol", label: "GPT-5.6 Sol", input: 2.0, output: 10.0, approx: true },
    { id: "vertex_ai/claude-sonnet-4-6", label: "Claude Sonnet 4.6", input: 3.0, output: 15.0 },
    { id: "vertex_ai/claude-sonnet-5", label: "Claude Sonnet 5", input: 3.0, output: 15.0, approx: true },
];

export const DEFAULT_MODEL = MODELS[0].id;

// Rough token footprint of one call in this game.
export const TOKENS_IN = 220;
export const TOKENS_OUT = 40;
export const USD_TO_NOK = 10.5;

export function priceFor(id) {
    return MODELS.find((m) => m.id === id) || null;
}

// USD for a number of calls on a model. Unknown model: null.
export function costUsd(id, calls) {
    const m = priceFor(id);
    if (!m) return null;
    return (calls * (TOKENS_IN * m.input + TOKENS_OUT * m.output)) / 1e6;
}

const no = (n, d) => n.toFixed(d).replace(".", ",");

export function formatNok(usd) {
    const nok = usd * USD_TO_NOK;
    if (nok < 0.1) return `${no(nok * 100, 1)} øre`;
    return `${no(nok, nok < 10 ? 2 : 0)} kr`;
}

export function formatUsd(usd) {
    return `${no(usd, usd < 1 ? 3 : 2)} USD`;
}
