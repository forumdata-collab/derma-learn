#!/usr/bin/env python3
"""Build 皮紋分析學習站 single-page site from content.json + assets."""
import json, html, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))

def esc(s):
    return html.escape(s, quote=True)

def render_sections(sections):
    out = []
    for sec in sections:
        body = esc(sec['body']).replace('\n', '<br>')
        imgs = sec.get('images') or ([sec['image']] if sec.get('image') else [])
        figs = ''
        for im in imgs:
            if isinstance(im, str):
                figs += f'\n<img src="{esc(im)}" alt="{esc(sec.get("title",""))}">'
                if sec.get('caption'):
                    figs += f'\n<div class="caption">{esc(sec["caption"])}</div>'
            else:
                figs += f'\n<img src="{esc(im["src"])}" alt="{esc(im.get("alt", sec.get("title","")))}">'
                if im.get('caption'):
                    figs += f'\n<div class="caption">{esc(im["caption"])}</div>'
        out.append(f'<div class="section"><h3>{esc(sec["title"])}</h3><div>{body}</div>{figs}</div>')
    return '\n'.join(out)

def render_quiz(quiz):
    items = []
    for i, q in enumerate(quiz):
        opts = ''.join(
            f'<label><input type="radio" name="q{i}" value="{j}"> {esc(o)}</label>'
            for j, o in enumerate(q['options'])
        )
        explain = esc(q['explain'])
        items.append(
            f'<div class="q-item" data-index="{q["answer"]}">'
            f'<div class="q-num">第 {i+1} 題</div>'
            f'<div class="q-text">{esc(q["q"])}</div>{opts}'
            f'<div class="explain">💡 {explain}</div></div>'
        )
    return (
        '<div class="quiz"><h3>📝 選擇題</h3>\n' + '\n'.join(items) + '\n'
        '<button class="submit-btn">提交答案</button>'
        '<div class="score-box"><h4>得分：<span class="score-num">0</span> / <span class="score-total">0</span></h4>'
        '<p class="score-msg"></p></div></div>'
    )

def render_levels(levels):
    out = []
    for i, lv in enumerate(levels):
        goals = ''.join(f'<li>{esc(g)}</li>' for g in lv['goals'])
        out.append(
            f'<section class="level{" active" if i==0 else ""}" id="level-{esc(lv["id"])}">'
            f'<div class="level-header"><h2>{lv["emoji"]} {esc(lv["name"])}</h2>'
            f'<p>{esc(lv["subtitle"])}</p></div>'
            f'<div class="goals"><h3>🎯 教學目標</h3><ul>{goals}</ul></div>'
            f'{render_sections(lv["sections"])}{render_quiz(lv["quiz"])}'
            f'</section>'
        )
    return '\n'.join(out)

def render_tabs(levels):
    return ''.join(
        f'<button class="tab{" active" if i==0 else ""}" data-level="{esc(lv["id"])}">'
        f'{lv["emoji"]} {esc(lv["name"])}</button>'
        for i, lv in enumerate(levels)
    )

def main():
    with open(os.path.join(ROOT, 'content.json'), encoding='utf-8') as f:
        data = json.load(f)
    levels = data['levels']

    # validate quiz answers
    for lv in levels:
        for q in lv['quiz']:
            assert 0 <= q['answer'] < len(q['options']), f"bad answer in {lv['id']}: {q['q']}"

    sources = ''.join(f'<li>{esc(s)}</li>' for s in data.get('sources', []))
    css = open(os.path.join(ROOT, 'assets', 'derma.css'), encoding='utf-8').read()
    js = open(os.path.join(ROOT, 'assets', 'derma.js'), encoding='utf-8').read()

    page = f'''<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(data['title'])}</title>
<style>{css}</style>
</head>
<body>
<header>
<h1>🔎 {esc(data['title'])}</h1>
<p>{esc(data['subtitle'])}</p>
<p class="disclaimer">⚠️ {esc(data['disclaimer'])}</p>
</header>
<nav class="tabs">{render_tabs(levels)}</nav>
<main>{render_levels(levels)}</main>
<section class="sources"><h3>📚 資料來源</h3><ul>{sources}</ul></section>
<footer>皮紋分析學習站 · 教學內容基於公開文獻整理，並非專業評估建議 · 與任何皮紋檢測機構無關</footer>
<script>{js}</script>
</body>
</html>'''

    out = os.path.join(ROOT, 'index.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(page)
    print(f'✅ built {out} ({len(page)/1024:.1f} KB)')

if __name__ == '__main__':
    main()