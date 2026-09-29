// Agents spread over nine languages, each with a name and a home town.

const NAMES = {
    no: [["Kari", "Bergen"], ["Ola", "Voss"], ["Ingrid", "Stavanger"], ["Lars", "Tromsø"], ["Marit", "Trondheim"], ["Sigurd", "Ålesund"], ["Astrid", "Odda"], ["Eirik", "Bodø"], ["Solveig", "Drammen"], ["Torstein", "Os"]],
    sv: [["Anna", "Göteborg"], ["Erik", "Umeå"], ["Sara", "Malmö"], ["Johan", "Uppsala"], ["Elin", "Luleå"], ["Nils", "Örebro"], ["Maja", "Visby"], ["Gustav", "Kiruna"], ["Linnea", "Lund"], ["Oskar", "Västerås"]],
    da: [["Mette", "Aarhus"], ["Søren", "Odense"], ["Freja", "Aalborg"], ["Mads", "Esbjerg"], ["Signe", "Roskilde"], ["Rasmus", "Randers"], ["Ida", "Kolding"], ["Jesper", "Vejle"], ["Emma", "Herning"], ["Niels", "Svendborg"]],
    fi: [["Aino", "Helsinki"], ["Mikko", "Tampere"], ["Emilia", "Turku"], ["Juhani", "Oulu"], ["Sofia", "Jyväskylä"], ["Antti", "Kuopio"], ["Venla", "Lahti"], ["Ville", "Rovaniemi"], ["Helmi", "Vaasa"], ["Petteri", "Joensuu"]],
    is: [["Guðrún", "Reykjavík"], ["Jón", "Akureyri"], ["Sigríður", "Ísafjörður"], ["Einar", "Egilsstaðir"], ["Katrín", "Selfoss"], ["Bjarni", "Húsavík"], ["Ragnheiður", "Vestmannaeyjar"], ["Magnús", "Hafnarfjörður"], ["Þóra", "Sauðárkrókur"], ["Kristján", "Keflavík"]],
    en: [["Alice", "Leeds"], ["James", "Glasgow"], ["Olivia", "Bristol"], ["Harry", "Cardiff"], ["Amelia", "Belfast"], ["George", "Norwich"], ["Grace", "Aberdeen"], ["Oliver", "Plymouth"], ["Chloe", "Dundee"], ["Jack", "Hull"]],
    de: [["Lena", "Hamburg"], ["Jonas", "Leipzig"], ["Hanna", "Freiburg"], ["Lukas", "Bremen"], ["Marie", "Dresden"], ["Felix", "Rostock"], ["Laura", "Kiel"], ["Paul", "Nürnberg"], ["Sophie", "Aachen"], ["Max", "Passau"]],
    se: [["Máret", "Kárášjohka"], ["Ánde", "Guovdageaidnu"], ["Elle", "Deatnu"], ["Nils Ánte", "Romsa"], ["Risten", "Gáivuotna"], ["Mihkkal", "Unjárga"], ["Sárá", "Porsáŋgu"], ["Áilu", "Giron"], ["Inga", "Ohcejohka"], ["Jovnna", "Anár"]],
    et: [["Kertu", "Tallinn"], ["Mart", "Tartu"], ["Liis", "Pärnu"], ["Jaan", "Narva"], ["Triin", "Viljandi"], ["Toomas", "Rakvere"], ["Kadri", "Kuressaare"], ["Priit", "Haapsalu"], ["Maarja", "Võru"], ["Andres", "Paide"]],
};

export const LANG_CODES = Object.keys(NAMES);

// n agents spread evenly over the ten languages. Names cycle through the
// lists and get a number once a name repeats.
export function createAgents(n) {
    const agents = [];
    const base = Math.floor(n / LANG_CODES.length);
    let rest = n - base * LANG_CODES.length;
    let id = 0;
    for (const lang of LANG_CODES) {
        const list = NAMES[lang];
        const per = base + (rest > 0 ? 1 : 0);
        if (rest > 0) rest--;
        for (let k = 0; k < per; k++) {
            const [name, city] = list[k % list.length];
            const suffix = k >= list.length ? ` ${Math.floor(k / list.length) + 1}` : "";
            agents.push({ id: id++, lang, name: name + suffix, city, elo: 1000, points: 0, roundPoints: 0, division: 0, moves: [], toolUses: 0, throws: 0 });
        }
    }
    return agents;
}
