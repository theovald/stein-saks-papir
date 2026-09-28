// Calls to the Kantega LLM proxy. Key lives in localStorage on this
// machine only. Without a key the caller falls back to replay or
// simulation (see main.js).

const ENDPOINT = "https://llmproxy.kantega.no/v1/messages";
const KEY_STORE = "ssp-proxy-key";
const MODEL_STORE = "ssp-model";
export const DEFAULT_MODEL = "openai/gpt-6-luna";
const FALLBACK_MODELS = ["gpt-6-luna", "azure/gpt-6-luna", "gemini-3.1-flash-lite"];

export const stats = { calls: 0, errors: 0 };

export function getKey() {
    try { return localStorage.getItem(KEY_STORE) || ""; } catch { return ""; }
}
export function setKey(k) {
    try { k ? localStorage.setItem(KEY_STORE, k) : localStorage.removeItem(KEY_STORE); } catch { /* private mode */ }
}
export function getModel() {
    try { return localStorage.getItem(MODEL_STORE) || DEFAULT_MODEL; } catch { return DEFAULT_MODEL; }
}
export function setModel(m) {
    try { localStorage.setItem(MODEL_STORE, m || DEFAULT_MODEL); } catch { /* private mode */ }
}

let activeModel = null;

async function callOnce(model, system, messages) {
    const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": getKey(),
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model, max_tokens: 60, system, messages }),
    });
    stats.calls++;
    if (!res.ok) {
        const body = await res.text();
        const err = new Error(`HTTP ${res.status} (${model}): ${body.slice(0, 200)}`);
        err.status = res.status;
        throw err;
    }
    const data = await res.json();
    return (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();
}

// Returns the text reply. On a 4xx that looks like an unknown model
// it walks the fallback list once and sticks with the first that answers.
export async function complete(system, messages) {
    const candidates = activeModel ? [activeModel] : [getModel(), ...FALLBACK_MODELS];
    let lastErr = null;
    for (const model of candidates) {
        try {
            const text = await callOnce(model, system, messages);
            activeModel = model;
            return text;
        } catch (e) {
            lastErr = e;
            stats.errors++;
            const modelProblem = e.status >= 400 && e.status < 500 && e.status !== 429;
            if (!modelProblem) throw e;
        }
    }
    throw lastErr;
}

export function currentModel() {
    return activeModel || getModel();
}
