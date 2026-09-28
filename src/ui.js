// Rendering: pyramid of divisions on the left, statistics on the right,
// a rolling log at the bottom.

import { LANGUAGES, localWord } from "./languages.js";
import { DIVISION_SIZES, DIVISION_NAMES } from "./league.js";

const MOVES = ["rock", "scissors", "paper"];
const MOVE_NO = { rock: "stein", scissors: "saks", paper: "papir" };

export class UI {
    constructor(agents) {
        this.agents = agents;
        this.pyramid = document.getElementById("pyramid");
        this.lines = document.getElementById("lines");
        this.log = document.getElementById("log");
        this.nodes = new Map();
        this.active = new Map();
        this.history = new Map(agents.map((a) => [a.id, []]));
        this.selected = null;
        this.round = 0;
        this.detail = document.getElementById("detail");
        this.detailBody = document.getElementById("detail-body");
        this.statsPanel = document.getElementById("stats");
        document.getElementById("detail-close").addEventListener("click", () => this.select(null));
        window.addEventListener("keydown", (e) => { if (e.key === "Escape") this.select(null); });
        this.stats = this.emptyStats();
        this.buildPyramid();
        this.buildStatShells();
        window.addEventListener("resize", () => this.layout());
    }

    emptyStats() {
        const perLang = {};
        for (const code of Object.keys(LANGUAGES)) perLang[code] = { rock: 0, scissors: 0, paper: 0, invalid: 0, tool: 0, throws: 0, opening: { rock: 0, scissors: 0, paper: 0 }, repeat: 0, repeatable: 0, elite: 0 };
        return {
            perLang,
            native: { rock: 0, scissors: 0, paper: 0, wins: 0, decided: 0 },
            foreign: { rock: 0, scissors: 0, paper: 0, wins: 0, decided: 0 },
            tool: { wins: 0, decided: 0 },
            notool: { wins: 0, decided: 0 },
            pairs: new Map(),
        };
    }

