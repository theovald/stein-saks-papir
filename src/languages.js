// Eight languages, their words for the three moves, and prompt templates.
// The prompt is written in the language the match is played in.

export const LANGUAGES = {
    no: { name: "Norsk", flag: "🇳🇴", color: "#EE3A64" },
    sv: { name: "Svensk", flag: "🇸🇪", color: "#F2C94C" },
    da: { name: "Dansk", flag: "🇩🇰", color: "#C1272D" },
    fi: { name: "Finsk", flag: "🇫🇮", color: "#06B3C6" },
    is: { name: "Islandsk", flag: "🇮🇸", color: "#5B7DB1" },
    en: { name: "Engelsk", flag: "🇬🇧", color: "#9C9C9C" },
    de: { name: "Tysk", flag: "🇩🇪", color: "#F49727" },
    se: { name: "Nordsamisk", flag: "", color: "#2FB36B", short: "Sámi" },
};

// Word -> canonical move. Lowercased, accents kept.
export const MOVE_WORDS = {
    no: { stein: "rock", steinen: "rock", saks: "scissors", saksen: "scissors", papir: "paper", papiret: "paper" },
    sv: { sten: "rock", stenen: "rock", sax: "scissors", saxen: "scissors", påse: "paper", påsen: "paper", papper: "paper" },
    da: { sten: "rock", stenen: "rock", saks: "scissors", saksen: "scissors", papir: "paper", papiret: "paper" },
    fi: { kivi: "rock", kiven: "rock", sakset: "scissors", saksia: "scissors", paperi: "paper", paperin: "paper" },
    is: { steinn: "rock", stein: "rock", skæri: "scissors", skærin: "scissors", blað: "paper", blaðið: "paper", pappír: "paper" },
    en: { rock: "rock", scissors: "scissors", paper: "paper" },
    de: { stein: "rock", schere: "scissors", papier: "paper" },
    se: { geađgi: "rock", geađggi: "rock", skierit: "scissors", skieriid: "scissors", báhpir: "paper", báhpira: "paper" },
};

export const MOVE_LABEL = {
    no: ["stein", "saks", "papir"],
    sv: ["sten", "sax", "påse"],
    da: ["sten", "saks", "papir"],
    fi: ["kivi", "sakset", "paperi"],
    is: ["steinn", "skæri", "blað"],
    en: ["rock", "scissors", "paper"],
    de: ["Stein", "Schere", "Papier"],
    se: ["geađgi", "skierit", "báhpir"],
};

export const TOOL_WORD = {
    no: "HISTORIKK", sv: "HISTORIK", da: "HISTORIK", fi: "HISTORIA", is: "SAGA",
    en: "HISTORY", de: "VERLAUF", se: "HISTORJÁ",
};

// System prompt per play language. {name} {city} {opp} {oppcity}
// Endonyms, used when telling an agent which language a match is played in.
const ENDONYM = { no: "norsk", sv: "svenska", da: "dansk", fi: "suomi", is: "íslenska", en: "English", de: "Deutsch", se: "davvisámegiella" };

// System prompt in the agent's OWN language: identity and reasoning stay
// native, while the match itself is played in {play}. {name} {city} {opp} {oppcity} {play}
const SYSTEM = {
    no: "Du er {name} fra {city}. Du tenker og resonnerer på norsk, ditt eget språk. Du spiller stein, saks, papir mot {opp} fra {oppcity}. Kampen føres på {play}: les motstanderens språk, og svar med trekket ditt og én kort begrunnelse på {play}.",
    sv: "Du är {name} från {city}. Du tänker och resonerar på svenska, ditt eget språk. Du spelar sten, sax, påse mot {opp} från {oppcity}. Matchen förs på {play}: läs motståndarens språk, och svara med ditt drag och en kort motivering på {play}.",
    da: "Du er {name} fra {city}. Du tænker og ræsonnerer på dansk, dit eget sprog. Du spiller sten, saks, papir mod {opp} fra {oppcity}. Kampen føres på {play}: læs modstanderens sprog, og svar med dit træk og én kort begrundelse på {play}.",
    fi: "Olet {name} kaupungista {city}. Ajattelet ja päättelet suomeksi, omalla kielelläsi. Pelaat kivi, sakset, paperi -peliä vastustajaa {opp} ({oppcity}) vastaan. Peli käydään kielellä {play}: lue vastustajan kieltä ja vastaa siirrollasi ja yhdellä lyhyellä perustelulla kielellä {play}.",
    is: "Þú ert {name} frá {city}. Þú hugsar og rökstyður á íslensku, þínu eigin máli. Þú spilar steinn, skæri, blað við {opp} frá {oppcity}. Leikurinn fer fram á {play}: lestu mál andstæðingsins og svaraðu með kasti þínu og einni stuttri röksemd á {play}.",
    en: "You are {name} from {city}. You think and reason in English, your own language. You are playing rock, paper, scissors against {opp} from {oppcity}. The match is played in {play}: read the opponent's language, and reply with your move and one short reason in {play}.",
    de: "Du bist {name} aus {city}. Du denkst und argumentierst auf Deutsch, deiner eigenen Sprache. Du spielst Schere, Stein, Papier gegen {opp} aus {oppcity}. Das Spiel läuft auf {play}: lies die Sprache des Gegners und antworte mit deinem Zug und einer kurzen Begründung auf {play}.",
    se: "Don leat {name} {city}s. Don jurddašat ja ákkastalat davvisámegillii, iežat gillii. Don spealat geađgi, skierit, báhpir {opp} vuostá, gii lea {oppcity}s. Speallu čađahuvvo {play} gillii: loga vuostálasti giela, ja vástit du kastimiin ja ovtta oanehis ákkain {play} gillii.",
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
    se: "Bálkestus {n}/{of}. Dilli {score}. Jus háliidat vuos oaidnit vuostálasti ovddit bálkestusaid, vástit dušše {tool}. Muđui: vástit ovtta sániin, {a}, {b} dahje {c}, ja de ovtta cealkagiin manne.",
};

