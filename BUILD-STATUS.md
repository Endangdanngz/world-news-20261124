# Build status — news-image-20261124

## The entry

- Front page: **"The World Today"**, dated Tuesday, 24 November 2026.
- Headline: **HUANG RESTORED AT NVIDIA — MARKETS STAGE A RECORD DAY**
- Suggested submission title: **The World Today: Huang Returns to Nvidia**

## Headline and sources (news of 23–24 November 2026)

- **Lead — Nvidia reinstates Jensen Huang as CEO** (announced Monday
  23 November; shares +31–33%, Nasdaq +6%, S&P 500 +4.7%; Reuters called
  23 November "one of the most extraordinary days in US market history").
  Sources: Reuters, "Nvidia reinstates Jensen Huang as CEO" (23 Nov 2026);
  Reuters Trading Day, "Market euphoria as Huang returns to Nvidia".
- **Benghazi** — UN seeks a probe after Ukraine said its naval drones sank
  the Russian corvette *Merkury* at Benghazi, Libya (strike 23 November;
  Tripoli demanded explanations from Kyiv). Sources: Middle East Eye,
  "Benghazi drone attack" (23–24 Nov 2026); iqmia Worldwide News Summary,
  24 Nov 2026.
- **Rohingya ruling** — fourteen countries (UK, Spain, Canada, Australia
  and ten others) affirmed the ICJ decision establishing Myanmar's genocide
  of the Rohingya; the UK added sanctions. Sources: Horizon world news,
  24 Nov 2026; News Media House, 24 Nov 2026.
- **Also today** — Hanoi: explosion at a food shop in Dong Da kills 6,
  injures 10 (Reuters, 24 Nov 2026). Zaporizhzhia: Russian attack kills 2,
  wounds 22 overnight (Reuters, 24 Nov 2026). Hormuz: IRGC reports three
  tankers hit mines amid a US escort (News Media House, 24 Nov 2026).

## Image

- `entry.png`: JPEG, 1024×1024, **372,255 bytes** (limit 1 MiB — pass).
- SHA-256: `57d9255a79afc5f3ce72998f82f5393d9f882e45d635aeffe8fb7d4de560cb37`
- Composed by a PIL script kept outside the repo
  (`news-image-20261124-candidates/compose.py`): masthead, dateline,
  headline, deck, caption and story blurbs set in Noto Serif; three
  illustrations generated in an engraved broadsheet style (the returning
  chief with the AI chip and the soaring chart; the smoking corvette and
  drone boats at Benghazi; the gavel and scales at the World Court).
- The composed page was read back and inspected before shipping: two
  layout faults found in the first pass (deck wrapping into the hero
  image, blurbs overflowing the footer) were fixed by shortening the
  texts and rebalancing the layout; the final page is clean and legible.

## Program

- `main.ts` is an original design written for this entry: a JPEG
  **segment-ledger** auditor with a pinned digest manifest. It parses
  every segment (marker, offset, span), requires DQT/DHT/SOF segments,
  checks the frame size against the manifest, walks the entropy-coded
  scan data honouring stuffed bytes, and requires EOI as the final two
  bytes; the file's SHA-256 and byte count must match the manifest
  before anything is written to the output directory.
- Determinism: run twice with different `MAKEFUN_OUTPUT_DIR` values —
  both outputs byte-identical to the bundled `entry.png` (sha256 above).

## Revision note (thinking_revised)

After the first passing tests, `main.ts` was genuinely improved in a
separate edit: the entropy-data walk now also verifies the **restart
marker cycle** — FFD0–FFD7 must appear in strict D0→D7 repeating order,
as a conforming encoder emits them — and fails the audit on an
out-of-turn restart marker. The program was re-run after the edit; the
output is unchanged and still byte-identical to `entry.png`.
