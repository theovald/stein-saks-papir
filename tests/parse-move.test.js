import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMove, isToolRequest } from "../src/languages.js";

const cases = [
    ["no", "Saks. Stein er for forutsigbart.", "scissors"],
    ["no", "Jeg velger stein fordi saks taper mot stein.", "rock"],
    ["no", "Papir! Motstanderen kastet stein sist.", "paper"],
    ["no", "STEIN", "rock"],
    ["sv", "Sax, eftersom motståndaren nog väljer påse.", "scissors"],
    ["sv", "Påse. Sten är vanligast som öppning.", "paper"],
    ["sv", "Sten.", "rock"],
    ["da", "Saks – papir er for risikabelt.", "scissors"],
    ["da", "Papir, fordi sten er det mest almindelige.", "paper"],
    ["fi", "Sakset. Kivi on liian ilmeinen.", "scissors"],
    ["fi", "Paperi, koska vastustaja heitti kiven.", "paper"],
    ["fi", "Kivi!", "rock"],
    ["is", "Skæri. Steinn er of augljós.", "scissors"],
    ["is", "Blað, því andstæðingurinn kastaði steini.", "paper"],
    ["is", "Steinn.", "rock"],
    ["en", "Scissors! Rock is the classic opener.", "scissors"],
    ["en", "Paper. They threw rock twice.", "paper"],
    ["en", "rock, because scissors lose to it", "rock"],
    ["de", "Schere, weil Stein am häufigsten kommt.", "scissors"],
    ["de", "Papier. Der Gegner wählt gern Stein.", "paper"],
    ["de", "Stein!", "rock"],
    ["se", "Skierit. Geađgi lea menddo čielggas.", "scissors"],
    ["se", "Báhpir, go vuostálasti bálkestii geađggi.", "paper"],
    ["se", "Geađgi!", "rock"],
    ["et", "Käärid. Kivi on liiga ilmne.", "scissors"],
    ["et", "Paber, sest vastane viskas kivi.", "paper"],
    ["et", "kivi.", "rock"],
    // English answer on a Norwegian match still counts.
    ["no", "Scissors. Rock is predictable.", "scissors"],
    // Punctuation glued to the word.
    ["is", "Skæri!", "scissors"],
    ["sv", "påse.", "paper"],
    // No move at all.
    ["no", "Jeg vet ikke.", null],
    // A word inside another word does not count.
    ["en", "Rocky start, so scissors.", "scissors"],
];

for (const [lang, text, want] of cases) {
    test(`${lang}: ${text}`, () => assert.equal(parseMove(lang, text), want));
}

test("tool word is recognised", () => {
    assert.equal(isToolRequest("no", "HISTORIKK"), true);
    assert.equal(isToolRequest("is", "saga, takk"), true);
    assert.equal(isToolRequest("no", "Saks"), false);
});
