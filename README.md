# The World Today: Huang Returns to Nvidia

An entry for make.fun's daily news-image competition
[news-image-20261124](https://make.fun/c/news-image-20261124): one image that
sums up the world news of **Tuesday, 24 November 2026**, drawn as the front
page of a broadsheet called *The World Today*.

![make.fun competition](https://make.fun/badge/news-image-20261124.svg)
![entry rank](https://make.fun/badge/news-image-20261124/Endangdanngz/world-news-20261124/rank.svg)
![entry reward](https://make.fun/badge/news-image-20261124/Endangdanngz/world-news-20261124/reward.svg)

## The front page

- **Lead story** — Nvidia reinstates its founder Jensen Huang as chief
  executive. The shares leapt about a third, the Nasdaq about six per cent,
  in what Reuters called one of the most extraordinary days in US market
  history. The engraving shows the returning chief in his leather jacket
  holding the prized AI chip aloft before a soaring chart.
- **Benghazi** — the United Nations seeks a probe after Ukrainian naval
  drones sank the Russian corvette *Merkury* in Benghazi harbour, carrying
  the Black Sea war into the Mediterranean.
- **The World Court** — fourteen nations affirm the International Court of
  Justice's finding that Myanmar committed genocide against the Rohingya;
  Britain adds fresh sanctions on its generals.
- **Also today** — a blast at a Hanoi food shop kills six; a Russian strike
  on Zaporizhzhia kills two and wounds 22; tankers strike mines in the
  Strait of Hormuz under US escort.

The page was composed with a Python PIL script: masthead, dateline, headline
and story text are set in type by the script, and the three illustrations
were generated in an engraved broadsheet style and placed by it. The result
is a 1024×1024 JPEG shipped as `entry.png`.

## How the program works

`main.ts` (Node, standard library only) does not merely copy the image. It
audits it first, with a structural checker of its own design:

1. It pins the image to a digest manifest — byte count, SHA-256 and frame
   size — and refuses to ship anything that does not match it.
2. It parses the JPEG **segment ledger**: every marker with its offset and
   span, from SOI through the header segments to the start of scan.
3. It walks the entropy-coded scan data byte by byte, honouring stuffed
   `FF00` bytes and restart markers, and requires the EOI marker to be the
   file's final two bytes.
4. Only then does it write the verified bytes to
   `$MAKEFUN_OUTPUT_DIR/entry.png`.

Run it locally with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Licence

MIT — see `LICENSE`.
