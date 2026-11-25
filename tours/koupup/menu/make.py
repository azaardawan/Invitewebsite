#!/usr/bin/env python3
"""KOUP's menu for its tour (owner, 2026-11-24): `python3 tours/koupup/menu/make.py` (needs Pillow).

Reads the café's own online menu (https://koupofficial.com/azadi: its categories, drinks, prices and photos), adds how
the barista makes each drink (`R` below: the steps and the colour each leaves in the cup, picked from the café's
photos) and the bottles of the syrup rack, and writes `tours/koupup/menu.json` and `tours/koupup/menu/photos.jpg`
(one picture of every item's photo). Then rebuild the model (`node tours/koupup/export.cjs`). A drink the café adds
needs its line in `R` (the script stops and names it).
"""
import io, json, os, re, urllib.request
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
URL = 'https://koupofficial.com/azadi'
page = urllib.request.urlopen(URL, timeout=30).read().decode('utf8')
W = {'c': json.loads(re.search(r'window.koupCategories = (\[.*?\]);', page).group(1)),
     'd': json.loads(re.search(r'window.koupDrinks = (\[.*?\]);', page).group(1))}
def photo(d):
    return Image.open(io.BytesIO(urllib.request.urlopen(d['image'], timeout=30).read())).convert('RGBA')

cats = [{'id': c['id'], 'label': c['label']} for c in W['c']] + [{'id': 'sweets', 'label': 'Sweets'}]
web = {d['id']: d for d in W['d']}

# --- recipes: what the barista does, in order, and the colour each step leaves in the cup (bottom to top)
def shot(to, c='#4a2716', n=1, mix=None): return {'s': 'shot', 'n': n, 'c': c, 'to': to, **({'mix': mix} if mix else {})}
def steam(to, c, art=None, artC='#f6f1e8'): return {'s': 'steam', 'c': c, 'to': to, **({'art': art, 'artC': artC} if art else {})}
def syrup(b, to, c=None, into=None): return {'s': 'syrup', 'b': b, 'to': to, **({'c': c} if c else {}), **({'into': into} if into else {})}
def pour(b, to, c, mix=None, foam=None): return {'s': 'pour', 'b': b, 'c': c, 'to': to, **({'mix': mix} if mix else {}), **({'foam': foam} if foam else {})}
def water(to, c='#3a2416'): return {'s': 'water', 'c': c, 'to': to}
ICE = {'s': 'ice'}
def blend(c, to=0.9): return {'s': 'blend', 'c': c, 'to': to}
GARNISH_FROM = {'dust': 'cinnamon', 'crumbs': None, 'drizzle': None}
def top(g, c=None, b=None): return {'s': 'top', 'g': g, **({'c': c} if c else {}), **({'b': b or GARNISH_FROM.get(g)} if (b or GARNISH_FROM.get(g)) else {})}

