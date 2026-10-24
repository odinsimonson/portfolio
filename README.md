# odinsimonson.com

My portfolio: a retro terminal that unfolds into a falling-sand sandbox, with a page for every project and my resume.

Live at **https://odinsimonson.com**

## How it's built
Plain HTML, CSS and JavaScript, with no frameworks and no build step needed to view it.

- `index.html`: the page
- `assets/app.js`: the terminal, the sandbox simulation (sand, water, lava, rock, steam), crates, themes and page links
- `assets/style.css`: all styling; colors come from the active theme
- `projects/<name>/`, `resume/`, `sandbox/`, `simple/`: copies of `index.html` so each link opens straight to that view
- `404.html`: shown for unknown addresses
- `tools/build.py`: regenerates those copies
- `concepts/`: the five early design concepts

## Updating
1. Edit `index.html`, `assets/app.js` or `assets/style.css`.
2. If you changed `index.html` or added or removed a project, run `python tools/build.py`.
3. Upload the changed files to this repository. GitHub Pages republishes in about a minute.
