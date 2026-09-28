// 100 agents, ten per language, with a name and a home town.

const NAMES = {
    no: [["Kari", "Bergen"], ["Ola", "Voss"], ["Ingrid", "Stavanger"], ["Lars", "Tromsø"], ["Marit", "Trondheim"], ["Sigurd", "Ålesund"], ["Astrid", "Odda"], ["Eirik", "Bodø"], ["Solveig", "Drammen"], ["Torstein", "Os"]],
    sv: [["Anna", "Göteborg"], ["Erik", "Umeå"], ["Sara", "Malmö"], ["Johan", "Uppsala"], ["Elin", "Luleå"], ["Nils", "Örebro"], ["Maja", "Visby"], ["Gustav", "Kiruna"], ["Linnea", "Lund"], ["Oskar", "Västerås"]],
    da: [["Mette", "Aarhus"], ["Søren", "Odense"], ["Freja", "Aalborg"], ["Mads", "Esbjerg"], ["Signe", "Roskilde"], ["Rasmus", "Randers"], ["Ida", "Kolding"], ["Jesper", "Vejle"], ["Emma", "Herning"], ["Niels", "Svendborg"]],
    fi: [["Aino", "Helsinki"], ["Mikko", "Tampere"], ["Emilia", "Turku"], ["Juhani", "Oulu"], ["Sofia", "Jyväskylä"], ["Antti", "Kuopio"], ["Venla", "Lahti"], ["Ville", "Rovaniemi"], ["Helmi", "Vaasa"], ["Petteri", "Joensuu"]],
    is: [["Guðrún", "Reykjavík"], ["Jón", "Akureyri"], ["Sigríður", "Ísafjörður"], ["Einar", "Egilsstaðir"], ["Katrín", "Selfoss"], ["Bjarni", "Húsavík"], ["Ragnheiður", "Vestmannaeyjar"], ["Magnús", "Hafnarfjörður"], ["Þóra", "Sauðárkrókur"], ["Kristján", "Keflavík"]],
    en: [["Alice", "Leeds"], ["James", "Glasgow"], ["Olivia", "Bristol"], ["Harry", "Cardiff"], ["Amelia", "Belfast"], ["George", "Norwich"], ["Grace", "Aberdeen"], ["Oliver", "Plymouth"], ["Chloe", "Dundee"], ["Jack", "Hull"]],
    de: [["Lena", "Hamburg"], ["Jonas", "Leipzig"], ["Hanna", "Freiburg"], ["Lukas", "Bremen"], ["Marie", "Dresden"], ["Felix", "Rostock"], ["Laura", "Kiel"], ["Paul", "Nürnberg"], ["Sophie", "Aachen"], ["Max", "Passau"]],
    nl: [["Sanne", "Utrecht"], ["Daan", "Groningen"], ["Fleur", "Eindhoven"], ["Bram", "Leiden"], ["Lotte", "Nijmegen"], ["Sem", "Maastricht"], ["Noor", "Haarlem"], ["Thijs", "Zwolle"], ["Eva", "Delft"], ["Ruben", "Enschede"]],
    fr: [["Camille", "Lyon"], ["Louis", "Nantes"], ["Chloé", "Lille"], ["Hugo", "Bordeaux"], ["Manon", "Rennes"], ["Arthur", "Toulouse"], ["Léa", "Strasbourg"], ["Gabriel", "Brest"], ["Inès", "Grenoble"], ["Jules", "Dijon"]],
    es: [["Lucía", "Sevilla"], ["Mateo", "Bilbao"], ["Martina", "Valencia"], ["Pablo", "Zaragoza"], ["Paula", "Málaga"], ["Diego", "Oviedo"], ["Carla", "Murcia"], ["Álvaro", "Salamanca"], ["Sofía", "Granada"], ["Hugo", "Santander"]],
};

export function createAgents() {
    const agents = [];
    let id = 0;
    for (const [lang, list] of Object.entries(NAMES)) {
        for (const [name, city] of list) {
            agents.push({ id: id++, lang, name, city, elo: 1000, points: 0, division: 0, moves: [], toolUses: 0, throws: 0 });
        }
    }
    return agents;
}