R = {
 1: ('espresso', [shot(0.55, '#3a1f12')], {'crema': '#b9814a'}),
 2: ('espresso', [shot(0.78, '#3a1f12', 2)], {'crema': '#c08a52'}),
 3: ('hot', [water(0.6), shot(0.88, '#2e1a10')], {'crema': '#8f5d30'}),
 4: ('hot', [water(0.5), shot(0.88, '#2a170e', 2)], {'crema': '#94603a'}),
 24: ('hot', [shot(0.25), steam(0.9, '#eadfd2', 'heart')], {'ring': '#a8754a'}),
 25: ('hot', [shot(0.22), steam(0.9, '#ddc8b3', 'heart')], {'ring': '#9b6a42'}),
 26: ('hot', [syrup('caramel', 0.06), shot(0.25), steam(0.9, '#d9c1a8', 'tulip')], {'ring': '#9b6a42'}),
 27: ('hot', [syrup('condensed', 0.08), shot(0.27), steam(0.9, '#dcc6ae', 'rosetta')], {'ring': '#9b6a42'}),
 28: ('hot', [syrup('strawberry', 0.06), shot(0.25), steam(0.9, '#e2c4bd', 'heart')], {'ring': '#a26a55'}),
 29: ('hot', [syrup('chocolate', 0.07), shot(0.26), steam(0.9, '#c99b74', 'swan', '#efe2d2')], {'ring': '#7a4a2e'}),
 30: ('hot', [syrup('vanilla', 0.06), shot(0.25), steam(0.9, '#dfcbb6', 'heart')], {'ring': '#9b6a42'}),
 31: ('hot', [syrup('vanilla_diet', 0.06), shot(0.25), steam(0.9, '#e0cdb9', 'heart')], {'ring': '#9b6a42'}),
 32: ('hot', [syrup('vanilla', 0.06), steam(0.9, '#f1ebe1')], {}),
 33: ('hot', [syrup('hazelnut', 0.1), steam(0.9, '#a2714b')], {}),
 34: ('hot', [syrup('chocolate', 0.14), steam(0.9, '#8a5634')], {}),
 35: ('hot', [syrup('kazan', 0.12), steam(0.9, '#93704a')], {}),
 36: ('hot', [syrup('salep', 0.12), steam(0.9, '#efe8da'), top('dust', '#a0683a')], {}),
 37: ('hot', [syrup('karak', 0.5), steam(0.9, '#c79a62')], {}),
 72: ('hot', [syrup('matcha', 0.12), steam(0.9, '#93a046', 'heart', '#f1f1e2')], {'ring': '#7d8c3a'}),
 38: ('iced', [ICE, pour('milk', 0.5, '#f0e9e1'), shot(0.9, '#7d4a33')], {}),
 39: ('iced', [ICE, syrup('caramel', 0.07), pour('milk', 0.6, '#efe6da'), shot(0.9, '#8a5a3a', mix='#d8ae84')], {}),
 40: ('iced', [ICE, syrup('condensed', 0.08), pour('milk', 0.6, '#f0e8dc'), shot(0.9, '#8a5a3a', mix='#dab48b')], {}),
 41: ('iced', [ICE, syrup('strawberry', 0.08, '#c0404a'), pour('milk', 0.6, '#f1cfd3'), shot(0.9, '#7a4a38')], {}),
 42: ('iced', [ICE, pour('water', 0.6, '#eef4f6'), shot(0.9, '#4a261d', mix='#4a261d')], {}),
 43: ('iced', [ICE, pour('water', 0.5, '#eef4f6'), shot(0.9, '#3e2018', 2, mix='#3e2018')], {}),
 44: ('iced', [ICE, syrup('chocolate', 0.07), pour('milk', 0.6, '#ece0d4'), shot(0.9, '#6b4330', mix='#b37a5d')], {}),
 45: ('iced', [ICE, syrup('vanilla', 0.07), pour('milk', 0.6, '#f3ece0'), shot(0.9, '#8a5a3a', mix='#d9b48e')], {}),
 46: ('iced', [ICE, syrup('vanilla_diet', 0.07), pour('milk', 0.6, '#f3ece0'), shot(0.9, '#8a5a3a', mix='#dab48b')], {}),
 47: ('iced', [ICE, syrup('peach', 0.08), pour('tea', 0.88, '#6a3326', foam='#e8ddd5')], {}),
 48: ('iced', [ICE, syrup('lemon', 0.08), pour('tea', 0.88, '#6f3622', foam='#e5dbd5'), top('lemon')], {}),
 49: ('iced', [ICE, syrup('strawberry', 0.08, '#b0262e'), pour('tea', 0.88, '#6e201f', foam='#d8b4a2')], {}),
 50: ('iced', [syrup('mango', 0, into='jug'), blend('#f4b904')], {}),
 51: ('iced', [syrup('cherry', 0, into='jug'), blend('#ee924c')], {}),
 52: ('iced', [syrup('mango', 0, into='jug'), syrup('strawberry', 0, into='jug'), blend('#f29c53')], {}),
 53: ('iced', [syrup('lotus', 0, into='jug'), blend('#e2c5ae'), top('crumbs', '#b0773f', 'lotus')], {}),
 54: ('iced', [syrup('oreo', 0, into='jug'), blend('#d4cecc'), top('crumbs', '#2b2b2b', 'oreo')], {'speckle': '#3a3a3a'}),
 55: ('iced', [syrup('vanilla', 0, into='jug'), blend('#f1ebe3')], {}),
 56: ('iced', [syrup('strawberry', 0.0, into='jug'), blend('#ead6d6'), top('drizzle', '#c33b3b', 'strawberry')], {}),
 57: ('iced', [syrup('nutella', 0, into='jug'), blend('#cfaa9b'), top('drizzle', '#5d362f', 'chocolate')], {}),
 58: ('iced', [ICE, syrup('secret_garden', 0.12, '#2d6a06'), pour('soda', 0.9, '#3b8a14', mix=None), top('mint'), top('lime')], {}),
 59: ('iced', [ICE, syrup('sunset', 0.2, '#7c2717'), pour('soda', 0.9, '#a2462f'), top('lemon')], {}),
 60: ('iced', [ICE, syrup('koup_mix', 0.2, '#611a27'), pour('soda', 0.9, '#c45a62'), top('mint')], {}),
 61: ('iced', [ICE, syrup('blue_pina', 0.2, '#035a71'), pour('soda', 0.9, '#0a7d95'), top('lime'), top('mint')], {}),
 62: ('iced', [ICE, syrup('strawberry', 0.2, '#7f1b21'), syrup('mojito', 0.3, '#9a2a25'), pour('soda', 0.9, '#b84433'), top('lime'), top('mint')], {}),
 63: ('iced', [ICE, syrup('blueberry', 0.2, '#3d2a2d'), syrup('mojito', 0.3, '#55262b'), pour('soda', 0.9, '#76303a'), top('lime'), top('mint')], {}),
 64: ('iced', [ICE, syrup('pineapple', 0.2, '#b99955'), syrup('mojito', 0.3, '#c9a43a'), pour('soda', 0.9, '#e2ad0a'), top('lemon'), top('mint')], {}),
 65: ('iced', [ICE, syrup('peach', 0.2, '#d9813a'), syrup('mojito', 0.3, '#de8c3d'), pour('soda', 0.9, '#f0a24f'), top('lemon'), top('mint')], {}),
 66: ('iced', [ICE, syrup('blue_curacao', 0.25, '#024e8d'), syrup('mojito', 0.35, '#0a6aa0'), pour('soda', 0.9, '#5aa8b2'), top('lemon')], {}),
 67: ('iced', [ICE, syrup('grape', 0.25, '#5d2325'), syrup('mojito', 0.35, '#7b181c'), pour('soda', 0.9, '#a2401e'), top('lemon'), top('mint')], {}),
 68: ('iced', [ICE, syrup('passion_fruit', 0.25, '#ba7301'), syrup('mojito', 0.35, '#c98301'), pour('soda', 0.9, '#da9901'), top('seeds', '#2a1a0a'), top('lemon'), top('mint')], {}),
 69: ('iced', [ICE, syrup('mango', 0.25, '#c27c00'), syrup('mojito', 0.35, '#cc8600'), pour('soda', 0.9, '#db9a00'), top('lemon'), top('mint')], {}),
 70: ('iced', [ICE, pour('milk', 0.55, '#f2f0ea'), syrup('matcha', 0.9, '#7d8a4e')], {}),
 71: ('iced', [ICE, syrup('strawberry', 0.1, '#d7bbc0'), pour('milk', 0.55, '#f1dbde'), syrup('matcha', 0.9, '#6a7646')], {}),
}
# the bottles and jars (kept in the syrup rack by the window): label, colour of what is in them, and shape
BOTTLES = {
 'caramel': ('Caramel', '#c27a2c', 'bottle'), 'vanilla': ('Vanilla', '#efe1b8', 'bottle'), 'vanilla_diet': ('Vanilla sugar-free', '#f3ead2', 'bottle'),
 'hazelnut': ('Hazelnut', '#8a5a32', 'bottle'), 'condensed': ('Condensed milk', '#f1e6cc', 'bottle'), 'chocolate': ('Chocolate', '#4a2a1c', 'bottle'),
 'strawberry': ('Strawberry', '#c8263a', 'bottle'), 'karak': ('Karak', '#b07a3e', 'bottle'), 'kazan': ('Kazan', '#7a5a35', 'jar'),
 'salep': ('Salep', '#efe7d8', 'jar'), 'matcha': ('Matcha', '#7c9a3c', 'jar'), 'lotus': ('Lotus', '#c58a4e', 'jar'), 'nutella': ('Nutella', '#5a3322', 'jar'),
 'oreo': ('Oreo', '#2b2b2b', 'jar'), 'mango': ('Mango', '#f5b000', 'bottle'), 'cherry': ('Cherry', '#9a1426', 'bottle'), 'peach': ('Peach', '#f2994a', 'bottle'),
 'lemon': ('Lemon', '#f2dc4a', 'bottle'), 'blue_curacao': ('Blue Curaçao', '#1f6fd1', 'bottle'), 'blue_pina': ('Blue Piña Colada', '#1aa0b8', 'bottle'),
 'pineapple': ('Pineapple', '#f2c230', 'bottle'), 'blueberry': ('Blueberry', '#4b2f6f', 'bottle'), 'grape': ('Brazilian Grape', '#6b1f3a', 'bottle'),
 'passion_fruit': ('Passion Fruit', '#f29f05', 'bottle'), 'mojito': ('Mojito (lime & mint)', '#8cc35a', 'bottle'), 'secret_garden': ('Secret Garden', '#3f8f22', 'bottle'),
 'sunset': ('Sunset', '#e0532b', 'bottle'), 'koup_mix': ('Koup Mix', '#c9304e', 'bottle'), 'tea': ('Iced tea', '#6b2a17', 'bottle'),
 'cinnamon': ('Cinnamon', '#a0683a', 'shaker'), 'milk': ('Milk', '#fbfaf5', 'carton'), 'soda': ('Soda', '#e6f2f5', 'bottle'), 'water': ('Water', '#eef4f6', 'bottle'),
}
order = [c['id'] for c in W['c']]
items = []
for cid in order:
    for d in sorted([d for d in W['d'] if d['category'] == cid], key=lambda d: d['id']):
        if d['id'] not in R: raise SystemExit(f"no recipe for {d['name']} (id {d['id']}): add it to R")
        cup, make, look = R[d['id']]
        for st in make:
            if st['s'] == 'syrup' and 'c' not in st: st['c'] = BOTTLES[st['b']][1]
            if 'b' in st: assert st['b'] in BOTTLES, st['b']
        name = d['name'].replace('بندەق', '').replace('کەزان', '').strip()
        items.append({'id': d['id'], 'cat': cid, 'name': name, **({'local': d['name'].split(' ', 1)[1]} if name != d['name'] else {}),
                      'price': int(d['price'].replace(',', '').replace(' IQD', '')), 'cup': cup, 'make': make, **({'look': look} if look else {})})
