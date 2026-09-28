// Ten languages, their words for the three moves, and prompt templates.
// The prompt is written in the language the match is played in.

export const LANGUAGES = {
    no: { name: "Norsk", flag: "🇳🇴", color: "#EE3A64" },
    sv: { name: "Svensk", flag: "🇸🇪", color: "#F2C94C" },
    da: { name: "Dansk", flag: "🇩🇰", color: "#C1272D" },
    fi: { name: "Finsk", flag: "🇫🇮", color: "#06B3C6" },
    is: { name: "Islandsk", flag: "🇮🇸", color: "#5B7DB1" },
    en: { name: "Engelsk", flag: "🇬🇧", color: "#9C9C9C" },
    de: { name: "Tysk", flag: "🇩🇪", color: "#F49727" },
    nl: { name: "Nederlandsk", flag: "🇳🇱", color: "#FF7A00" },
    fr: { name: "Fransk", flag: "🇫🇷", color: "#7B61FF" },
    es: { name: "Spansk", flag: "🇪🇸", color: "#2FB36B" },
};

// Word -> canonical move. Lowercased, accents kept.
export const MOVE_WORDS = {
    no: { stein: "rock", saks: "scissors", papir: "paper" },
    sv: { sten: "rock", sax: "scissors", påse: "paper", papper: "paper" },
    da: { sten: "rock", saks: "scissors", papir: "paper" },
    fi: { kivi: "rock", sakset: "scissors", paperi: "paper" },
    is: { steinn: "rock", skæri: "scissors", blað: "paper", pappír: "paper" },
    en: { rock: "rock", scissors: "scissors", paper: "paper" },
    de: { stein: "rock", schere: "scissors", papier: "paper" },
    nl: { steen: "rock", schaar: "scissors", papier: "paper" },
    fr: { pierre: "rock", ciseaux: "scissors", feuille: "paper", papier: "paper" },
    es: { piedra: "rock", tijera: "scissors", tijeras: "scissors", papel: "paper" },
};

export const MOVE_LABEL = {
    no: ["stein", "saks", "papir"],
    sv: ["sten", "sax", "påse"],
    da: ["sten", "saks", "papir"],
    fi: ["kivi", "sakset", "paperi"],
    is: ["steinn", "skæri", "blað"],
    en: ["rock", "scissors", "paper"],
    de: ["Stein", "Schere", "Papier"],
    nl: ["steen", "schaar", "papier"],
    fr: ["pierre", "ciseaux", "feuille"],
    es: ["piedra", "tijeras", "papel"],
};

export const TOOL_WORD = {
    no: "HISTORIKK", sv: "HISTORIK", da: "HISTORIK", fi: "HISTORIA", is: "SAGA",
    en: "HISTORY", de: "VERLAUF", nl: "GESCHIEDENIS", fr: "HISTORIQUE", es: "HISTORIAL",
};

// System prompt per play language. {name} {city} {opp} {oppcity}
const SYSTEM = {
    no: "Du er {name} fra {city} og spiller stein, saks, papir mot {opp} fra {oppcity}. Svar kort, på norsk.",
    sv: "Du är {name} från {city} och spelar sten, sax, påse mot {opp} från {oppcity}. Svara kort, på svenska.",
    da: "Du er {name} fra {city} og spiller sten, saks, papir mod {opp} fra {oppcity}. Svar kort, på dansk.",
    fi: "Olet {name} kaupungista {city} ja pelaat kivi, sakset, paperi -peliä vastustajaa {opp} ({oppcity}) vastaan. Vastaa lyhyesti suomeksi.",
    is: "Þú ert {name} frá {city} og spilar steinn, skæri, blað við {opp} frá {oppcity}. Svaraðu stutt, á íslensku.",
    en: "You are {name} from {city}, playing rock, paper, scissors against {opp} from {oppcity}. Answer briefly, in English.",
    de: "Du bist {name} aus {city} und spielst Schere, Stein, Papier gegen {opp} aus {oppcity}. Antworte kurz, auf Deutsch.",
    nl: "Je bent {name} uit {city} en speelt steen, papier, schaar tegen {opp} uit {oppcity}. Antwoord kort, in het Nederlands.",
    fr: "Tu es {name} de {city} et tu joues à pierre, feuille, ciseaux contre {opp} de {oppcity}. Réponds brièvement, en français.",
    es: "Eres {name} de {city} y juegas a piedra, papel o tijeras contra {opp} de {oppcity}. Responde brevemente, en español.",
};

