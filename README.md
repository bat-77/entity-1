# ENTITY-1

A catalog site for tracking supercar brokerage "Looking For" and "Selling" listings — plain HTML/CSS/JS, hosted free on GitHub Pages, with **GitHub itself acting as the shared database**. No Firebase, no third-party service — every add/edit/delete/log becomes a real commit to your repo, and every visitor's browser reads the same live file.

## How it works

- All the listings live in one file: **`data/entries.json`**.
- Anyone visiting the site **reads** that file straight from GitHub (no login needed) and the page re-checks it every ~20 seconds, so new posts from teammates show up automatically.
- When an admin **adds/edits/deletes an entry or logs an update**, the site commits the updated `data/entries.json` back to the repo using the GitHub API — under the hood, this is a real git commit, so you get a full audit trail for free (visible in the repo's commit history / "History" button on the file).
- To commit, each admin needs their own **GitHub Personal Access Token** pasted into the login screen once — GitHub requires this before anything is allowed to write to a repo. It's stored only in that person's browser (`localStorage`), never in the code or repo itself.

## Setup — three things, ~5 minutes total

### 1. Create the repo and turn on Pages

1. Create a **public** GitHub repo (e.g. `entity-1`). It needs to be public so that anyone viewing the site can read `data/entries.json` without needing their own token — only writing requires a token.
2. Upload every file in this folder, keeping the folder structure (`data/entries.json` must stay at that path).
3. Go to **Settings → Pages**, set Source to your main branch, root folder. Your site goes live at `https://<your-username>.github.io/<repo-name>/`.

### 2. Point the site at your repo

Open **`config.js`** and fill in your actual username and repo name:
```js
const GITHUB_CONFIG = {
  owner: "your-github-username",
  repo: "entity-1",
  branch: "main",
  dataPath: "data/entries.json"
};
```
Re-upload the file. The toolbar on the site will now say **SYNCED — GITHUB** instead of **LOCAL ONLY**.

### 3. Each admin generates their own token (needed to save changes)

1. On GitHub: click your profile photo → **Settings** → **Developer settings** (bottom of left sidebar) → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Give it a name (e.g. "ENTITY-1"), set an expiry you're comfortable with (e.g. 1 year).
3. Under **Repository access**, choose **Only select repositories** → pick your `entity-1` repo.
4. Under **Permissions → Repository permissions**, set **Contents** to **Read and write**. Leave everything else as-is.
5. Generate the token, copy it (starts with `github_pat_...`). You won't be able to see it again after leaving the page.
6. On the ENTITY-1 site, click **Admin Login**, log in with your username/password as usual, and paste the token into the "GitHub Token" field. It's saved in your browser from then on — you won't need to paste it again on that device unless you clear browser data or generate a new token.

Each of `ahnaf`, `chris`, and `bhav` does step 3 for themselves, once, on whichever device(s) they'll be posting from.

## Things to know

- **Not instant like a real-time app** — changes appear for other people within ~20 seconds (the polling interval), not the same millisecond. Good enough for a working catalog, just not a live chat.
- **Every edit is a commit** — this is a feature (full history of who changed what, viewable on GitHub) but it does mean rapid-fire edits create a busy commit log. That's fine.
- **The repo needs to stay public** for anonymous read access to work without a token. If "public repo" doesn't feel low-key enough, an unlisted/un-indexed Pages URL (nothing links to it, no listing) is the practical way to keep it obscure without making it private — same trade-off as before.
- **Tokens are like passwords** — anyone with a copy of someone's token could commit to the repo as if they were that person (GitHub attributes API commits to the token owner's account, though the commit author name/email will show as generic unless configured). Treat the token like the login passwords: don't share it outside the team, and revoke it from GitHub's token settings if you think it's been exposed.
- **The `ahnaf`/`chris`/`bhav` login is still just a UI gate** — it decides who gets shown the edit controls and whose name gets stamped on logs client-side, but the actual permission to write to GitHub is entirely controlled by whoever holds a valid token for that repo. That's now proper GitHub-level access control (much stronger than the old hardcoded-password-only setup), since a token can be revoked individually per person at any time from GitHub's settings.

## What's included

- `index.html` / `style.css` / `app.js` — the site
- `config.js` — where you point the site at your GitHub repo (step 2 above)
- `data/entries.json` — the live catalog data (already seeded with your current "Looking For" and "Selling" listings)
- `seed.js` — only used as a fallback if `config.js` isn't filled in yet (keeps the old local-only behaviour working)
- `favicon-dark.png` / `favicon-light.png` / `favicon-bat.png` — theme-matched favicons, swapped automatically
- Michroma "ENTITY-1" wordmark, block capitals, no rounded corners, black/white/red only
- Card view and Box view toggle
- Currency selector (USD, EUR, CHF, SGD, CAD, GBP, JPY) with live conversion, falling back to static rates if offline
- Add/edit/delete entries with image upload (auto-compressed client-side before committing, to keep commits small), make/model, mileage, VIN, budget/price + currency, location, priority, process, leads, tags
- Per-entry update log stamped with whoever is logged in, synced to everyone via the repo

## Resetting the data

- **GitHub mode:** edit `data/entries.json` directly on GitHub (or via a normal git push) — the site will pick it up on its next poll.
- **Local-only fallback mode:** open the browser console on the page and run:
  ```js
  localStorage.removeItem("entity1_entries_v1"); location.reload();
  ```
