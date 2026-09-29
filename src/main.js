// Orchestration: mode selection (live, replay, simulated), the round
// loop, recording and the buttons.

import { createAgents, LANG_CODES } from "./agents.js";
import { assignDivisions, playRound, callEstimate } from "./league.js";
import { complete, getKey, setKey, getModel, setModel, currentModel, stats as llmStats } from "./llm.js";
import { MODELS, costUsd, formatNok, formatUsd, priceFor } from "./models.js";
import { MOVE_LABEL, TOOL_WORD } from "./languages.js";
import { UI } from "./ui.js";

let agents = [];
let byId = new Map();
let ui = null;
let mode = "";
let running = false;
let round = 0;
const recording = { model: "", started: "", count: 0, rounds: [] };

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Oracle signature: (system, messages, agent, lang) -> reply text.
async function liveOracle(system, messages) {
    return complete(system, messages);
}

// Simulated: uniform random move, one in five asks for history first.
// Clearly not a language model, and labelled as such in the UI.
async function simulatedOracle(system, messages, agent, lang) {
    await sleep(60 + Math.random() * 100);
    llmStats.calls++;
    if (messages.length === 1 && Math.random() < 0.2) return TOOL_WORD[lang];
    const words = MOVE_LABEL[lang];
    return `${words[Math.floor(Math.random() * 3)]}. (simulert)`;
}

function hooks() {
    return {
        onMatchStart: (a, b, langs) => ui.matchStart(a, b, langs),
        onMatchEnd: (a, b, r) => ui.matchEnd(a, b, r),
        onThrow: (entry, a, b) => { ui.recordThrow(entry, a, b); updateCounters(); },
    };
}

function runningCost() {
    if (mode !== "live") return "";
    const usd = costUsd(currentModel(), llmStats.calls);
    return usd === null ? "" : ` · ca. ${formatNok(usd)} (${formatUsd(usd)})`;
}

function updateCounters() {
    $("round").textContent = `Runde ${round}`;
    $("calls").textContent = `${llmStats.calls} kall${runningCost()}`;
}

async function runRound(oracle) {
    round++;
    ui.round = round;
    ui.roundStart();
    updateCounters();
    const callsBefore = llmStats.calls;
    ui.setStatus(`${modeLabel()} · runde ${round}: kamper pågår`);
    const result = await playRound(agents, oracle, hooks());
    const calls = llmStats.calls - callsBefore;
    recording.rounds.push({ ...result, calls, elos: agents.map((a) => Math.round(a.elo)), divisions: agents.map((a) => a.division) });
    ui.setStatus(`${modeLabel()} · runde ${round}: opp- og nedrykk`);
    await ui.roundEnd({ n: round, moves: result.moves, calls });
    ui.setStatus(`${modeLabel()} · runde ${round} ferdig`);
}

function modeLabel() {
    if (mode === "live") {
        const m = priceFor(currentModel());
        return `Modell ${m ? m.label : currentModel()}`;
    }
    if (mode === "replay") return "Avspilling fra opptak";
    return "Simulert, ingen språkmodell";
}

let loopActive = false;

async function loop(oracle) {
    if (loopActive) return;
    loopActive = true;
    while (running) {
        try {
            await runRound(oracle);
        } catch (e) {
            running = false;
            ui.setStatus(`Stoppet: ${e.message}`);
            $("toggle").textContent = "Start";
        }
    }
    loopActive = false;
}

// Replay drives the UI straight from the recording, no model calls.
async function replay(rec) {
    if (loopActive) return;
    loopActive = true;
    for (const r of rec.rounds.slice(round)) {
        if (!running) break;
        round++;
            ui.round = round;
        ui.roundStart();
        updateCounters();
        ui.setStatus(`Avspilling · runde ${round}: kamper pågår`);
        for (const m of r.matches) {
            const a = byId.get(m.a), b = byId.get(m.b);
            ui.matchStart(a, b, m.langs);
            for (const t of m.throws) {
                ui.recordThrow(t, a, b);
                llmStats.calls += 2 + (t.a.tool ? 1 : 0) + (t.b.tool ? 1 : 0);
                updateCounters();
                await sleep(40);
            }
            ui.matchEnd(a, b, m);
        }
        agents.forEach((a, i) => { a.elo = r.elos[i]; a.division = r.divisions[i]; });
        ui.setStatus(`Avspilling · runde ${round}: opp- og nedrykk`);
        await ui.roundEnd({ n: round, moves: r.moves || [], calls: r.calls || 0 });
        ui.setStatus(`Avspilling · runde ${round} ferdig`);
    }
    loopActive = false;
    if (round >= rec.rounds.length) {
        running = false;
        $("toggle").textContent = "Start";
        ui.setStatus("Avspilling ferdig");
    }
}

