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
        this.stats = this.emptyStats();
        this.buildPyramid();
        this.buildStatShells();
        window.addEventListener("resize", () => this.layout());
    }

    emptyStats() {
        const perLang = {};
        for (const code of Object.keys(LANGUAGES)) perLang[code] = { rock: 0, scissors: 0, paper: 0, invalid: 0, tool: 0, throws: 0 };
        return { perLang, native: { rock: 0, scissors: 0, paper: 0 }, foreign: { rock: 0, scissors: 0, paper: 0 } };
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

    matchEnd(a, b) {
        this.active.delete(`${a.id}-${b.id}`);
        this.nodes.get(a.id).classList.remove("is-playing");
        this.nodes.get(b.id).classList.remove("is-playing");
        this.drawLines();
    }

    drawLines() {
        const rect = this.pyramid.getBoundingClientRect();
        this.lines.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
        let svg = "";
        for (const { a, b, langs } of this.active.values()) {
            const [x1, y1] = this.pos.get(a.id), [x2, y2] = this.pos.get(b.id);
            svg += `<line x1="${x1 + 14}" y1="${y1 + 14}" x2="${x2 + 14}" y2="${y2 + 14}" stroke="${LANGUAGES[langs[0]].color}"/>`;
        }
        this.lines.innerHTML = svg;
    }

    recordThrow(entry, a, b) {
        for (const [side, ag] of [[entry.a, a], [entry.b, b]]) {
            const s = this.stats.perLang[ag.lang];
            s.throws++;
            if (side.tool) s.tool++;
            if (side.move) {
                s[side.move]++;
                (side.native ? this.stats.native : this.stats.foreign)[side.move]++;
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
        const tool = document.getElementById("stat-tool");
        const elo = document.getElementById("stat-elo");
        for (const [code, l] of Object.entries(LANGUAGES)) {
            tool.insertAdjacentHTML("beforeend", `<div class="row" data-lang="${code}"><span class="row__label">${l.flag} ${l.name}</span><div class="bar bar--single"><i></i></div><span class="row__n"></span></div>`);
            elo.insertAdjacentHTML("beforeend", `<div class="row" data-lang="${code}"><span class="row__label">${l.flag} ${l.name}</span><div class="bar bar--single"><i></i></div><span class="row__n"></span></div>`);
        }
    }

    fillBar(row, counts) {
        const total = MOVES.reduce((n, m) => n + counts[m], 0) || 1;
        for (const m of MOVES) row.querySelector(`.bar__${m}`).style.width = `${(100 * counts[m]) / total}%`;
        row.querySelector(".row__n").textContent = total > 1 ? MOVES.map((m) => `${MOVE_NO[m]} ${Math.round((100 * counts[m]) / total)}`).join(" · ") : "";
    }

    renderStats() {
        for (const [code, s] of Object.entries(this.stats.perLang)) {
            this.fillBar(document.querySelector(`#stat-lang .row[data-lang="${code}"]`), s);
            const tr = document.querySelector(`#stat-tool .row[data-lang="${code}"]`);
            const pct = s.throws ? (100 * s.tool) / s.throws : 0;
            tr.querySelector("i").style.width = `${pct}%`;
            tr.querySelector(".row__n").textContent = s.throws ? `${Math.round(pct)} %` : "";
        }
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
