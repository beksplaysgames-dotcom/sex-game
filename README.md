# Positions

A simple site: pick a difficulty (Easy / Medium / Hard / Extreme), get a random position (image + name), tap Draw for another. No backend, no build step — just static files.

## Files

- `index.html` — the page structure
- `style.css` — all styling
- `data.js` — **this is where your positions live**. Edit this file to add/remove/edit entries.
- `script.js` — the logic (you shouldn't need to touch this)
- `images/` — put any position images here

## Adding your positions

Open `data.js` in any text editor. Each entry looks like this:

```js
{ text: "Missionary", tier: "Easy", imagePath: "" },
```

- `text`: the name/description shown on screen
- `tier`: must be exactly `"Easy"`, `"Medium"`, `"Hard"`, or `"Extreme"`
- `imagePath`: leave as `""` for no image, or put the filename of an image you've placed in the `images/` folder, e.g. `"images/missionary.jpg"`

Just add a comma-separated entry for each of your ~400 positions inside the `POSITIONS` array. No limit on how many you add.

## Adding your Truth or Dare prompts

Open `truth-or-dare-data.csv` — it's a plain spreadsheet file, so you can edit it in Excel/Numbers/Google Sheets, or any text editor. Three columns:

```csv
kind,tier,text
truth,Easy,"What's a small thing your partner does that always turns you on?"
dare,Medium,"Give your partner a slow massage for two minutes, anywhere you choose."
```

- `kind`: must be exactly `truth` or `dare`
- `tier`: must be exactly `Easy`, `Medium`, `Hard`, or `Extreme` — same difficulty scale as Positions (Easy = generic/intimate, Medium = touching/massage/oral, Hard = vanilla sex, Extreme = special positions/BDSM)
- `text`: the prompt itself. Wrap it in double quotes if it contains a comma.

Add one row per prompt, in any order, as many as you want. In the app, players pick a difficulty from the dropdown at the top of the Truth or Dare screen, same as switching difficulty on the Positions draw screen. This file is separate from `data.js` so you can fill in real prompts privately, without sending them to anyone.

**Note:** because this file is loaded over the network, it only works when the site is served over http(s) — see "Testing locally" below.

## Adding your Dice Game words

Open `dice-game-data.csv` — same spreadsheet-friendly format. Three columns:

```csv
die,tier,text
Action,Easy,Kiss
Location,Easy,Neck
```

- `die`: must be exactly `Action` or `Location`
- `tier`: must be exactly `Easy`, `Medium`, `Hard`, or `Extreme` — same difficulty scale as Positions and Truth or Dare
- `text`: the word shown on that die's face

This one needs **exactly 6 `Action` rows and exactly 6 `Location` rows per tier** — one per face of each physical die, no more, no fewer, ×4 tiers (48 rows total). Replace the example words with your own; the app repaints both dice's faces automatically whenever the difficulty changes. Like Truth or Dare, players pick a starting difficulty when they open the game, and get asked to level up every 5 rolls.

## The Gallery page

Tap "View all positions" on the home screen to see every position as a grid of images (or a placeholder star if no image is set). Filter by difficulty with the dropdown at the top. Tap any image to mark it as tried — a gold checkmark appears in the corner, and the counter at the top shows how many you've tried out of the total. Tap again to un-mark it.

## Shuffle vs. Done (on the draw screen)

- **Shuffle** — draws a new random position, doesn't change tried-status of anything.
- **Done** — marks the position currently on screen as tried, then draws a new random one. Use this once you've actually done it.

Tried-status is shared between the Gallery and the draw screen (same underlying data) and saved in your browser's local storage, so it persists between visits on the same device/browser. Note: this is stored per-browser, not synced between your phone and your partner's — each device keeps its own tried-list.

## Testing locally

Double-click `index.html` to open it directly in your browser for most of the app — no server needed. The one exception is anything that loads a CSV (Truth or Dare, Dice Game): browsers block a page opened this way (`file://...`) from loading `truth-or-dare-data.csv` or `dice-game-data.csv`, so those screens will show a fallback message until you either test on the live GitHub Pages site, or serve the folder locally, e.g. with Python already installed:
```
python -m http.server 8000
```
then open `http://localhost:8000` in your browser.

## Publishing to GitHub Pages (free hosting)

1. Create a new **private** repository on GitHub (private keeps it out of public search/listings — GitHub Pages sites are still reachable by anyone with the exact URL even on a private repo with Pages enabled on a paid plan, or make it public if you're on GitHub's free tier, since Pages requires a public repo unless you have GitHub Pro/Team).
2. Upload all files in this folder (`index.html`, `style.css`, `data.js`, `script.js`, `truth-or-dare-data.csv`, `dice-game-data.csv`, and the `images/` folder) to the repo — either drag-and-drop via the GitHub web UI, or via git:
   ```
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages**.
4. Under "Build and deployment", set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`. Save.
5. Wait a minute or two — GitHub will give you a URL like:
   `https://YOUR_USERNAME.github.io/YOUR_REPO/`
6. That's your live site. Bookmark it on both your phones.

## Updating positions later

Anytime you want to add/edit positions: edit `data.js`, commit, and push. GitHub Pages redeploys automatically within a minute or two — no rebuild step, no app store, nothing else needed.
