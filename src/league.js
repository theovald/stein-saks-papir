// Four divisions, random pairing inside each division, best of three
// throws, ELO, promotion and relegation after every round.

import { playLanguages, systemPrompt, turnPrompt, historyPrompt, isToolRequest, parseMove } from "./languages.js";

export const DIVISION_SIZES = [10, 20, 30, 40];
export const DIVISION_NAMES = ["Eliteserien", "1. divisjon", "2. divisjon", "3. divisjon"];
const BEATS = { rock: "scissors", scissors: "paper", paper: "rock" };
const K = 32;
const PARALLEL = 10;

export function assignDivisions(agents) {
    const shuffled = [...agents].sort(() => Math.random() - 0.5);
    let i = 0;
    DIVISION_SIZES.forEach((size, d) => {
        for (let n = 0; n < size; n++) shuffled[i++].division = d;
    });
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
    DIVISION_SIZES.forEach((_, d) => pairs.push(...pairUp(agents.filter((ag) => ag.division === d))));
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
    const moves = promoteRelegate(agents);
    return { matches: results, moves };
}

// Top two of each lower division swap with bottom two of the one above.
function promoteRelegate(agents) {
    const rank = (list) => [...list].sort((x, y) => (y.roundPoints - x.roundPoints) || (y.elo - x.elo));
    const ranked = DIVISION_SIZES.map((_, d) => rank(agents.filter((ag) => ag.division === d)));
    const moves = [];
    for (let d = 0; d < DIVISION_SIZES.length - 1; d++) {
        ranked[d].slice(-2).forEach((ag) => moves.push({ id: ag.id, to: d + 1 }));
        ranked[d + 1].slice(0, 2).forEach((ag) => moves.push({ id: ag.id, to: d }));
    }
    const byId = new Map(agents.map((ag) => [ag.id, ag]));
    moves.forEach((m) => { byId.get(m.id).division = m.to; });
    return moves;
}
