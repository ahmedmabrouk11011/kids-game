# Kids Learn

Little learning games for Omar (3.5) and Youssef (5), made for a tablet with a pencil.
Live at https://ahmedmabrouk11011.github.io/kids-game/. It is one static page (HTML, CSS and plain JavaScript modules) with no build step, and nothing costs money.

- **Voice:** every spoken line is recorded ahead of time as a small MP3 in `audio/`, with a free, natural voice that runs on the Mac ([Kokoro](https://github.com/hexgrad/kokoro), voice `af_heart`). It works the same on every tablet, including Huawei tablets, which have no built-in English voice. A line without a recording falls back to the device voice.
- **Pictures:**
  - Sharp vector icons ([Fluent Emoji](https://github.com/microsoft/fluentui-emoji), MIT).
  - Shadow and Sonic, cut out from the coloring-book art.
  - Omar's own coloring pages, as SVG.
  - No big emoji: emoji are small bitmaps on Android and look blurry when big.
- **Sounds:** made in code with Web Audio.
- **Progress:** stars are saved in the browser (`localStorage`) on that device only.
- **Mascot:** Shadow (Omar) or Sonic (Youssef) bounces while the voice talks. Tap him to hear the instruction again. He also dances on the reward screen.
- **Pencil:** while the pencil is in use, touches from the palm are ignored, so the kids can rest a hand on the screen.

## Omar: Numbers 1–10

| Game | What he does | Skill |
|---|---|---|
| Count | Tap each object (Shadow first!); every tap says the next number | counting one by one |
| How Many? | Pick the right number (3 big buttons). A wrong answer counts together with him | quantity → numeral |
| Trace ✏️ | A pencil shows how to write the number, then he traces it and presses ✔ | writing digits |
| Apples | See a number, put that many apples in the basket, press ✔ | numeral → quantity |
| Balloons | Pop the balloon with the number that is shown and said | recognising numerals |
| Dot to Dot ✏️ | Draw from 1 to 10; the shape fills with colour | number order |
| Road Trip ✏️ | Drag Shadow along a road to the gem, collecting 5 stars (counted out loud). Roads: line, wave, zigzag, arches, S | pencil control, the first strokes of writing |
| Coloring ✏️ | Colour a page from his own Shadow book: tap fills a space, drawing stays inside the lines | pencil control, fun |

## Youssef: Math 1–100 (number bonds 0–10 first)

A number bond splits a whole into two parts: 7 is 3 and 4. It is shown as a "whole" circle joined to two "part" circles. Youssef types most answers on a big number pad, or writes them with the pencil. Every game gets harder round by round.

| Game | What he does | Gets harder like this |
|---|---|---|
| Split It | Tap objects to move them between two plates; the number bond on top changes live. Keep 3 different ways to make the number. Nothing can be wrong | follows his Number Bond level, a bit bigger every 2 rounds |
| Number Bond | Fill in the missing part or the whole. Tap the beads (a ten frame) to count them | **adapts to him** (below) |
| Make Pairs | Tap two cards that make the target | make 7, 10, 8, 10, then 20 |
| Balance | Type the number that makes the scale level (it tilts live while he types) | `a+?=c`, `?+b=c`, `10=a+?`, `a−b=?`, `a+b=c+?` |
| Math Race | 10 quick sums; each answer makes Sonic dash toward the flag | + and − within 10 → teens → make 10 → doubles |
| Pen Math ✏️ | Write the answer with the pencil, one digit per box. The box shows what it read; the sponge clears it | single digits → make 10 → teens |
| Number Train | The missing number in a train of numbers | by 1s → across a ten → by 10s → by 2s/5s → to 100 or backwards |
| Tens & Ones | Read rods and cubes, then build numbers with +10 / +1 | 11–19 → up to 49 → whole tens → build up to 99 |

- **Number Bond levels:**
  - It starts at bonds of 3, then 4, 5 … 10, then mixed with 0.
  - At each size it asks for the whole (count all) before a missing part.
  - 3 big answer buttons up to bonds of 6, then the number pad. Beads show up to bonds of 7; after that they're behind the bulb.
  - 2 first-try answers in a row (3 from bonds of 6) move him up a step, and 2 misses on one question move him back.
  - His step is saved on the tablet (`levels.bond` in localStorage).
- **Menu strip:** the 0–10 row on his menu colours bond partners alike (3 and 7, 4 and 6 ...). Tapping one says the bond.
- **Wrong answers:** a wrong answer gives a hint, never a dead end. In the race and Pen Math, a second miss shows the answer and moves on.
- **Handwriting:** Pen Math reads digits with the $P point-cloud recognizer (`js/recognizer.js`), which ignores stroke order and direction. Test: about 95% of wobbly digits are read right.

## Changing what the voice says

All spoken lines live in `js/lines.js`. After adding or changing a line, record the new ones (from the project root):

```bash
.venv-tts/bin/python learn/tools/make_voice.py
```

It only records new lines (about 0.2 s each on the Mac's CPU) and deletes recordings that are no longer used. `tools/list_lines.mjs` lists every line, sampling the question generators in `js/mathgen.js`.

## Run it on this Mac

```bash
python3 -m http.server 8321 --directory learn
```

Then open http://localhost:8321. A plain double-click on `index.html` won't work, because browsers block JavaScript modules on `file://` pages.

## Publish

This folder is the git repository `ahmedmabrouk11011/kids-game` (personal account). GitHub Pages serves `main` from the root. After a push, the site updates in about a minute. The tablet may keep old files for up to 10 minutes; refresh after that.

## Add a game or a kid

- **New game:** add `js/games/<name>.js`, which exports `{ id, title, icon, color, create(api) }` where `create` returns `{ round(i), destroy() }`. Register it in `js/games/index.js` and add its id to the kid's `games` list in `js/app.js`.
- **The `api` object** gives a game:
  - `stage`, `kid` and `deck` (the numbers for the rounds)
  - `say(...lines)`, `setPrompt(...lines)` and `mistake()`
  - `win({ num | emoji | text, praise })`, which plays the reward screen and starts the next round
- **Number pad and options:** use `keypad()` / `qaLayout()` from `js/keypad.js` for typed answers. A game can set `rounds` (the race has 10, coloring 1). `win({ quick: true })` gives a short cheer instead of the reward screen.
- **Icons:** `icon(name)` from `js/util.js` uses `img/icons/<name>.svg`. More Fluent Emoji can be downloaded from the Microsoft repository.
- **New kid:** add an entry to `KIDS` in `js/app.js` (`id`, `name`, `hero`, `games`, `title`, `sub`, `strip`).
- **Pictures:** `tools/web_assets.py` (in the coloring project) makes the character cut-outs and copies the coloring pages.
