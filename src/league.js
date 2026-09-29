// Five divisions, random pairing inside each division, best of three
// throws, ELO, promotion and relegation after every round.

import { playLanguages, systemPrompt, turnPrompt, historyPrompt, isToolRequest, parseMove } from "./languages.js";

export const DIVISION_NAMES = ["Eliteserien", "1. divisjon", "2. divisjon", "3. divisjon", "4. divisjon"];
export const START_DIVISION = 2;
export const LAST_DIVISION = DIVISION_NAMES.length - 1;
const BEATS = { rock: "scissors", scissors: "paper", paper: "rock" };
const K = 32;
const PARALLEL = 10;

// Rough number of model calls one round costs: half the agents are
// matches, about 2.5 throws each, two calls per throw, plus history calls.
export function callEstimate(n) {
    return Math.round((n / 2) * 2.5 * 2 * 1.6);
}

// Everyone starts in the middle division.
export function assignDivisions(agents) {
    agents.forEach((ag) => { ag.division = START_DIVISION; });
}

function pairUp(list) {
    const s = [...list].sort(() => Math.random() - 0.5);
    const pairs = [];
    for (let i = 0; i + 1 < s.length; i += 2) pairs.push([s[i], s[i + 1]]);
    return pairs;
}

function score(a, b) {
    return `${a}-${b}`;
}

// One throw for one agent. Returns { move, tool, text }.
async function throwFor(agent, opp, lang, n, of, sc, oracle, ownHistory, oppHistory) {
    const system = systemPrompt(lang, agent, opp);
    const messages = [{ role: "user", content: turnPrompt(lang, n, of, sc) }];
    let text = await oracle(system, messages, agent, lang);
    let tool = false;
    if (isToolRequest(lang, text)) {
        tool = true;
        agent.toolUses++;
        messages.push({ role: "assistant", content: text });
        messages.push({ role: "user", content: historyPrompt(lang, oppHistory.slice(-5), ownHistory.slice(-5)) });
        text = await oracle(system, messages, agent, lang);
    }
    agent.throws++;
    const move = parseMove(lang, text);
    return { move, tool, text };
}

async function playMatch(a, b, oracle, onThrow) {
    const [la, lb] = playLanguages(a, b);
    let wa = 0, wb = 0;
    const throwsLog = [];
    for (let n = 1; n <= 3; n++) {
        const [ta, tb] = await Promise.all([
            throwFor(a, b, la, n, 3, score(wa, wb), oracle, a.moves, b.moves),
            throwFor(b, a, lb, n, 3, score(wb, wa), oracle, b.moves, a.moves),
        ]);
        if (ta.move) a.moves.push(ta.move);
        if (tb.move) b.moves.push(tb.move);
        let winner = null;
        if (ta.move && !tb.move) winner = "a";
        else if (tb.move && !ta.move) winner = "b";
        else if (ta.move && tb.move && ta.move !== tb.move) winner = BEATS[ta.move] === tb.move ? "a" : "b";
        if (winner === "a") wa++;
        if (winner === "b") wb++;
        const entry = { n, a: { id: a.id, lang: la, native: la === a.lang, move: ta.move, tool: ta.tool, text: ta.text }, b: { id: b.id, lang: lb, native: lb === b.lang, move: tb.move, tool: tb.tool, text: tb.text }, winner };
        throwsLog.push(entry);
        onThrow(entry, a, b);
        if (wa === 2 || wb === 2) break;
    }
    const ea = 1 / (1 + 10 ** ((b.elo - a.elo) / 400));
    const sa = wa > wb ? 1 : wa < wb ? 0 : 0.5;
    a.elo += K * (sa - ea);
    b.elo += K * ((1 - sa) - (1 - ea));
    if (wa > wb) { a.points += 3; a.roundPoints += 3; }
    else if (wb > wa) { b.points += 3; b.roundPoints += 3; }
    else { a.points += 1; b.points += 1; a.roundPoints += 1; b.roundPoints += 1; }
    return { a: a.id, b: b.id, langs: [la, lb], result: [wa, wb], throws: throwsLog };
}

// Runs one full round. hooks: onMatchStart(a,b,langs), onMatchEnd(a,b,result), onThrow(entry,a,b)
export async function playRound(agents, oracle, hooks) {
    agents.forEach((ag) => { ag.roundPoints = 0; });
    const pairs = [];
    DIVISION_NAMES.forEach((_, d) => pairs.push(...pairUp(agents.filter((ag) => ag.division === d))));
    const results = [];
    let i = 0;
    async function worker() {
        while (i < pairs.length) {
            const [a, b] = pairs[i++];
            hooks.onMatchStart(a, b, playLanguages(a, b));
            const r = await playMatch(a, b, oracle, hooks.onThrow);
            results.push(r);
            hooks.onMatchEnd(a, b, r);
        }
    }
    await Promise.all(Array.from({ length: PARALLEL }, worker));
    const moves = promoteRelegate(agents, results);
    return { matches: results, moves };
}

// Winners move one division up, losers one down, draws stay. The top
// cannot go up and the bottom cannot go down. Applied after all matches.
function promoteRelegate(agents, results) {
    const byId = new Map(agents.map((ag) => [ag.id, ag]));
    const moves = [];
    for (const r of results) {
        const [wa, wb] = r.result;
        if (wa === wb) continue;
        const winner = byId.get(wa > wb ? r.a : r.b);
        const loser = byId.get(wa > wb ? r.b : r.a);
        if (winner.division > 0) moves.push({ id: winner.id, from: winner.division, to: winner.division - 1 });
        if (loser.division < LAST_DIVISION) moves.push({ id: loser.id, from: loser.division, to: loser.division + 1 });
    }
    moves.forEach((m) => { byId.get(m.id).division = m.to; });
    return moves;
}
