#!/usr/bin/env python3
"""Nxjerr path-et e 66 tregjeve + XK nga BlankMap-World6.svg (Wikimedia, public domain)
ne nje modul TS: Record<ISO2, string> (nen-path-et bashkohen)."""
import re, sys
import xml.etree.ElementTree as ET

CODES = ['za','sa','ar','au','at','be','ba','br','bg','dk','eg','ae','ee','fi','fr','gh','de','gr','nl','hu','in','id','ie','is','it','il','jp','ca','qa','ke','cl','cn','kr','hr','kw','lv','lt','lu','my','me','mt','mk','ma','gb','mx','md','ng','no','pl','pt','cy','ro','rs','al','us','sg','sk','si','es','se','th','tr','vn','nz','ch','cz','xk']

svg = open('/root/worldmap.svg', encoding='utf-8').read()
# hiq namespace per ET te thjeshte
svg = re.sub(r'xmlns="[^"]+"', '', svg, count=1)
root = ET.fromstring(svg)

found = {}
def walk(el):
    eid = el.get('id', '')
    if eid in CODES:
        ds = []
        if el.tag.endswith('path') and el.get('d'):
            ds.append(el.get('d'))
        for p in el.iter():
            if p is not el and p.tag.endswith('path') and p.get('d'):
                ds.append(p.get('d'))
        if ds:
            found[eid] = ' '.join(ds)
        return  # mos zbrit me thelle brenda nje vendi
    for c in list(el):
        walk(c)
walk(root)

missing = [c for c in CODES if c not in found]
print(f'found={len(found)} missing={missing}', file=sys.stderr)

out = ['// Path-et gjeografike te 66 tregjeve + Kosoves (XK), nxjerre nga BlankMap-World6.svg',
       '// (Wikimedia Commons, public domain). Koordinatat: kanavace 2754x1398, projeksion i hartes origjinale.',
       '// Regjenerohet me scripts/extract_paths.py mbi SVG-ne burimore.',
       'export const WORLD_VIEWBOX = "0 0 2754 1398"',
       'export const WORLD_PATHS: Record<string, string> = {']
for code in sorted(found):
    d = found[code].replace('\\n', ' ').replace('"', '')
    out.append(f'  {code.upper()}: "{d}",')
out.append('}')
open('/root/world-paths.ts', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('written /root/world-paths.ts', file=sys.stderr)

# XK: i mbivendosur brenda grupit te Serbise — nxirret vecmas, vetem path-et e tokes
if 'xk' not in found:
    for el in root.iter():
        if el.get('id') == 'xk':
            ds = []
            for p in el.iter():
                if p.tag.endswith('path') and p.get('d'):
                    ds.append(p.get('d'))
            if ds:
                found['xk'] = ' '.join(ds)
            break
    print(f"xk retry: {'ok' if 'xk' in found else 'STILL MISSING'}", file=sys.stderr)
    # rishkruaj daljen
    out = ['// Path-et gjeografike te 66 tregjeve + Kosoves (XK), nxjerre nga BlankMap-World6.svg',
           '// (Wikimedia Commons, public domain). Koordinatat: kanavace 2754x1398.',
           '// Regjenerohet me scripts/extract_paths.py mbi SVG-ne burimore.',
           'export const WORLD_VIEWBOX = "0 0 2754 1398"',
           'export const WORLD_PATHS: Record<string, string> = {']
    for code in sorted(found):
        d = found[code].replace('\n', ' ').replace('"', '')
        out.append(f'  {code.upper()}: "{d}",')
    out.append('}')
    open('/root/world-paths.ts', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('rewritten', file=sys.stderr)
