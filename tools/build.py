"""Generate a real page for every link on the site.

GitHub Pages only serves files that exist, so /resume/ needs a resume/index.html. Each generated page is a copy of
index.html with its asset paths adjusted for its folder depth and its own title, so a shared link opens straight to
that view and shows the right title in link previews. The script in assets/app.js reads the address and opens the view.

Run from the project folder after changing index.html or adding a project:
    python tools/build.py
"""
import os
import re
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://odinsimonson.com/"
NAME = "Odin Simonson"


def projects():
    js = open(os.path.join(ROOT, "assets", "app.js"), encoding="utf-8").read()
    block = js[js.index("const P=["):js.index("];", js.index("const P=["))]
    return re.findall(r"\{id:'([^']+)',name:'([^']+)'", block)


def page(template, path, title, absolute=False):
    depth = path.count("/") + 1 if path else 0
    prefix = "/" if absolute else "../" * depth
    html = template.replace('href="assets/', f'href="{prefix}assets/').replace('src="assets/', f'src="{prefix}assets/')
    html = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", html, count=1)
    html = re.sub(r'(<meta property="og:title" content=")[^"]*', rf"\g<1>{title}", html, count=1)
    html = re.sub(r'(<meta property="og:url" content=")[^"]*', rf"\g<1>{SITE}{path + '/' if path else ''}", html, count=1)
    return html


def write(rel, html):
    full = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="") as f:
        f.write(html)


def main():
    template = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    routes = [("sandbox", f"Sandbox · {NAME}"), ("resume", f"Resume · {NAME}"), ("simple", f"{NAME} · Projects")]
    routes += [(f"projects/{pid}", f"{name} · {NAME}") for pid, name in projects()]

    # start clean so a removed project doesn't leave an old page behind
    shutil.rmtree(os.path.join(ROOT, "projects"), ignore_errors=True)
    for path, title in routes:
        write(f"{path}/index.html", page(template, path, title))
    # GitHub shows 404.html for any unknown address at any depth, so it needs root-absolute asset paths
    write("404.html", page(template, "", f"{NAME} · Portfolio", absolute=True))
    print(f"built {len(routes)} pages + 404.html")


if __name__ == "__main__":
    main()
