// Orchestration: mode selection (live, replay, simulated), the round
// loop, recording and the buttons.

import { createAgents } from "./agents.js";
import { assignDivisions, playRound } from "./league.js";
import { complete, getKey, setKey, getModel, setModel, currentModel, stats as llmStats } from "./llm.js";
import { MOVE_LABEL, TOOL_WORD } from "./languages.js";
import { UI } from "./ui.js";

const agents = createAgents();
const byId = new Map(agents.map((a) => [a.id, a]));
let ui = null;
let mode = "";
let running = false;
let round = 0;
const recording = { model: "", started: "", rounds: [] };

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Oracle signature: (system, messages, agent, lang) -> reply text.
async function liveOracle(system, messages) {
    return complete(system, messages);
}

// Simulated: uniform random move, one in five asks for history first.
// Clearly not a language model, and labelled as such in the UI.
async function simulatedOracle(system, messages, agent, lang) {
    await sleep(80 + Math.random() * 120);
    llmStats.calls++;
    if (messages.length === 1 && Math.random() < 0.2) return TOOL_WORD[lang];
    const words = MOVE_LABEL[lang];
    return `${words[Math.floor(Math.random() * 3)]}. (simulert)`;
}

function hooks() {
    return {
        onMatchStart: (a, b, langs) => ui.matchStart(a, b, langs),
        onMatchEnd: (a, b) => ui.matchEnd(a, b),
        onThrow: (entry, a, b) => { ui.recordThrow(entry, a, b); updateCounters(); },
    };
}

function updateCounters() {
    $("round").textContent = `Runde ${round}`;
    $("calls").textContent = `${llmStats.calls} kall`;
}

async function runRound(oracle) {
    round++;
    updateCounters();
    ui.setStatus(`${modeLabel()} · spiller runde ${round}`);
    const result = await playRound(agents, oracle, hooks());
    recording.rounds.push({ ...result, elos: agents.map((a) => Math.round(a.elo)), divisions: agents.map((a) => a.division) });
    ui.layout();
    ui.renderStats();
    ui.setStatus(`${modeLabel()} · runde ${round} ferdig`);
}

function modeLabel() {
    if (mode === "live") return `Modell ${currentModel()}`;
    if (mode === "replay") return "Avspilling fra opptak";
    return "Simulert, ingen språkmodell";
}

async function loop(oracle) {
    while (running) {
        try {
            await runRound(oracle);
        } catch (e) {
            running = false;
            ui.setStatus(`Stoppet: ${e.message}`);
            $("toggle").textContent = "Start";
            return;
        }
    }
}

// Replay drives the UI straight from the recording, no model calls.
async function replay(rec) {
    for (const r of rec.rounds) {
        if (!running) return;
        round++;
        updateCounters();
        ui.setStatus(`Avspilling · runde ${round}`);
        for (const m of r.matches) {
            const a = byId.get(m.a), b = byId.get(m.b);
            ui.matchStart(a, b, m.langs);
            for (const t of m.throws) {
                ui.recordThrow(t, a, b);
                llmStats.calls += 2 + (t.a.tool ? 1 : 0) + (t.b.tool ? 1 : 0);
                updateCounters();
                await sleep(40);
            }
            ui.matchEnd(a, b);
        }
        agents.forEach((a, i) => { a.elo = r.elos[i]; a.division = r.divisions[i]; });
        ui.layout();
        ui.renderStats();
        await sleep(600);
    }
    running = false;
    $("toggle").textContent = "Start";
    ui.setStatus("Avspilling ferdig");
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
    $("gate").hidden = true;
    $("app").hidden = false;
    assignDivisions(agents);
    if (rec) agents.forEach((a, i) => { a.division = rec.rounds.length ? rec.startDivisions[i] : a.division; });
    ui = new UI(agents);
    ui.setStatus(modeLabel());
    recording.model = mode === "live" ? getModel() : mode;
    recording.started = new Date().toISOString();
    recording.startDivisions = agents.map((a) => a.division);
    const oracle = mode === "live" ? liveOracle : simulatedOracle;
    $("toggle").addEventListener("click", () => {
        running = !running;
        $("toggle").textContent = running ? "Pause" : "Start";
        if (running) mode === "replay" ? replay(rec) : loop(oracle);
    });
    $("next").addEventListener("click", () => { if (!running && mode !== "replay") runRound(oracle); });
    $("download").addEventListener("click", download);
    $("forget").addEventListener("click", () => { setKey(""); location.reload(); });
    if (mode === "replay") { $("next").hidden = true; $("download").hidden = true; }
}

async function loadRecording() {
    try {
        const res = await fetch("data/opptak.json", { cache: "no-store" });
        if (!res.ok) return null;
        const rec = await res.json();
        return rec.rounds && rec.rounds.length ? rec : null;
    } catch { return null; }
}

async function init() {
    $("model").value = getModel();
    $("key").value = getKey();
    const rec = await loadRecording();
    $("nokey").textContent = rec ? "Spill av opptak" : "Start simulert";
    $("go").addEventListener("click", () => {
        const k = $("key").value.trim();
        if (!k) return;
        setKey(k);
        setModel($("model").value.trim());
        start("live");
    });
    $("nokey").addEventListener("click", () => start(rec ? "replay" : "simulated", rec));
}

init();
