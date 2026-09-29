# Stein, saks, papir på åtte språk

Språkmodell-agenter fordelt på åtte språk spiller stein, saks, papir mot
hverandre i fem divisjoner. Hvert kast er ett ekte kall til språkmodellen,
på det språket kampen spilles på. Antall agenter velges på startskjermen:
20, 50, 100, 200 eller 500.

Skandinaver spiller på egne språk mot hverandre. Alle andre par møtes på
engelsk, med mindre de deler språk. Agenten kan be om motstanderens
historikk før den kaster, og det koster ett kall til.

## Regler

- Alle starter i 2. divisjon, den midterste av fem.
- Hver runde pares alle i samme divisjon tilfeldig, best av tre kast. Er
  det oddetall, står én over.
- Vinneren rykker opp én divisjon, taperen ned én. Uavgjort blir stående.
  Eliteserien kan ikke rykke opp, 4. divisjon kan ikke rykke ned.
- Seier gir tre poeng, uavgjort ett. ELO oppdateres etter hver kamp, K 32.
- Etter runden markeres de som flyttes, grønn opp og rød ned, før de glir
  til ny divisjon.

## Skjermen

- Pyramide med fem divisjonsbånd som vokser og krymper med antall agenter.
  Trykk på en divisjonsetikett for tabellen.
- Fargeforklaring under pyramiden. Trykk på et språk for å filtrere.
- Linjene i pyramiden er rundens kamper. Trykk på en linje, eller på en
  kamp i en kampliste, for hele dialogen: begge svar kast for kast,
  historikkbruk og promptene modellen fikk. Kampene ligger også i
  opptaket.
- Det samiske flagget finnes ikke som emoji og tegnes som SVG.
- Trykk på en agent for kamphistorikk, ELO-kurve, divisjonsløp og nettverk
  av motstandere. Alle navn i logg, lister og tabeller er klikkbare.
- Faner til høyre: Oversikt, Språk, Møter, Runder, og Agent eller Divisjon
  når noe er valgt. «Om» forklarer reglene og tallene.

## Kjøre lokalt

```bash
python3 -m http.server 8080
```

Åpne `http://localhost:8080`. Ingen bygg, ingen avhengigheter, rene
ES-moduler. Samme filer kan legges rett på GitHub Pages. Script-taggen har
en versjonsparameter for cache-busting, bump den ved deploy.

## Nøkkel og modell

Startskjermen ber om nøkkel til Kantegas LLM-proxy. Nøkkelen ligger i
localStorage i din nettleser til du trykker «Glem nøkkel». Modell velges i en
nedtrekksmeny med modellnavnene slik proxyen kjenner dem, og listepris per
million tokens. Standard er `vertex_ai/claude-haiku-4-5`. «Annen…» gir et
fritekstfelt for andre modell-ID-er i proxyen. Svarer proxyen 4xx på
modellnavnet, prøves Haiku og `gemini-3.1-flash-lite` i rekkefølge.

Prisene ligger i `src/models.js`. De merket «ca.» er anslag som ikke er
sjekket mot proxyens egen prisliste.

Uten nøkkel spilles `data/opptak.json` av hvis den finnes. Finnes den ikke,
kjører en simulert modus med tilfeldige trekk, tydelig merket i toppen.

## Kost

Startskjermen viser et estimat som oppdateres når du bytter modell eller
antall agenter: kall per runde, kroner per runde og for 20 runder, med
dollar i parentes. Anslaget bruker 220 tokens inn og 40 ut per kall, 60 %
ekstra for verktøykall, listepris og kurs 10,50 kr per dollar. Under
kjøring viser telleren øverst antall kall og løpende estimert kost for
valgt modell.

Med 100 agenter og Haiku er det rundt 400 kall og under to kroner per runde.
Med GPT-5.6 Luna rundt 20 øre.

## Opptak og avspilling

Ctrl+Shift+S (Cmd+Shift+S på Mac) laster ned `opptak.json`; knappen er skjult fordi appen brukes live i en presentasjon. Fila inneholder med antall agenter, alle runder, kamper,
kast, opp- og nedrykk og divisjon per agent per runde. Legg filen i
`data/` og commit, så spiller GitHub Pages den av for alle som åpner
siden, uten nøkkel. Avspillingen bruker antallet fra opptaket.

## Filer

```text
index.html         startskjerm, app, Om-panel
style.css          stil
src/main.js        modusvalg, rundeløkke, opptak, knapper
src/league.js      divisjoner, paring, kamp, ELO, opp- og nedrykk
src/languages.js   språk, ord for trekkene, prompter, hvem som snakker sammen
src/agents.js      agenter med navn og hjemby, antall valgt ved start
src/llm.js         kall mot proxyen, nøkkel og modell i localStorage
src/ui.js          pyramide, linjer, faner, statistikk, logg
data/              opptak.json legges her
```

## Språk

Åtte språk: norsk, svensk, dansk, finsk, islandsk, engelsk, tysk og
nordsamisk. Nordsamisk møter norsk, svensk og finsk på motpartens språk,
alt annet går på engelsk. De nordsamiske instruksene og ordene (geađgi,
skierit, báhpir) er maskinoversatt og bør sjekkes av en som kan språket.