const HISTORY = {
    no: "Motstanderens siste kast: {opp}. Dine siste kast: {own}. Svar nå med ett ord, {a}, {b} eller {c}, og én setning om hvorfor.",
    sv: "Motståndarens senaste kast: {opp}. Dina senaste kast: {own}. Svara nu med ett ord, {a}, {b} eller {c}, och en mening om varför.",
    da: "Modstanderens seneste kast: {opp}. Dine seneste kast: {own}. Svar nu med ét ord, {a}, {b} eller {c}, og én sætning om hvorfor.",
    fi: "Vastustajan viimeisimmät heitot: {opp}. Omat viimeisimmät heittosi: {own}. Vastaa nyt yhdellä sanalla, {a}, {b} tai {c}, ja yhdellä lauseella miksi.",
    is: "Síðustu köst andstæðingsins: {opp}. Þín síðustu köst: {own}. Svaraðu nú með einu orði, {a}, {b} eða {c}, og einni setningu um hvers vegna.",
    en: "Opponent's latest throws: {opp}. Your latest throws: {own}. Now reply with one word, {a}, {b} or {c}, and one sentence on why.",
    de: "Letzte Würfe des Gegners: {opp}. Deine letzten Würfe: {own}. Antworte jetzt mit einem Wort, {a}, {b} oder {c}, und einem Satz warum.",
    se: "Vuostálasti maŋimuš bálkestusat: {opp}. Du maŋimuš bálkestusat: {own}. Vástit dál ovtta sániin, {a}, {b} dahje {c}, ja ovtta cealkagiin manne.",
};

const NONE = { no: "ingen", sv: "inga", da: "ingen", fi: "ei mitään", is: "engin", en: "none", de: "keine", se: "ii mihkkege" };

function fill(template, vars) {
    return template.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
}

export function systemPrompt(playLang, agent, opp) {
    return fill(SYSTEM[agent.lang], { name: agent.name, city: agent.city, opp: opp.name, oppcity: opp.city, play: ENDONYM[playLang] });
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
// A word boundary that understands æøå and other letters. \b in JS is
// ASCII-only, so «skæri» and «påse» would never match with it.
const WORD = (w) => new RegExp("(?<!\\p{L})" + w + "(?!\\p{L})", "u");

export function parseMove(lang, text) {
    const lower = text.toLowerCase();
    const tryDict = (dict) => {
        let best = null;
        for (const [word, move] of Object.entries(dict)) {
            const i = lower.search(WORD(word));
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
// Most Northern Sámi speakers are bilingual, so a Sámi agent meets a
// Norwegian, Swedish or Finnish agent in that agent's language.
const SAMI_SWITCH = new Set(["no", "sv", "fi"]);

export function playLanguages(a, b) {
    if (a.lang === b.lang) return [a.lang, b.lang];
    const key = [a.lang, b.lang].sort().join("|");
    if (MUTUAL.has(key)) return [a.lang, b.lang];
    if (a.lang === "se" && SAMI_SWITCH.has(b.lang)) return [b.lang, b.lang];
    if (b.lang === "se" && SAMI_SWITCH.has(a.lang)) return [a.lang, a.lang];
    return ["en", "en"];
}