// Turn prompt. {n} {of} {tool} {a} {b} {c} {score}
const TURN = {
    no: "Kast {n} av {of}. Stilling {score}. Vil du se motstanderens tidligere kast først, svar bare {tool}. Ellers: svar med ett ord, {a}, {b} eller {c}, og så én setning om hvorfor.",
    sv: "Kast {n} av {of}. Ställning {score}. Vill du se motståndarens tidigare kast först, svara bara {tool}. Annars: svara med ett ord, {a}, {b} eller {c}, och sedan en mening om varför.",
    da: "Kast {n} af {of}. Stilling {score}. Vil du se modstanderens tidligere kast først, svar kun {tool}. Ellers: svar med ét ord, {a}, {b} eller {c}, og så én sætning om hvorfor.",
    fi: "Heitto {n}/{of}. Tilanne {score}. Jos haluat ensin nähdä vastustajan aiemmat heitot, vastaa vain {tool}. Muuten: vastaa yhdellä sanalla, {a}, {b} tai {c}, ja sitten yhdellä lauseella miksi.",
    is: "Kast {n} af {of}. Staðan {score}. Ef þú vilt fyrst sjá fyrri köst andstæðingsins, svaraðu bara {tool}. Annars: svaraðu með einu orði, {a}, {b} eða {c}, og svo einni setningu um hvers vegna.",
    en: "Throw {n} of {of}. Score {score}. If you want to see the opponent's previous throws first, reply only {tool}. Otherwise: reply with one word, {a}, {b} or {c}, then one sentence on why.",
    de: "Wurf {n} von {of}. Stand {score}. Willst du zuerst die bisherigen Würfe des Gegners sehen, antworte nur {tool}. Sonst: antworte mit einem Wort, {a}, {b} oder {c}, und dann einem Satz warum.",
    nl: "Worp {n} van {of}. Stand {score}. Wil je eerst de vorige worpen van de tegenstander zien, antwoord dan alleen {tool}. Anders: antwoord met één woord, {a}, {b} of {c}, en dan één zin waarom.",
    fr: "Coup {n} sur {of}. Score {score}. Si tu veux d'abord voir les coups précédents de l'adversaire, réponds seulement {tool}. Sinon : réponds par un mot, {a}, {b} ou {c}, puis une phrase sur le pourquoi.",
    es: "Tirada {n} de {of}. Marcador {score}. Si quieres ver primero las tiradas anteriores del rival, responde solo {tool}. Si no: responde con una palabra, {a}, {b} o {c}, y luego una frase de por qué.",
};

const HISTORY = {
    no: "Motstanderens siste kast: {opp}. Dine siste kast: {own}. Svar nå med ett ord, {a}, {b} eller {c}, og én setning om hvorfor.",
    sv: "Motståndarens senaste kast: {opp}. Dina senaste kast: {own}. Svara nu med ett ord, {a}, {b} eller {c}, och en mening om varför.",
    da: "Modstanderens seneste kast: {opp}. Dine seneste kast: {own}. Svar nu med ét ord, {a}, {b} eller {c}, og én sætning om hvorfor.",
    fi: "Vastustajan viimeisimmät heitot: {opp}. Omat viimeisimmät heittosi: {own}. Vastaa nyt yhdellä sanalla, {a}, {b} tai {c}, ja yhdellä lauseella miksi.",
    is: "Síðustu köst andstæðingsins: {opp}. Þín síðustu köst: {own}. Svaraðu nú með einu orði, {a}, {b} eða {c}, og einni setningu um hvers vegna.",
    en: "Opponent's latest throws: {opp}. Your latest throws: {own}. Now reply with one word, {a}, {b} or {c}, and one sentence on why.",
    de: "Letzte Würfe des Gegners: {opp}. Deine letzten Würfe: {own}. Antworte jetzt mit einem Wort, {a}, {b} oder {c}, und einem Satz warum.",
    nl: "Laatste worpen van de tegenstander: {opp}. Jouw laatste worpen: {own}. Antwoord nu met één woord, {a}, {b} of {c}, en één zin waarom.",
    fr: "Derniers coups de l'adversaire : {opp}. Tes derniers coups : {own}. Réponds maintenant par un mot, {a}, {b} ou {c}, et une phrase sur le pourquoi.",
    es: "Últimas tiradas del rival: {opp}. Tus últimas tiradas: {own}. Responde ahora con una palabra, {a}, {b} o {c}, y una frase de por qué.",
};

const NONE = { no: "ingen", sv: "inga", da: "ingen", fi: "ei mitään", is: "engin", en: "none", de: "keine", nl: "geen", fr: "aucun", es: "ninguna" };

function fill(template, vars) {
    return template.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
}

export function systemPrompt(lang, agent, opp) {
    return fill(SYSTEM[lang], { name: agent.name, city: agent.city, opp: opp.name, oppcity: opp.city });
}

export function turnPrompt(lang, n, of, score) {
    const [a, b, c] = MOVE_LABEL[lang];
    return fill(TURN[lang], { n, of, score, tool: TOOL_WORD[lang], a, b, c });
}

export function historyPrompt(lang, oppMoves, ownMoves) {
    const [a, b, c] = MOVE_LABEL[lang];
    const words = (moves) => moves.length ? moves.map((m) => localWord(lang, m)).join(", ") : NONE[lang];
    return fill(HISTORY[lang], { opp: words(oppMoves), own: words(ownMoves), a, b, c });
}

export function localWord(lang, move) {
    const idx = { rock: 0, scissors: 1, paper: 2 }[move];
    return MOVE_LABEL[lang][idx];
}

export function isToolRequest(lang, text) {
    return text.trim().toUpperCase().startsWith(TOOL_WORD[lang]);
}

// Parse a reply into a canonical move. Tries the play language first,
// then every language, so an agent that slips into English still counts.
export function parseMove(lang, text) {
    const lower = text.toLowerCase();
    const tryDict = (dict) => {
        let best = null;
        for (const [word, move] of Object.entries(dict)) {
            const i = lower.search(new RegExp("\\b" + word + "\\b"));
            if (i >= 0 && (best === null || i < best.i)) best = { i, move };
        }
        return best ? best.move : null;
    };
    const own = tryDict(MOVE_WORDS[lang]);
    if (own) return own;
    for (const dict of Object.values(MOVE_WORDS)) {
        const m = tryDict(dict);
        if (m) return m;
    }
    return null;
}

// Which language does each of the two agents play in?
// Scandinavians speak their own language to each other; everyone else
// meets in English unless they share a language.
const MUTUAL = new Set(["no|sv", "no|da", "sv|da"]);

export function playLanguages(a, b) {
    if (a.lang === b.lang) return [a.lang, b.lang];
    const key = [a.lang, b.lang].sort().join("|");
    if (MUTUAL.has(key)) return [a.lang, b.lang];
    return ["en", "en"];
}
