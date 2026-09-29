// Rendering: pyramid of divisions on the left, tabbed statistics on the
// right, a rolling log at the bottom. Everything that names an agent or a
// language is clickable and opens the matching view.

import { LANGUAGES, localWord } from "./languages.js";
import { DIVISION_NAMES, START_DIVISION } from "./league.js";

const MOVES = ["rock", "scissors", "paper"];
// The Sámi flag has no emoji, so it is drawn: red left, blue right, a
// green and a yellow stripe, and a circle that is blue on red and red on blue.
const SAMI_FLAG = `<svg class="flag flag--svg" viewBox="0 0 22 16" aria-label="Samisk flagg" role="img">
<rect width="22" height="16" fill="#0035AD"/><rect width="10" height="16" fill="#D10000"/>
<rect x="9.2" width="1.2" height="16" fill="#007229"/><rect x="10.4" width="1.6" height="16" fill="#FFD200"/>
<path d="M11.2 3.8a4.2 4.2 0 0 0 0 8.4" fill="none" stroke="#0035AD" stroke-width="1.5"/><path d="M11.2 3.8a4.2 4.2 0 0 1 0 8.4" fill="none" stroke="#D10000" stroke-width="1.5"/>
</svg>`;
export function flag(code) {
    if (code === "se") return SAMI_FLAG;
    return LANGUAGES[code].flag || `<span class="flag--text">${LANGUAGES[code].short || code.toUpperCase()}</span>`;
}
const flagOf = flag;
const MOVE_NO = { rock: "stein", scissors: "saks", paper: "papir" };
const BAND_PAD_LEFT = 120;
const BAND_PAD_TOP = 22;
const NODE_SIZES = [34, 30, 26, 22, 18, 14];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export class UI {
    constructor(agents) {
        this.agents = agents;
        this.byId = new Map(agents.map((a) => [a.id, a]));
        this.pyramid = document.getElementById("pyramid");
        this.lines = document.getElementById("lines");
        this.log = document.getElementById("log");
        this.nodes = new Map();
        this.active = new Map();
        this.roundMatches = [];
        this.history = new Map(agents.map((a) => [a.id, []]));
        this.rounds = [];
        this.matches = [];
        this.selectedMatch = null;
        this.matchFrom = null;
        this.lastMoves = new Map();
        this.selected = null;
        this.selectedDivision = null;
        this.langFilter = null;
        this.round = 0;
        this.stats = this.emptyStats();
        this.buildPyramid();
        this.buildLegend();
        this.buildTabs();
        this.buildStatShells();
        this.renderRounds();
        this.renderStats();
        this.layout();
        requestAnimationFrame(() => this.layout());
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.layout());
        window.addEventListener("resize", () => this.layout());
        window.addEventListener("keydown", (e) => {
            if (e.key !== "Escape") return;
            if (this.selected !== null) this.select(null);
            else if (this.selectedDivision !== null) this.selectDivision(null);
            else if (this.langFilter) this.filterLang(null);
        });
        document.getElementById("filter-clear").addEventListener("click", () => this.filterLang(null));
    }

    emptyStats() {
        const perLang = {};
        for (const code of Object.keys(LANGUAGES)) perLang[code] = { rock: 0, scissors: 0, paper: 0, invalid: 0, tool: 0, throws: 0, opening: { rock: 0, scissors: 0, paper: 0 }, repeat: 0, repeatable: 0, wins: 0, decided: 0 };
        return {
            perLang,
            native: { rock: 0, scissors: 0, paper: 0, wins: 0, decided: 0 },
            foreign: { rock: 0, scissors: 0, paper: 0, wins: 0, decided: 0 },
            tool: { wins: 0, decided: 0 },
            notool: { wins: 0, decided: 0 },
            pairs: new Map(),
        };
    }

    // ---------- pyramid ----------

    buildPyramid() {
        this.bands = [];
        DIVISION_NAMES.forEach((name, d) => {
            const band = document.createElement("div");
            band.className = "band";
            band.dataset.division = d;
            const label = document.createElement("button");
            label.type = "button";
            label.className = "band__label";
            label.title = "Åpne divisjonstabellen";
            label.innerHTML = `${esc(name)} <span class="band__count"></span>`;
            label.addEventListener("click", () => this.selectDivision(this.selectedDivision === d ? null : d));
            band.appendChild(label);
            this.pyramid.appendChild(band);
            this.bands.push(band);
        });
        const layer = document.createElement("div");
        layer.className = "agents";
        this.layer = layer;
        this.pyramid.appendChild(layer);
        for (const ag of this.agents) {
            const el = document.createElement("div");
            el.className = "agent";
            el.style.setProperty("--c", LANGUAGES[ag.lang].color);
            el.title = `${ag.name}, ${ag.city}`;
            el.textContent = ag.lang;
            el.addEventListener("click", () => this.select(this.selected === ag.id ? null : ag.id));
            layer.appendChild(el);
            this.nodes.set(ag.id, el);
        }
        this.layout();
    }

    buildLegend() {
        const bar = document.createElement("div");
        bar.className = "langbar";
        for (const [code, l] of Object.entries(LANGUAGES)) {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "chip";
            chip.dataset.lang = code;
            chip.style.setProperty("--c", l.color);
            chip.innerHTML = `<i></i>${flagOf(code)} ${esc(l.name)}`;
            chip.addEventListener("click", () => this.filterLang(this.langFilter === code ? null : code));
            bar.appendChild(chip);
        }
        this.langbar = bar;
        this.pyramid.after(bar);
    }

    // Band heights follow the head count; an empty band keeps a minimum.
    // Node size shrinks until every band fits the available height.
    layout() {
        const counts = DIVISION_NAMES.map((_, d) => this.agents.filter((a) => a.division === d).length);
        const { width, height } = this.pyramid.getBoundingClientRect();
        let NODE = NODE_SIZES[0], cols = 1, rowsPer = [];
        for (const size of NODE_SIZES) {
            NODE = size;
            cols = Math.max(1, Math.floor((width - BAND_PAD_LEFT - 20) / NODE));
            rowsPer = counts.map((n) => Math.max(1, Math.ceil(n / cols)));
            const need = rowsPer.reduce((t, r) => t + r * NODE + BAND_PAD_TOP, 0) + 6 * (DIVISION_NAMES.length - 1);
            if (need <= height) break;
        }
        const NODE_R = (NODE - 6) / 2;
        this.nodeR = NODE_R;
        this.pyramid.style.setProperty("--node", `${NODE - 6}px`);
        this.pyramid.style.gridTemplateRows = rowsPer.map((r) => `minmax(${r * NODE + BAND_PAD_TOP}px, ${r}fr)`).join(" ");
        this.bands.forEach((b, d) => { b.querySelector(".band__count").textContent = counts[d] ? counts[d] : "tom"; });
        const rect = this.pyramid.getBoundingClientRect();
        const bandRects = this.bands.map((b) => b.getBoundingClientRect());
        this.pos = new Map();
        DIVISION_NAMES.forEach((_, d) => {
            const list = this.agents.filter((a) => a.division === d).sort((x, y) => y.elo - x.elo);
            const b = bandRects[d];
            list.forEach((ag, i) => {
                const col = i % cols, row = Math.floor(i / cols);
                const x = b.left - rect.left + BAND_PAD_LEFT + col * NODE + 8;
                const y = b.top - rect.top + 12 + row * NODE;
                this.pos.set(ag.id, [x, y]);
                this.nodes.get(ag.id).style.transform = `translate(${x}px, ${y}px)`;
            });
        });
        this.drawLines();
    }

    // A new round: forget last round's lines.
    roundStart() {
        this.roundMatches = [];
        this.drawLines();
    }

    matchStart(a, b, langs) {
        this.active.set(`${a.id}-${b.id}`, { a, b, langs });
        this.nodes.get(a.id).classList.add("is-playing");
        this.nodes.get(b.id).classList.add("is-playing");
        this.drawLines();
    }

    matchEnd(a, b, r) {
        this.active.delete(`${a.id}-${b.id}`);
        this.nodes.get(a.id).classList.remove("is-playing");
        this.nodes.get(b.id).classList.remove("is-playing");
        if (r) {
            const [wa, wb] = r.result;
            const mid = this.matches.length;
            this.matches.push({ id: mid, round: this.round, a: a.id, b: b.id, langs: r.langs, result: r.result, throws: r.throws });
            this.history.get(a.id).push({ round: this.round, opp: b.id, lang: r.langs[0], own: wa, other: wb, throws: r.throws.map((t) => t.a), match: mid });
            this.history.get(b.id).push({ round: this.round, opp: a.id, lang: r.langs[1], own: wb, other: wa, throws: r.throws.map((t) => t.b), match: mid });
            const key = [a.lang, b.lang].sort().join("|");
            const pr = this.stats.pairs.get(key) || { n: 0, wins: {} };
            pr.n++;
            if (wa > wb) pr.wins[a.lang] = (pr.wins[a.lang] || 0) + 1;
            if (wb > wa) pr.wins[b.lang] = (pr.wins[b.lang] || 0) + 1;
            this.stats.pairs.set(key, pr);
            this.roundMatches.push({ a: a.id, b: b.id, lang: r.langs[0], match: mid });
            if (this.selected === a.id || this.selected === b.id) { this.renderDetail(); this.applyDim(); }
        }
        this.drawLines();
    }

    // After a round: mark movers, pause, slide them, pause, clear marks.
    async roundEnd({ n, moves, calls }) {
        this.rounds.push({ n, moves, calls, divisions: this.agents.map((a) => a.division), elos: this.agents.map((a) => Math.round(a.elo)) });
        this.lastMoves = new Map(moves.map((m) => [m.id, m]));
        for (const m of moves) this.nodes.get(m.id).classList.add(m.to < m.from ? "is-up" : "is-down");
        await sleep(700);
        // The lines stay after the move, redrawn at the new positions, so
        // every match of the round can still be opened until the next starts.
        this.layout();
        await sleep(1000);
        for (const m of moves) this.nodes.get(m.id).classList.remove("is-up", "is-down");
        this.renderStats();
        this.renderRounds();
        if (this.selected !== null) this.renderDetail();
        if (this.selectedDivision !== null) this.renderDivision();
        this.applyDim();
    }

    drawLines() {
        const NODE_R = this.nodeR || 14;
        const rect = this.pyramid.getBoundingClientRect();
        this.lines.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
        const line = (p, q, color, cls) => {
            const [x1, y1] = this.pos.get(p), [x2, y2] = this.pos.get(q);
            return `<line class="${cls}" x1="${x1 + NODE_R}" y1="${y1 + NODE_R}" x2="${x2 + NODE_R}" y2="${y2 + NODE_R}" stroke="${color}"/>`;
        };
        const hit = (p, q, mid) => {
            const [x1, y1] = this.pos.get(p), [x2, y2] = this.pos.get(q);
            return `<line class="lines__hit" data-match="${mid}" x1="${x1 + NODE_R}" y1="${y1 + NODE_R}" x2="${x2 + NODE_R}" y2="${y2 + NODE_R}"><title>Åpne kampen</title></line>`;
        };
        let svg = "";
        if (this.selected === null) {
            for (const m of this.roundMatches) {
                if (this.pos.has(m.a) && this.pos.has(m.b)) svg += line(m.a, m.b, LANGUAGES[m.lang].color, "lines__done" + (m.match === this.selectedMatch ? " lines__done--selected" : ""));
            }
            for (const { a, b, langs } of this.active.values()) {
                if (this.pos.has(a.id) && this.pos.has(b.id)) svg += line(a.id, b.id, LANGUAGES[langs[0]].color, "lines__live");
            }
            for (const m of this.roundMatches) {
                if (this.pos.has(m.a) && this.pos.has(m.b)) svg += hit(m.a, m.b, m.match);
            }
        } else if (this.pos.has(this.selected)) {
            for (const h of this.history.get(this.selected)) {
                if (!this.pos.has(h.opp)) continue;
                const color = h.own > h.other ? "var(--win)" : h.own < h.other ? "var(--loss)" : "var(--draw)";
                svg += line(this.selected, h.opp, color, "lines__net" + (h.match === this.selectedMatch ? " lines__net--selected" : ""));
            }
            for (const h of this.history.get(this.selected)) {
                if (this.pos.has(h.opp)) svg += hit(this.selected, h.opp, h.match);
            }
        }
        this.lines.innerHTML = svg;
        this.lines.querySelectorAll(".lines__hit").forEach((el) => {
            el.addEventListener("click", (e) => { e.stopPropagation(); this.selectMatch(Number(el.dataset.match), this.selected); });
        });
    }

    // Dimming combines the language filter, the selected agent's network
    // and the selected division.
    applyDim() {
        const net = this.selected !== null ? new Set(this.history.get(this.selected).map((h) => h.opp)) : null;
        for (const ag of this.agents) {
            const el = this.nodes.get(ag.id);
            let show = true;
            if (this.langFilter && ag.lang !== this.langFilter) show = false;
            if (net && ag.id !== this.selected && !net.has(ag.id)) show = false;
            if (this.selectedDivision !== null && this.selected === null && ag.division !== this.selectedDivision) show = false;
            el.classList.toggle("is-dim", !show);
            el.classList.toggle("is-selected", ag.id === this.selected);
            el.classList.toggle("is-opp", net !== null && net.has(ag.id));
        }
        this.bands.forEach((b, d) => b.classList.toggle("is-selected", d === this.selectedDivision));
        this.langbar.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c.dataset.lang === this.langFilter));
    }

    // ---------- selection ----------

    select(id) {
        this.selected = id;
        this.showTab("agent", id !== null);
        if (id !== null) { this.renderDetail(); this.activateTab("agent"); }
        else if (this.activeTab === "agent") this.activateTab(this.selectedDivision !== null ? "divisjon" : "oversikt");
        this.applyDim();
        this.drawLines();
    }

    selectDivision(d) {
        this.selectedDivision = d;
        this.showTab("divisjon", d !== null);
        if (d !== null) { this.renderDivision(); this.activateTab("divisjon"); }
        else if (this.activeTab === "divisjon") this.activateTab("oversikt");
        this.applyDim();
    }

    // Open one match. from is the agent id to return to, or null.
    selectMatch(id, from = null) {
        this.selectedMatch = id;
        if (id !== null) this.matchFrom = from;
        this.showTab("kamp", id !== null);
        if (id !== null) { this.renderMatch(); this.activateTab("kamp"); }
        else if (this.activeTab === "kamp") this.activateTab(this.selected !== null ? "agent" : "oversikt");
        this.drawLines();
    }

    filterLang(code) {
        this.langFilter = code;
        const box = document.getElementById("filter");
        box.hidden = !code;
        if (code) document.getElementById("filter-label").innerHTML = `Filter: <b style="--c:${LANGUAGES[code].color}">${flagOf(code)} ${esc(LANGUAGES[code].name)}</b>`;
        document.querySelectorAll(".row[data-lang]").forEach((r) => r.classList.toggle("is-filtered", r.dataset.lang === code));
        this.renderLangCard();
        if (code) this.activateTab("sprak");
        this.applyDim();
    }

    // ---------- tabs ----------

    buildTabs() {
        this.activeTab = "oversikt";
        document.querySelectorAll("#tabs .tab").forEach((t) => t.addEventListener("click", () => this.activateTab(t.dataset.tab)));
    }

    activateTab(name) {
        this.activeTab = name;
        document.querySelectorAll("#tabs .tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === name));
        document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === name));
    }

    showTab(name, on) {
        document.querySelector(`#tabs .tab[data-tab="${name}"]`).hidden = !on;
    }

    // ---------- clickable helpers ----------

    agentLink(ag, extraClass = "") {
        return `<button type="button" class="lnk lnk--agent ${extraClass}" data-id="${ag.id}" style="--c:${LANGUAGES[ag.lang].color}">${flagOf(ag.lang)} ${esc(ag.name)}</button>`;
    }

    langLink(code) {
        return `<button type="button" class="lnk lnk--lang" data-lang="${code}" style="--c:${LANGUAGES[code].color}">${flagOf(code)} ${esc(LANGUAGES[code].name)}</button>`;
    }

    matchLink(mid, label = "Se kampen") {
        return `<button type="button" class="lnk lnk--match" data-m="${mid}">${label}</button>`;
    }

    wire(root) {
        root.querySelectorAll(".lnk--agent").forEach((b) => b.addEventListener("click", () => this.select(Number(b.dataset.id))));
        root.querySelectorAll(".lnk--lang").forEach((b) => b.addEventListener("click", () => this.filterLang(this.langFilter === b.dataset.lang ? null : b.dataset.lang)));
        root.querySelectorAll(".lnk--match").forEach((b) => b.addEventListener("click", () => this.selectMatch(Number(b.dataset.m), this.selected)));
    }

    // ---------- agent detail ----------

    sparkline(values, { min, max, invert = false, step = false }) {
        if (values.length < 2) return `<p class="detail__facts">Kommer etter første runde</p>`;
        const w = 320, h = 60, pad = 4;
        const lo = min ?? Math.min(...values), hi = max ?? Math.max(...values);
        const span = hi - lo || 1;
        const px = (i) => pad + (i * (w - 2 * pad)) / (values.length - 1);
        const py = (v) => { const t = (v - lo) / span; return pad + (invert ? t : 1 - t) * (h - 2 * pad); };
        let d = "";
        values.forEach((v, i) => {
            if (i === 0) d += `M${px(i)},${py(v)}`;
            else if (step) d += ` H${px(i)} V${py(v)}`;
            else d += ` L${px(i)},${py(v)}`;
        });
        const dots = values.map((v, i) => `<circle cx="${px(i)}" cy="${py(v)}" r="2.5"/>`).join("");
        return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/>${dots}</svg>`;
    }

    renderDetail() {
        const ag = this.byId.get(this.selected);
        const hist = this.history.get(ag.id);
        const w = hist.filter((h) => h.own > h.other).length;
        const l = hist.filter((h) => h.own < h.other).length;
        const d = hist.length - w - l;
        const counts = { rock: 0, scissors: 0, paper: 0 };
        let tool = 0, throws = 0, foreign = 0;
        for (const h of hist) for (const t of h.throws) { throws++; if (t.move) counts[t.move]++; if (t.tool) tool++; if (!t.native) foreign++; }
        const pct = (n) => throws ? Math.round((100 * n) / throws) : 0;
        const rows = hist.slice().reverse().map((h) => {
            const o = this.byId.get(h.opp);
            const cls = h.own > h.other ? "win" : h.own < h.other ? "loss" : "draw";
            const seq = h.throws.map((t) => (t.move ? MOVE_NO[t.move] : "ugyldig") + (t.tool ? " (historikk)" : "")).join(", ");
            const dots = h.throws.map((t) => `<i class="dot dot--${t.move || "none"}${t.tool ? " dot--tool" : ""}" title="${esc((t.move ? MOVE_NO[t.move] : "ugyldig") + (t.tool ? ", ba om historikk" : ""))}"></i>`).join("");
            const why = h.throws.map((t) => t.text ? t.text.replace(/\s+/g, " ").slice(0, 90) : "").filter(Boolean).join(" · ");
            return `<li class="detail__match detail__match--${cls}" title="${esc(seq)}">${this.matchLink(h.match, `R${h.round}`)}${this.agentLink(o)}<span>${esc(LANGUAGES[h.lang].name)}</span><span class="dots">${dots}</span>${this.matchLink(h.match, `${h.own}–${h.other}`)}<small class="detail__why">${esc(why)}</small></li>`;
        }).join("");
        const divSeries = [START_DIVISION, ...this.rounds.map((r) => r.divisions[ag.id])];
        const eloSeries = [1000, ...this.rounds.map((r) => r.elos[ag.id])];
        const mv = this.lastMoves.get(ag.id);
        const moveNote = mv ? (mv.to < mv.from ? `<span class="up">▲ rykket opp</span>` : `<span class="down">▼ rykket ned</span>`) : "";
        document.getElementById("detail-body").innerHTML = `
            <div class="detail__head">
                <p class="detail__kicker">${this.langLink(ag.lang)} · ${esc(ag.city)}</p>
                <button type="button" class="btn btn--quiet btn--small" id="detail-close">Lukk</button>
            </div>
            <h2>${esc(ag.name)}</h2>
            <p class="detail__facts"><button type="button" class="lnk lnk--div" data-d="${ag.division}">${DIVISION_NAMES[ag.division]}</button> · ELO ${Math.round(ag.elo)} · ${ag.points} poeng ${moveNote}</p>
            <p class="detail__facts">${w} seire, ${d} uavgjort, ${l} tap · ${hist.length} kamper</p>
            <div class="row"><span class="row__label">Kast</span><div class="bar"><i class="bar__rock" style="width:${pct(counts.rock)}%"></i><i class="bar__scissors" style="width:${pct(counts.scissors)}%"></i><i class="bar__paper" style="width:${pct(counts.paper)}%"></i></div><span class="row__n">stein ${counts.rock} · saks ${counts.scissors} · papir ${counts.paper}</span></div>
            <p class="detail__facts">Ba om historikk i ${pct(tool)} % av kastene · ${pct(foreign)} % av kastene på fremmedspråk</p>
            <h3>Divisjon per runde</h3>
            ${this.sparkline(divSeries, { min: 0, max: DIVISION_NAMES.length - 1, invert: true, step: true })}
            <p class="spark__axis"><span>Eliteserien øverst</span><span>4. divisjon nederst</span></p>
            <h3>ELO per runde</h3>
            ${this.sparkline(eloSeries, {})}
            <p class="spark__axis"><span>lavest ${Math.min(...eloSeries)}</span><span>høyest ${Math.max(...eloSeries)}</span></p>
            <h3>Kamper</h3>
            <ol class="detail__matches">${rows || "<li>Ingen kamper ennå</li>"}</ol>`;
        const body = document.getElementById("detail-body");
        this.wire(body);
        body.querySelector("#detail-close").addEventListener("click", () => this.select(null));
        body.querySelector(".lnk--div").addEventListener("click", () => this.selectDivision(ag.division));
    }

    // ---------- match view ----------

    // The whole dialogue of one match: both sides per throw, the model's
    // full replies with the move highlighted, tool use, and the prompts.
    renderMatch() {
        const m = this.matches[this.selectedMatch];
        const A = this.byId.get(m.a), B = this.byId.get(m.b);
        const [la, lb] = m.langs;
        const mark = (side) => {
            const text = esc(side.text || "");
            if (!side.move) return `<span class="kamp__invalid">${text || "(tomt svar)"}</span>`;
            const word = localWord(side.lang, side.move);
            const re = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "i");
            return text.replace(re, `<mark class="kamp__move kamp__move--${side.move}">$1</mark>`);
        };
        const exchange = (side) => {
            if (!side.messages) return "";
            const rows = side.messages.slice(0, -1).map((msg) => `<p class="kamp__msg kamp__msg--${msg.role}"><span>${msg.role === "user" ? "Til modellen" : "Modellen"}</span>${esc(msg.content)}</p>`).join("");
            return `<details class="kamp__prompt"><summary>Vis prompt</summary><p class="kamp__msg kamp__msg--system"><span>System</span>${esc(side.system || "")}</p>${rows}</details>`;
        };
        const sideBox = (side, ag, won) => `
            <div class="kamp__side ${won ? "kamp__side--won" : ""}">
                <p class="kamp__reply">${mark(side)}</p>
                ${side.tool ? `<p class="kamp__tool">Ba om historikk først</p>` : ""}
                ${exchange(side)}
            </div>`;
        const throws = m.throws.map((t) => `
            <li class="kamp__throw">
                <div class="kamp__throwhead"><b>Kast ${t.n}</b><span>${t.winner === "a" ? esc(A.name) + " vinner" : t.winner === "b" ? esc(B.name) + " vinner" : "uavgjort"}</span></div>
                <div class="kamp__pair">${sideBox(t.a, A, t.winner === "a")}${sideBox(t.b, B, t.winner === "b")}</div>
            </li>`).join("");
        const head = (ag, lang, score, won) => `
            <div class="kamp__agent ${won ? "kamp__agent--won" : ""}">
                ${this.agentLink(ag)}
                <p class="detail__facts">${esc(ag.city)} · spiller på ${this.langLink(lang)}</p>
                <b class="kamp__score">${score}</b>
            </div>`;
        const back = this.matchFrom !== null && this.byId.has(this.matchFrom)
            ? `<button type="button" class="btn btn--quiet btn--small" id="kamp-back">← ${esc(this.byId.get(this.matchFrom).name)}</button>` : "";
        document.getElementById("kamp-body").innerHTML = `
            <div class="detail__head"><h2>Runde ${m.round}</h2><div class="kamp__buttons">${back}<button type="button" class="btn btn--quiet btn--small" id="kamp-close">Lukk</button></div></div>
            <div class="kamp__heads">${head(A, la, m.result[0], m.result[0] > m.result[1])}<span class="kamp__vs">mot</span>${head(B, lb, m.result[1], m.result[1] > m.result[0])}</div>
            <ol class="kamp__throws">${throws}</ol>`;
        const body = document.getElementById("kamp-body");
        this.wire(body);
        body.querySelector("#kamp-close").addEventListener("click", () => this.selectMatch(null));
        const bb = body.querySelector("#kamp-back");
        if (bb) bb.addEventListener("click", () => { const from = this.matchFrom; this.selectMatch(null); this.select(from); });
    }

    // ---------- division table ----------

    renderDivision() {
        const d = this.selectedDivision;
        const list = this.agents.filter((a) => a.division === d).sort((x, y) => (y.roundPoints - x.roundPoints) || (y.elo - x.elo));
        const rows = list.map((ag, i) => {
            const mv = this.lastMoves.get(ag.id);
            const arrow = mv ? (mv.to < mv.from ? `<span class="up" title="Rykket opp hit">▲</span>` : `<span class="down" title="Rykket ned hit">▼</span>`) : "";
            return `<tr><td>${i + 1}</td><td>${this.agentLink(ag)}</td><td>${this.langLink(ag.lang)}</td><td>${ag.roundPoints}</td><td>${ag.points}</td><td>${Math.round(ag.elo)}</td><td>${arrow}</td></tr>`;
        }).join("");
        const langCount = {};
        for (const ag of list) langCount[ag.lang] = (langCount[ag.lang] || 0) + 1;
        const mix = Object.entries(langCount).sort((x, y) => y[1] - x[1]).map(([c, n]) => `${this.langLink(c)} ${n}`).join(" · ");
        document.getElementById("division-body").innerHTML = `
            <div class="detail__head"><h2>${DIVISION_NAMES[d]}</h2><button type="button" class="btn btn--quiet btn--small" id="division-close">Lukk</button></div>
            <p class="detail__facts">${list.length} agenter${list.length ? " · " + mix : ""}</p>
            ${list.length ? `<table class="table"><thead><tr><th>#</th><th>Agent</th><th>Språk</th><th title="Poeng i siste runde">Runde</th><th title="Poeng totalt">Totalt</th><th>ELO</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : "<p class='detail__facts'>Ingen agenter her akkurat nå.</p>"}`;
        const body = document.getElementById("division-body");
        this.wire(body);
        body.querySelector("#division-close").addEventListener("click", () => this.selectDivision(null));
    }

    // ---------- rounds ----------

    renderRounds() {
        const box = document.getElementById("rounds");
        if (!this.rounds.length) { box.innerHTML = "<li class='detail__facts'>Ingen runder spilt ennå.</li>"; return; }
        box.innerHTML = this.rounds.slice().reverse().map((r) => {
            const ups = r.moves.filter((m) => m.to < m.from), downs = r.moves.filter((m) => m.to > m.from);
            const up = ups.map((m) => this.agentLink(this.byId.get(m.id))).join(" ");
            const down = downs.map((m) => this.agentLink(this.byId.get(m.id))).join(" ");
            const counts = DIVISION_NAMES.map((_, d) => r.divisions.filter((x) => x === d).length).join(" / ");
            const games = this.matches.filter((m) => m.round === r.n);
            const list = games.map((m) => `<li class="matchrow">${this.matchLink(m.id, `${m.result[0]}–${m.result[1]}`)} ${this.agentLink(this.byId.get(m.a))} <span class="matchrow__vs">mot</span> ${this.agentLink(this.byId.get(m.b))}</li>`).join("");
            return `<li class="roundrow">
                <div class="roundrow__head"><b>Runde ${r.n}</b><span>${r.calls} kall</span></div>
                <p class="detail__facts">Divisjoner etterpå, øverst til nederst: ${counts}</p>
                <p class="roundrow__list"><span class="up">▲ ${ups.length}</span> ${up || "ingen"}</p>
                <p class="roundrow__list"><span class="down">▼ ${downs.length}</span> ${down || "ingen"}</p>
                <details class="roundrow__games"><summary>${games.length} kamper</summary><ol class="matchlist">${list}</ol></details>
            </li>`;
        }).join("");
        this.wire(box);
    }

    // ---------- stats ----------

    recordThrow(entry, a, b) {
        for (const [side, ag, key] of [[entry.a, a, "a"], [entry.b, b, "b"]]) {
            const s = this.stats.perLang[ag.lang];
            s.throws++;
            if (side.tool) s.tool++;
            const nf = side.native ? this.stats.native : this.stats.foreign;
            const tk = side.tool ? this.stats.tool : this.stats.notool;
            if (entry.winner) {
                nf.decided++; tk.decided++; s.decided++;
                if (entry.winner === key) { nf.wins++; tk.wins++; s.wins++; }
            }
            if (side.move) {
                s[side.move]++;
                nf[side.move]++;
                if (entry.n === 1) s.opening[side.move]++;
                const prev = ag.moves[ag.moves.length - 2];
                if (prev) { s.repeatable++; if (prev === side.move) s.repeat++; }
            } else s.invalid++;
            this.addLog(ag, side);
        }
        this.renderStats();
    }

    addLog(ag, side) {
        const li = document.createElement("li");
        const move = side.move ? localWord(side.lang, side.move) : "ugyldig";
        li.innerHTML = `${this.agentLink(ag, "log__name")} <span class="log__move">${esc(move)}</span>${side.tool ? ' <span class="log__tool">historikk</span>' : ""} <span class="log__text"></span>`;
        li.querySelector(".log__text").textContent = side.text.replace(/\s+/g, " ").slice(0, 140);
        this.wire(li);
        this.log.prepend(li);
        while (this.log.children.length > 12) this.log.lastChild.remove();
    }

    langRow(code, single) {
        const l = LANGUAGES[code];
        const bar = single ? `<div class="bar bar--single"><i></i></div>` : `<div class="bar"><i class="bar__rock"></i><i class="bar__scissors"></i><i class="bar__paper"></i></div>`;
        return `<div class="row" data-lang="${code}"><button type="button" class="row__label lnk lnk--lang" data-lang="${code}" style="--c:${l.color}">${flagOf(code)} ${esc(l.name)}</button>${bar}<span class="row__n"></span></div>`;
    }

    buildStatShells() {
        for (const id of ["stat-lang", "stat-opening"]) {
            const box = document.getElementById(id);
            box.innerHTML = Object.keys(LANGUAGES).map((c) => this.langRow(c, false)).join("");
            this.wire(box);
        }
        for (const id of ["stat-tool", "stat-elo", "stat-repeat", "stat-invalid", "stat-elite"]) {
            const box = document.getElementById(id);
            box.innerHTML = Object.keys(LANGUAGES).map((c) => this.langRow(c, true)).join("");
            this.wire(box);
        }
        const nf = document.getElementById("stat-native");
        for (const key of ["native", "foreign"]) {
            nf.insertAdjacentHTML("beforeend", `<div class="row" data-key="${key}"><span class="row__label">${key === "native" ? "Morsmål" : "Fremmedspråk"}</span><div class="bar"><i class="bar__rock"></i><i class="bar__scissors"></i><i class="bar__paper"></i></div><span class="row__n"></span></div>`);
        }
        const wr = document.getElementById("stat-winrate");
        for (const [key, label] of [["native", "Morsmål"], ["foreign", "Fremmedspråk"], ["tool", "Med historikk"], ["notool", "Uten historikk"]]) {
            wr.insertAdjacentHTML("beforeend", `<div class="row" data-key="${key}"><span class="row__label">${label}</span><div class="bar bar--single"><i></i></div><span class="row__n"></span></div>`);
        }
        this.renderLangCard();
    }

    fillBar(row, counts) {
        const total = MOVES.reduce((n, m) => n + counts[m], 0) || 1;
        for (const m of MOVES) row.querySelector(`.bar__${m}`).style.width = `${(100 * counts[m]) / total}%`;
        row.querySelector(".row__n").textContent = total > 1 ? MOVES.map((m) => `${MOVE_NO[m]} ${Math.round((100 * counts[m]) / total)}`).join(" · ") : "";
    }

    fillSingle(sel, pct, text) {
        const r = document.querySelector(sel);
        r.querySelector("i").style.width = `${Math.max(0, Math.min(100, pct))}%`;
        r.querySelector(".row__n").textContent = text;
    }

    // Summary card for the filtered language, at the top of the Språk tab.
    renderLangCard() {
        const box = document.getElementById("lang-card");
        const code = this.langFilter;
        if (!code) { box.innerHTML = ""; return; }
        const s = this.stats.perLang[code];
        const list = this.agents.filter((a) => a.lang === code).sort((x, y) => y.elo - x.elo);
        const mean = list.length ? Math.round(list.reduce((n, a) => n + a.elo, 0) / list.length) : 0;
        const divs = DIVISION_NAMES.map((name, d) => `${name} ${list.filter((a) => a.division === d).length}`).join(" · ");
        const pct = (n, dd) => (dd ? Math.round((100 * n) / dd) : 0);
        box.innerHTML = `
            <div class="langcard" style="--c:${LANGUAGES[code].color}">
                <h2>${flagOf(code)} ${esc(LANGUAGES[code].name)}</h2>
                <p class="detail__facts">${list.length} agenter · ELO-snitt ${mean} · ${s.throws} kast</p>
                <p class="detail__facts">Vinner ${pct(s.wins, s.decided)} % av avgjorte kast · historikk i ${pct(s.tool, s.throws)} % · gjentar ${pct(s.repeat, s.repeatable)} % · ${s.invalid} ugyldige</p>
                <p class="detail__facts">${divs}</p>
                <p class="detail__facts">Beste: ${list.slice(0, 3).map((a) => `${this.agentLink(a)} ${Math.round(a.elo)}`).join(" · ") || "ingen"}</p>
            </div>`;
        this.wire(box);
    }

    renderStats() {
        const any = Object.values(this.stats.perLang).some((s) => s.throws > 0);
        document.querySelectorAll(".panel__empty").forEach((e) => { e.hidden = any; });
        document.querySelectorAll(".panel__data").forEach((e) => { e.hidden = !any; });
        const eliteN = {};
        for (const a of this.agents) if (a.division === 0) eliteN[a.lang] = (eliteN[a.lang] || 0) + 1;
        const maxElite = Math.max(1, ...Object.values(eliteN));
        for (const [code, s] of Object.entries(this.stats.perLang)) {
            this.fillBar(document.querySelector(`#stat-lang .row[data-lang="${code}"]`), s);
            this.fillBar(document.querySelector(`#stat-opening .row[data-lang="${code}"]`), s.opening);
            const pct = (n, d) => (d ? (100 * n) / d : 0);
            const txt = (n, d) => (d ? `${Math.round(pct(n, d))} %` : "");
            this.fillSingle(`#stat-tool .row[data-lang="${code}"]`, pct(s.tool, s.throws), txt(s.tool, s.throws));
            this.fillSingle(`#stat-repeat .row[data-lang="${code}"]`, pct(s.repeat, s.repeatable), txt(s.repeat, s.repeatable));
            this.fillSingle(`#stat-invalid .row[data-lang="${code}"]`, pct(s.invalid, s.throws) * 5, s.throws ? `${s.invalid}` : "");
            this.fillSingle(`#stat-elite .row[data-lang="${code}"]`, (100 * (eliteN[code] || 0)) / maxElite, `${eliteN[code] || 0}`);
        }
        for (const key of ["native", "foreign", "tool", "notool"]) {
            const w = this.stats[key];
            this.fillSingle(`#stat-winrate .row[data-key="${key}"]`, w.decided ? (100 * w.wins) / w.decided : 0, w.decided ? `${Math.round((100 * w.wins) / w.decided)} %` : "");
        }
        const pairs = [...this.stats.pairs.entries()].filter(([k]) => k.split("|")[0] !== k.split("|")[1]).sort((x, y) => y[1].n - x[1].n).slice(0, 10);
        const pairsBox = document.getElementById("stat-pairs");
        pairsBox.innerHTML = pairs.map(([k, p]) => {
            const [x, y] = k.split("|");
            return `<li class="pair">${this.langLink(x)}<b>${p.wins[x] || 0}–${p.wins[y] || 0}</b>${this.langLink(y)}<small>${p.n} kamper</small></li>`;
        }).join("") || "<li>Ingen kamper ennå</li>";
        this.wire(pairsBox);
        const top = [...this.agents].sort((x, y) => y.elo - x.elo);
        const line = (a) => `<li>${this.agentLink(a)}<span>${DIVISION_NAMES[a.division]}</span><b>${Math.round(a.elo)}</b></li>`;
        const topBox = document.getElementById("stat-top"), botBox = document.getElementById("stat-bottom");
        topBox.innerHTML = top.slice(0, 5).map(line).join("");
        botBox.innerHTML = top.slice(-5).reverse().map(line).join("");
        this.wire(topBox); this.wire(botBox);
        this.fillBar(document.querySelector('#stat-native .row[data-key="native"]'), this.stats.native);
        this.fillBar(document.querySelector('#stat-native .row[data-key="foreign"]'), this.stats.foreign);
        const means = {};
        for (const code of Object.keys(LANGUAGES)) {
            const list = this.agents.filter((a) => a.lang === code);
            means[code] = list.length ? list.reduce((n, a) => n + a.elo, 0) / list.length : 1000;
        }
        const lo = Math.min(...Object.values(means)), hi = Math.max(...Object.values(means));
        for (const [code, m] of Object.entries(means)) {
            this.fillSingle(`#stat-elo .row[data-lang="${code}"]`, hi > lo ? ((m - lo) / (hi - lo)) * 100 : 50, `${Math.round(m)}`);
        }
        if (this.langFilter) this.renderLangCard();
    }

    setStatus(text) {
        document.getElementById("status").textContent = text;
    }
}
