# Stein, saks, papir på ti språk

100 språkmodell-agenter, ti per språk, spiller stein, saks, papir i fire
divisjoner med opp- og nedrykk etter hver runde. Hvert kast er ett ekte
kall til språkmodellen, på det språket kampen spilles på.

Skandinaver spiller på egne språk mot hverandre. Alle andre par møtes på
engelsk, med mindre de deler språk. Agenten kan be om motstanderens
historikk før den kaster, og det koster ett kall til.

Skjermen viser:

- pyramiden med fire divisjoner, agentene flytter seg ved opp- og nedrykk
- linjer mellom agenter som spiller nå, farget etter spillspråk
- fordeling av stein, saks og papir per språk
- samme fordeling for morsmål mot fremmedspråk
- hvor ofte hvert språk ber om historikk
- ELO-snitt per språk
- rullende logg med agentenes begrunnelser

## Kjøre lokalt

```bash
python3 -m http.server 8080
```

Åpne `http://localhost:8080`. Ingen bygg, ingen avhengigheter, rene
ES-moduler. Samme filer kan legges rett på GitHub Pages.

## Nøkkel og modell

Startskjermen ber om nøkkel til Kantegas LLM-proxy. Nøkkelen ligger i
localStorage i din nettleser til du trykker «Glem nøkkel». Standardmodell er
`openai/gpt-6-luna`. Svarer proxyen 4xx på modellnavnet, prøves
`gpt-6-luna`, `azure/gpt-6-luna` og `gemini-3.1-flash-lite` i rekkefølge.

Uten nøkkel spilles `data/opptak.json` av hvis den finnes. Finnes den ikke,
kjører en simulert modus med tilfeldige trekk, tydelig merket i toppen.

## Kost

En runde er 50 kamper, best av tre, to kall per kast, pluss ett ekstra kall
hver gang en agent ber om historikk. Det gir rundt 300 til 400 kall per
runde med rundt 150 tokens inn og 30 ut.

| Modell | Per runde | 50 runder |
| --- | --- | --- |
| gpt-6-luna, 0,10 / 0,50 dollar per M tokens | ca. 0,01 dollar | ca. 0,60 dollar |

## Opptak og avspilling

«Last ned opptak» gir `opptak.json` med alle runder, kamper og kast, med
språk, trekk, verktøybruk og begrunnelse. Legg filen i `data/` og commit,
så spiller GitHub Pages den av for alle som åpner siden, uten nøkkel.

## Filer

```text
index.html         startskjerm og app
style.css          stil
src/main.js        modusvalg, rundeløkke, opptak, knapper
src/league.js      divisjoner, paring, kamp, ELO, opp- og nedrykk
src/languages.js   språk, ord for trekkene, prompter, hvem som snakker sammen
src/agents.js      100 agenter med navn og hjemby
src/llm.js         kall mot proxyen, nøkkel og modell i localStorage
src/ui.js          pyramide, linjer, statistikk, logg
data/              opptak.json legges her
```
