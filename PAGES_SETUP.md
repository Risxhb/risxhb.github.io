# GitHub Pages Setup For Eve

This repository can be published as a static GitHub Pages site with a homepage
at the root and the playable Eve game hosted under the Eve project path.

## URL Shape

For a project site, GitHub Pages usually publishes at:

```text
https://<account>.github.io/<repository>/
```

For a user or organization site, GitHub Pages usually publishes at:

```text
https://<account>.github.io/
```

For the current public setup, use:

```text
Homepage: https://risxhb.github.io/
Game:     https://risxhb.github.io/eve/
```

The repo root should contain:

```text
.nojekyll
index.html
landing.css
eve/
```

With the files in this repository, the homepage opens at `/`. The homepage play
links point to the game at `https://risxhb.github.io/eve/`.

## Build A Clean Publish Folder

```powershell
.\scripts\build_pages_site.ps1 -Output dist-pages -GameFolderName eve
```

That creates:

```text
dist-pages/
  .nojekyll
  index.html
  landing.css
  eve/
```

The build copies only runtime files and manifest-referenced assets.

## Publish

Create an empty GitHub repository, then add its remote URL:

```powershell
git init
git branch -M main
git remote add origin <github-repo-url>
git add .
git commit -m "Publish Eve"
git push -u origin main
```

On GitHub, open the repository settings, go to Pages, select `Deploy from a
branch`, choose `main`, and publish from `/(root)`.

## Size Note

The playable game does not require local QA screenshots, temporary folders, or
source-generation runs. Keep those out of GitHub and publish only the runtime
game files.
