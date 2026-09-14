#!/usr/bin/env python3
"""Gera v1.html, v2.html, v3.html NESTA pasta a partir do index.html REAL
(evoluteca_2/index.html): troca só o bloco da seção 03 (Simuladores) e
reescreve os caminhos para ../../ — a abertura, as seções 01 e 02 e o Sobre
exibidos são exatamente os de produção.

    python3 variantes/sessao-286e1a/gerar.py        # as três
    python3 variantes/sessao-286e1a/gerar.py 2      # só a v2
"""
import re, sys, pathlib

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
fonte = (RAIZ / "index.html").read_text(encoding="utf-8")

def gerar(n):
    html = fonte

    # ---- a seção: fica só o título; a variante monta o resto ----
    html = re.sub(
        r'    <!-- ============ simuladores ============.*?</section>\n',
        f'    <!-- ============ simuladores ============\n'
        f'         VARIANTE v{n}: montada por sim-v{n}.js, abaixo do título -->\n'
        f'    <section class="secao" id="secao-simuladores">\n'
        f'      <div class="container">\n'
        f'        <h2 class="titulo-secao">Simuladores</h2>\n'
        f'      </div>\n'
        f'    </section>\n',
        html, count=1, flags=re.S)

    # ---- o script: a home real chama montarHome(); aqui, a variante ----
    html = re.sub(
        r'  <script type="module">.*?</script>',
        f'  <script type="module">\n'
        f'    import {{ montarHome }} from "../../paginas/home/__pacote__.js";\n'
        f'    await montarHome();\n'
        f'    const secaoSimuladores = document.getElementById("secao-simuladores");\n'
        f'    secaoSimuladores.querySelector(".container").replaceChildren(\n'
        f'      secaoSimuladores.querySelector(".titulo-secao"));\n'
        f'    const sim = await import("./sim-v{n}.js");\n'
        f'    sim.montar(secaoSimuladores, {{ base: "../../" }});\n'
        f'  </script>',
        html, count=1, flags=re.S)
    assert f"sim-v{n}.js" in html, "não achei o <script> da home para trocar"

    # ---- caminhos relativos: a página vive dois níveis abaixo ----
    html = re.sub(r'(href|src)="(?!https?:|#|\.\./|mailto:)', r'\1="../../', html)
    html = html.replace('"./', '"../../').replace('`./', '`../../')
    html = html.replace(f'"../../sim-v{n}.js"', f'"./sim-v{n}.js"')   # a variante mora nesta pasta
    html = html.replace('<link rel="stylesheet" href="../../aparencia/home/__pacote__.css">',
                        f'<link rel="stylesheet" href="../../aparencia/home/__pacote__.css">\n  <link rel="stylesheet" href="sim-v{n}.css">')
    html = html.replace('<title>Evoluteca —', f'<title>v{n} · Evoluteca —')
    (AQUI / f"v{n}.html").write_text(html, encoding="utf-8")
    print(f"escrito {AQUI.name}/v{n}.html")

for n in (sys.argv[1:] or ["1", "2", "3"]):
    gerar(n)
