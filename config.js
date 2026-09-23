// ============================================================
// GITHUB CONFIG — fill this in with YOUR repo details
// ============================================================
// ENTITY-1 stores its data as a plain JSON file (data/entries.json)
// inside this same GitHub repo. Reads use GitHub's raw CDN (no token
// needed — works for anyone visiting the site). Writes (add/edit/
// delete/log an entry) use the GitHub API to commit the updated file
// back to the repo, which requires each admin to paste in their own
// GitHub Personal Access Token once (see README.md for how to make one).
//
// Fill in your repo's owner (your GitHub username) and repo name below,
// then re-upload this file.

const GITHUB_CONFIG = {
  owner: "bat-77", // e.g. "ahnaf-adib"
  repo: "entity-1", // e.g. "entity-1"
  branch: "main", // change if your default branch is different
  dataPath: "data/entries.json", // don't change unless you also move the file
};