function download() {
    const blob = new Blob([JSON.stringify(recording)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "opptak.json";
    a.click();
}

async function start(chosen, rec) {
    mode = chosen;
    const count = rec ? rec.count : Number($("count").value);
    agents = createAgents(count);
    byId = new Map(agents.map((a) => [a.id, a]));
    $("gate").hidden = true;
    $("app").hidden = false;
    assignDivisions(agents);
    if (rec && rec.startDivisions) agents.forEach((a, i) => { a.division = rec.startDivisions[i]; });
    ui = new UI(agents);
    ui.setStatus(`${modeLabel()} · ${agents.length} agenter · trykk Start eller Neste runde`);
    recording.model = mode === "live" ? getModel() : mode;
    recording.started = new Date().toISOString();
    recording.count = agents.length;
    recording.startDivisions = agents.map((a) => a.division);
    const oracle = mode === "live" ? liveOracle : simulatedOracle;
    $("toggle").addEventListener("click", () => {
        running = !running;
        $("toggle").textContent = running ? "Pause" : "Start";
        if (running) mode === "replay" ? replay(rec) : loop(oracle);
        else ui.setStatus(`${modeLabel()} · pauser etter runden`);
    });
    $("next").addEventListener("click", () => { if (!running && !loopActive && mode !== "replay") runRound(oracle); });
    $("download").addEventListener("click", download);
    window.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "s") { e.preventDefault(); download(); }
    });
    $("forget").addEventListener("click", () => { setKey(""); location.reload(); });
    $("about").addEventListener("click", () => { $("about-panel").hidden = false; });
    $("about-close").addEventListener("click", () => { $("about-panel").hidden = true; });
    $("log-toggle").addEventListener("click", () => {
        const log = $("log");
        log.classList.toggle("log--collapsed");
        $("log-toggle").textContent = log.classList.contains("log--collapsed") ? "Vis logg" : "Skjul logg";
    });
    if (mode === "replay") { $("next").hidden = true; $("download").hidden = true; }
}

async function loadRecording() {
    try {
        const res = await fetch("data/opptak.json", { cache: "no-store" });
        if (!res.ok) return null;
        const rec = await res.json();
        return rec.rounds && rec.rounds.length && rec.count ? rec : null;
    } catch { return null; }
}

function chosenModel() {
    const v = $("model").value;
    return v === "__custom__" ? $("model-custom").value.trim() : v;
}

function showEstimate() {
    const n = Number($("count").value);
    const calls = callEstimate(n);
    const model = chosenModel();
    const m = priceFor(model);
    const per = costUsd(model, calls);
    let text = `Rundt ${calls} kall per runde med ${n} agenter, ${Math.floor(n / LANG_CODES.length)}–${Math.ceil(n / LANG_CODES.length)} per språk.`;
    if (per !== null) {
        text += ` Ca. ${formatNok(per)} per runde, ${formatNok(per * 20)} for 20 runder (${formatUsd(per)} / ${formatUsd(per * 20)}).`;
    } else if (model) {
        text += " Ukjent pris for denne modellen.";
    }
    const approx = m && m.approx ? " Prisen for denne modellen er et anslag." : "";
    $("estimate").innerHTML = "";
    $("estimate").append(text, Object.assign(document.createElement("small"), {
        textContent: `Anslag: ca. 220 tokens inn og 40 ut per kall, 60 % ekstra for verktøykall, listepris, kurs 10,50 kr per dollar.${approx}`,
    }));
}

function fillModels() {
    const sel = $("model");
    for (const m of MODELS) {
        const o = document.createElement("option");
        o.value = m.id;
        const usd = (n) => n.toFixed(2).replace(".", ",");
        o.textContent = `${m.label} · ${usd(m.input)} / ${usd(m.output)} $ per M${m.approx ? " (ca.)" : ""}`;
        sel.appendChild(o);
    }
    const other = document.createElement("option");
    other.value = "__custom__";
    other.textContent = "Annen…";
    sel.appendChild(other);
    const saved = getModel();
    if (MODELS.some((m) => m.id === saved)) sel.value = saved;
    else { sel.value = "__custom__"; $("model-custom").value = saved; }
    const toggleCustom = () => { $("custom-wrap").hidden = sel.value !== "__custom__"; };
    toggleCustom();
    sel.addEventListener("change", () => { toggleCustom(); showEstimate(); });
    $("model-custom").addEventListener("input", showEstimate);
}

async function init() {
    fillModels();
    $("key").value = getKey();
    showEstimate();
    $("count").addEventListener("change", showEstimate);
    const rec = await loadRecording();
    $("nokey").textContent = rec ? `Spill av opptak (${rec.count} agenter)` : "Start simulert";
    $("go").addEventListener("click", () => {
        const k = $("key").value.trim();
        if (!k) return;
        setKey(k);
        const model = chosenModel();
        if (!model) return;
        setModel(model);
        start("live");
    });
    $("nokey").addEventListener("click", () => start(rec ? "replay" : "simulated", rec));
}

init();