    buildPyramid() {
        DIVISION_SIZES.forEach((_, d) => {
            const band = document.createElement("div");
            band.className = "band";
            band.dataset.division = d;
            const label = document.createElement("span");
            label.className = "band__label";
            label.textContent = DIVISION_NAMES[d];
            band.appendChild(label);
            this.pyramid.appendChild(band);
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

    // Position every agent inside its band, ordered by ELO.
    layout() {
        const rect = this.pyramid.getBoundingClientRect();
        const bands = [...this.pyramid.querySelectorAll(".band")].map((b) => b.getBoundingClientRect());
        this.pos = new Map();
        DIVISION_SIZES.forEach((_, d) => {
            const list = this.agents.filter((a) => a.division === d).sort((x, y) => y.elo - x.elo);
            const b = bands[d];
            const cols = Math.min(list.length, Math.max(1, Math.floor((b.width - 140) / 34)));
            list.forEach((ag, i) => {
                const col = i % cols, row = Math.floor(i / cols);
                const x = b.left - rect.left + 120 + col * 34 + 8;
                const y = b.top - rect.top + 10 + row * 34;
                this.pos.set(ag.id, [x, y]);
                this.nodes.get(ag.id).style.transform = `translate(${x}px, ${y}px)`;
            });
        });
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
            this.history.get(a.id).push({ round: this.round, opp: b.id, lang: r.langs[0], own: wa, other: wb, throws: r.throws.map((t) => t.a) });
            this.history.get(b.id).push({ round: this.round, opp: a.id, lang: r.langs[1], own: wb, other: wa, throws: r.throws.map((t) => t.b) });
            const key = [a.lang, b.lang].sort().join("|");
            const pr = this.stats.pairs.get(key) || { n: 0, wins: { [a.lang]: 0, [b.lang]: 0 } };
            pr.n++;
            if (wa > wb) pr.wins[a.lang] = (pr.wins[a.lang] || 0) + 1;
            if (wb > wa) pr.wins[b.lang] = (pr.wins[b.lang] || 0) + 1;
            this.stats.pairs.set(key, pr);
            if (this.selected === a.id || this.selected === b.id) this.renderDetail();
        }
        this.drawLines();
    }

    // Click on an agent: show its record and draw its network of opponents.
    select(id) {
        this.selected = id;
        for (const [aid, el] of this.nodes) {
            el.classList.toggle("is-selected", aid === id);
            el.classList.toggle("is-dim", id !== null && aid !== id && !this.history.get(id).some((h) => h.opp === aid));
        }
        this.detail.hidden = id === null;
        this.statsPanel.hidden = id !== null;
        if (id !== null) this.renderDetail();
        this.drawLines();
    }

    renderDetail() {
        const ag = this.agents.find((a) => a.id === this.selected);
        const hist = this.history.get(ag.id);
        const byId = new Map(this.agents.map((a) => [a.id, a]));
        const w = hist.filter((h) => h.own > h.other).length;
        const l = hist.filter((h) => h.own < h.other).length;
        const d = hist.length - w - l;
        const counts = { rock: 0, scissors: 0, paper: 0 };
        let tool = 0, throws = 0, foreign = 0;
        for (const h of hist) for (const t of h.throws) { throws++; if (t.move) counts[t.move]++; if (t.tool) tool++; if (!t.native) foreign++; }
        const pct = (n) => throws ? Math.round((100 * n) / throws) : 0;
        const rows = hist.slice().reverse().map((h) => {
            const o = byId.get(h.opp);
            const cls = h.own > h.other ? "win" : h.own < h.other ? "loss" : "draw";
            return `<li class="detail__match detail__match--${cls}"><span>R${h.round}</span><button type="button" class="detail__opp" data-id="${o.id}" style="--c:${LANGUAGES[o.lang].color}">${LANGUAGES[o.lang].flag} ${o.name}</button><span>${LANGUAGES[h.lang].name}</span><b>${h.own}–${h.other}</b></li>`;
        }).join("");
        this.detailBody.innerHTML = `
            <p class="detail__kicker" style="--c:${LANGUAGES[ag.lang].color}">${LANGUAGES[ag.lang].flag} ${LANGUAGES[ag.lang].name} · ${ag.city}</p>
            <h2>${ag.name}</h2>
            <p class="detail__facts">${DIVISION_NAMES[ag.division]} · ELO ${Math.round(ag.elo)} · ${ag.points} poeng</p>
            <p class="detail__facts">${w} seire, ${d} uavgjort, ${l} tap · ${hist.length} kamper</p>
            <div class="row"><span class="row__label">Kast</span><div class="bar"><i class="bar__rock" style="width:${pct(counts.rock)}%"></i><i class="bar__scissors" style="width:${pct(counts.scissors)}%"></i><i class="bar__paper" style="width:${pct(counts.paper)}%"></i></div><span class="row__n">stein ${counts.rock} · saks ${counts.scissors} · papir ${counts.paper}</span></div>
            <p class="detail__facts">Ba om historikk i ${pct(tool)} % av kastene · ${pct(foreign)} % på fremmedspråk</p>
            <h3>Kamper</h3>
            <ol class="detail__matches">${rows || "<li>Ingen kamper ennå</li>"}</ol>`;
        this.detailBody.querySelectorAll(".detail__opp").forEach((b) => b.addEventListener("click", () => this.select(Number(b.dataset.id))));
    }

    drawLines() {
        const rect = this.pyramid.getBoundingClientRect();
        this.lines.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
        let svg = "";
        if (this.selected !== null) {
            const [x1, y1] = this.pos.get(this.selected);
            for (const h of this.history.get(this.selected)) {
                const [x2, y2] = this.pos.get(h.opp);
                const color = h.own > h.other ? "var(--win)" : h.own < h.other ? "var(--loss)" : "var(--draw)";
                svg += `<line class="lines__net" x1="${x1 + 14}" y1="${y1 + 14}" x2="${x2 + 14}" y2="${y2 + 14}" stroke="${color}"/>`;
            }
        }
        for (const { a, b, langs } of this.active.values()) {
            const [x1, y1] = this.pos.get(a.id), [x2, y2] = this.pos.get(b.id);
            svg += `<line x1="${x1 + 14}" y1="${y1 + 14}" x2="${x2 + 14}" y2="${y2 + 14}" stroke="${LANGUAGES[langs[0]].color}"/>`;
        }
        this.lines.innerHTML = svg;
    }

    recordThrow(entry, a, b) {
        for (const [side, ag, key] of [[entry.a, a, "a"], [entry.b, b, "b"]]) {
            const s = this.stats.perLang[ag.lang];
            s.throws++;
            if (side.tool) s.tool++;
            const nf = side.native ? this.stats.native : this.stats.foreign;
            const tk = side.tool ? this.stats.tool : this.stats.notool;
            if (entry.winner) {
                nf.decided++; tk.decided++;
                if (entry.winner === key) { nf.wins++; tk.wins++; }
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
        li.innerHTML = `<b style="--c:${LANGUAGES[ag.lang].color}">${LANGUAGES[ag.lang].flag} ${ag.name}</b> <span class="log__move">${move}</span>${side.tool ? ' <span class="log__tool">historikk</span>' : ""} <span class="log__text"></span>`;
        li.querySelector(".log__text").textContent = side.text.replace(/\s+/g, " ").slice(0, 140);
        this.log.prepend(li);
        while (this.log.children.length > 12) this.log.lastChild.remove();
    }

    buildStatShells() {
        const langs = document.getElementById("stat-lang");
        for (const [code, l] of Object.entries(LANGUAGES)) {
            langs.insertAdjacentHTML("beforeend", `<div class="row" data-lang="${code}"><span class="row__label">${l.flag} ${l.name}</span><div class="bar"><i class="bar__rock"></i><i class="bar__scissors"></i><i class="bar__paper"></i></div><span class="row__n"></span></div>`);
        }
        const nf = document.getElementById("stat-native");
        for (const key of ["native", "foreign"]) {
            nf.insertAdjacentHTML("beforeend", `<div class="row" data-key="${key}"><span class="row__label">${key === "native" ? "Morsmål" : "Fremmedspråk"}</span><div class="bar"><i class="bar__rock"></i><i class="bar__scissors"></i><i class="bar__paper"></i></div><span class="row__n"></span></div>`);
        }
        const open = document.getElementById("stat-opening");
        for (const [code, l] of Object.entries(LANGUAGES)) {
            open.insertAdjacentHTML("beforeend", `<div class="row" data-lang="${code}"><span class="row__label">${l.flag} ${l.name}</span><div class="bar"><i class="bar__rock"></i><i class="bar__scissors"></i><i class="bar__paper"></i></div><span class="row__n"></span></div>`);
        }
        for (const id of ["stat-tool", "stat-elo", "stat-repeat", "stat-invalid", "stat-elite"]) {
            const box = document.getElementById(id);
            for (const [code, l] of Object.entries(LANGUAGES)) {
                box.insertAdjacentHTML("beforeend", `<div class="row" data-lang="${code}"><span class="row__label">${l.flag} ${l.name}</span><div class="bar bar--single"><i></i></div><span class="row__n"></span></div>`);
            }
        }
        const wr = document.getElementById("stat-winrate");
        for (const [key, label] of [["native", "Morsmål"], ["foreign", "Fremmedspråk"], ["tool", "Med historikk"], ["notool", "Uten historikk"]]) {
            wr.insertAdjacentHTML("beforeend", `<div class="row" data-key="${key}"><span class="row__label">${label}</span><div class="bar bar--single"><i></i></div><span class="row__n"></span></div>`);
        }
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

    renderStats() {
        const eliteN = {};
        for (const a of this.agents) if (a.division === 0) eliteN[a.lang] = (eliteN[a.lang] || 0) + 1;
        for (const [code, s] of Object.entries(this.stats.perLang)) {
            this.fillBar(document.querySelector(`#stat-lang .row[data-lang="${code}"]`), s);
            this.fillBar(document.querySelector(`#stat-opening .row[data-lang="${code}"]`), s.opening);
            const pct = (n, d) => (d ? (100 * n) / d : 0);
            const txt = (n, d) => (d ? `${Math.round(pct(n, d))} %` : "");
            this.fillSingle(`#stat-tool .row[data-lang="${code}"]`, pct(s.tool, s.throws), txt(s.tool, s.throws));
            this.fillSingle(`#stat-repeat .row[data-lang="${code}"]`, pct(s.repeat, s.repeatable), txt(s.repeat, s.repeatable));
            this.fillSingle(`#stat-invalid .row[data-lang="${code}"]`, pct(s.invalid, s.throws) * 5, s.throws ? `${s.invalid}` : "");
            this.fillSingle(`#stat-elite .row[data-lang="${code}"]`, (eliteN[code] || 0) * 10, `${eliteN[code] || 0}`);
        }
        for (const key of ["native", "foreign", "tool", "notool"]) {
            const w = this.stats[key];
            this.fillSingle(`#stat-winrate .row[data-key="${key}"]`, w.decided ? (100 * w.wins) / w.decided : 0, w.decided ? `${Math.round((100 * w.wins) / w.decided)} %` : "");
        }
        const pairs = [...this.stats.pairs.entries()].filter(([k]) => k.split("|")[0] !== k.split("|")[1]).sort((x, y) => y[1].n - x[1].n).slice(0, 8);
        document.getElementById("stat-pairs").innerHTML = pairs.map(([k, p]) => {
            const [x, y] = k.split("|");
            return `<li class="pair"><span>${LANGUAGES[x].flag} ${LANGUAGES[x].name}</span><b>${p.wins[x] || 0}–${p.wins[y] || 0}</b><span>${LANGUAGES[y].flag} ${LANGUAGES[y].name}</span><small>${p.n} kamper</small></li>`;
        }).join("") || "<li>Ingen kamper ennå</li>";
        const top = [...this.agents].sort((x, y) => y.elo - x.elo);
        const line = (a) => `<li><span style="--c:${LANGUAGES[a.lang].color}">${LANGUAGES[a.lang].flag} ${a.name}</span><b>${Math.round(a.elo)}</b></li>`;
        document.getElementById("stat-top").innerHTML = top.slice(0, 5).map(line).join("");
        document.getElementById("stat-bottom").innerHTML = top.slice(-5).reverse().map(line).join("");
        this.fillBar(document.querySelector('#stat-native .row[data-key="native"]'), this.stats.native);
        this.fillBar(document.querySelector('#stat-native .row[data-key="foreign"]'), this.stats.foreign);
        const means = {};
        for (const code of Object.keys(LANGUAGES)) {
            const list = this.agents.filter((a) => a.lang === code);
            means[code] = list.reduce((n, a) => n + a.elo, 0) / list.length;
        }
        const lo = Math.min(...Object.values(means)), hi = Math.max(...Object.values(means));
        for (const [code, m] of Object.entries(means)) {
            const r = document.querySelector(`#stat-elo .row[data-lang="${code}"]`);
            r.querySelector("i").style.width = `${hi > lo ? ((m - lo) / (hi - lo)) * 100 : 50}%`;
            r.querySelector(".row__n").textContent = Math.round(m);
        }
    }

    setStatus(text) {
        document.getElementById("status").textContent = text;
    }
}
