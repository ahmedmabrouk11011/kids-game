# Kids Learn

Little learning games for Omar (3.5) and Youssef (5), made for a tablet with a pencil.
It is one static page (HTML, CSS and plain JavaScript modules). There is no build step, no images, no audio files, and nothing costs money.

- **Pictures:** emoji and CSS only.
- **Sounds:** made in code with Web Audio.
- **Spoken words:** the tablet's own built-in voice (`speechSynthesis`). If the tablet has no voice, the games still work, just silently.
- **Progress:** stars are saved in the browser (`localStorage`) on that device only.

## Omar: Numbers 1–10

| Game | What he does | Skill |
|---|---|---|
| 👆 Count | Tap each object; every tap says the next number | counting one by one |
| 🤔 How Many? | Pick the right number (3 big buttons). A wrong answer counts together with him | quantity → numeral |
| ✏️ Trace | A pencil shows how to write the number, then he traces it and presses ✔ | writing digits |
| 🧺 Apples | See a number, put that many apples in the basket, press ✔ | numeral → quantity |
| 🎈 Balloons | Pop the balloon with the number that is shown and said | recognising numerals |
| ⭐ Dot to Dot | Draw from 1 to 10; the shape fills with colour | number order |

- Each game has 5 rounds. A correct answer opens a reward screen: a big bouncing number, fireworks, and stars and balloons he can pop. He taps ▶ to go on, or it moves on by itself after 9 s.
- After the 5 rounds a trophy shows 1–3 stars, based on how many mistakes he made.
- The number strip 1–10 on the menu says each number when he taps it.
- 🗣️ repeats the instruction, 🔊 turns the sound off and on, and ⛶ switches to full screen.
- **Pencil:** while the pencil is in use, touches from the palm are ignored, so he can rest his hand on the screen.

## Youssef: Math 1–100 (number bonds 0–10 first)

A number bond splits a whole into two parts: 7 is 3 and 4. It is shown as a "whole" circle joined to two "part" circles, or as two colours of counters in a ten frame. Youssef types most answers on a big number pad (1–9, ⌫, 0, ✔). Every game gets harder round by round.

| Game | What he does | Gets harder like this |
|---|---|---|
| 🍒 Number Bond | Fill in the missing part or the whole | bead hints → missing whole → bonds of 10 → bonds with 0 |
| 🃏 Make Pairs | Tap two cards that make the target | make 7, 10, 8, 10, then 20 |
| ⚖️ Balance | Type the number that makes the scale level (it tilts live while he types) | `a+?=c`, `?+b=c`, `10=a+?`, `a−b=?`, `a+b=c+?` |
| 🏁 Math Race | 10 quick sums; each answer moves the hedgehog toward the flag | + and − within 10 → teens → make 10 → doubles |
| 🚂 Number Train | The missing number in a train of numbers | by 1s → across a ten → by 10s → by 2s/5s → to 100 or backwards |
| 🧱 Tens & Ones | Read rods and cubes, then build numbers with +10 / +1 | 11–19 → up to 49 → whole tens → build up to 99 |

- **Menu strip:** the 0–10 row on his menu colours bond partners alike (3 and 7, 4 and 6 ...). Tapping one says the bond.
- **Wrong answers:** a wrong answer gives a hint, never a dead end. In the race, a second miss shows the answer and moves on.

## Run it on this Mac

```bash
python3 -m http.server 8321 --directory learn
```

Then open http://localhost:8321. A plain double-click on `index.html` won't work, because browsers block JavaScript modules on `file://` pages.

**On the tablet, before the site is online:** keep the server running and put the tablet on the same Wi-Fi as the Mac. Open `http://<Mac IP>:8321` on the tablet. To find the Mac's IP, run `ipconfig getifaddr en0`.

## Put it on GitHub Pages (personal account)

1. Make a new repository on your **personal** GitHub, for example `kids-learn`.
2. Push the *contents* of this `learn/` folder, so that `index.html` sits at the top of the repository.
3. On GitHub, open **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, then `main` and `/ (root)`.
4. After about a minute the site is at `https://<user>.github.io/kids-learn/`. On the tablet, open it and choose **Add to Home screen**. It then opens full screen like an app.

## Add a game or a kid

- **New game:** add `js/games/<name>.js`, which exports `{ id, title, emoji, color, create(api) }` where `create` returns `{ round(i), destroy() }`. Register it in `js/games/index.js` and add its id to the kid's `games` list in `js/app.js`.
- **The `api` object** gives a game:
  - `stage` and `deck` (the numbers for the 5 rounds)
  - `say(text)`, `setPrompt(text)` and `mistake()`
  - `win({num | emoji, praise})`, which plays the reward screen and starts the next round
- **New kid or topic:** add an entry to `KIDS` in `js/app.js`, with `games`, `title`, `sub` and `strip` (`count` or `bonds`).
- **Number pad and round count:** use `keypad()` / `qaLayout()` from `js/keypad.js` for typed answers. A game can set `rounds` (the race has 10). `win({ text })` shows a sum like `3 + 4 = 7` on the reward screen. `win({ quick: true })` gives a short cheer instead.