items.append({'id': 900, 'cat': 'sweets', 'name': 'Cookies', 'price': 3000, 'cup': 'cookie', 'make': []})
# the photos: one picture of cells (160 px), the item's cell its place in `items`
S, COLS = 192, 8
rows = (len(items) + COLS - 1) // COLS
atlas = Image.new('RGB', (S * COLS, S * rows), '#f9f9ef')
for i, it in enumerate(items):
    if it['id'] == 900:
        im = Image.new('RGBA', (400, 400), (0, 0, 0, 0)); g = ImageDraw.Draw(im)
        for k, (ox, oy) in enumerate([(60, 150), (150, 70), (180, 170)]):
            g.ellipse((ox, oy, ox + 180, oy + 180), fill='#c68a4c', outline='#a86d35', width=6)
            for (cx, cy) in [(40, 60), (110, 50), (80, 110), (130, 120), (55, 135)]:
                g.ellipse((ox + cx, oy + cy, ox + cx + 22, oy + cy + 18), fill='#3b2216')
    else:
        im = photo(web[it['id']])
        im = im.crop(im.split()[3].point(lambda a: 255 if a > 30 else 0).getbbox())
    im.thumbnail((S - 16, S - 16), Image.LANCZOS)
    x, y = (i % COLS) * S, (i // COLS) * S
    atlas.paste(im, (x + (S - im.width) // 2, y + (S - im.height) // 2), im)
    it['photo'] = i
atlas.save(os.path.join(HERE, 'photos.jpg'), quality=82, optimize=True, progressive=True)
out = {
  'source': 'KOUP Azadi (Azadi hospital) online menu, https://koupofficial.com/azadi, read 2026-11-24; cookies from the printed menu',
  'currency': 'IQD', 'cell': S, 'cols': COLS,
  'categories': cats, 'bottles': {k: {'label': v[0], 'color': v[1], 'shape': v[2]} for k, v in BOTTLES.items()}, 'items': items,
}
open(os.path.join(OUT, 'menu.json'), 'w').write(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
print(len(items), 'items', len(cats), 'cats')
