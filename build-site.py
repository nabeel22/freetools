"""Build static pages and regenerate sitemap on every Cloudflare deployment."""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
from urllib.parse import quote
import re
import shutil
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'site-dist'
ORIGIN = 'https://www.freetools.kianimotions.com'

class Metadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.noindex = False
        self.redirect = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta':
            if attrs.get('name', '').lower() in ('robots', 'googlebot'):
                self.noindex |= 'noindex' in attrs.get('content', '').lower()
            self.redirect |= attrs.get('http-equiv', '').lower() == 'refresh'

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()
for item in ROOT.iterdir():
    if item.name.startswith('.') or item.name in ('site-dist', 'build-site.py', 'node_modules', '__pycache__'):
        continue
    if item.is_dir():
        shutil.copytree(item, OUT / item.name)
    else:
        shutil.copy2(item, OUT / item.name)

urls = []
headers = []
for page in sorted(OUT.rglob('*.html')):
    rel = page.relative_to(OUT).as_posix()
    if page.name == '404.html' or any(p.startswith('.') or p in ('404', '_not-found', 'node_modules') for p in page.relative_to(OUT).parts):
        continue
    content = page.read_text(encoding='utf-8')
    metadata = Metadata()
    metadata.feed(content)
    if metadata.noindex or metadata.redirect:
        continue
    route = '/' if rel == 'index.html' else '/' + (rel[:-10] if rel.endswith('/index.html') else rel[:-5])
    url = ORIGIN + quote(route, safe='/~!$&\'()*+,;=:@-._')
    if not re.search(r'</head\s*>', content, re.I):
        raise ValueError(f'Missing head in {rel}')
    content = re.sub(r'<link\b(?=[^>]*\brel=[\"\']canonical[\"\'])[^>]*>', '', content, flags=re.I)
    content = re.sub(r'</head\s*>', '<link rel="canonical" href="' + escape(url, quote=True) + '">\n</head>', content, count=1, flags=re.I)
    page.write_text(content, encoding='utf-8')
    urls.append(url)
    for alias in sorted({route, '/' + rel, route.rstrip('/') or '/'}):
        headers.append(alias + '\n  Link: <' + url + '>; rel="canonical"\n')

assert urls and len(urls) == len(set(urls)), 'Missing pages or duplicate routes'
ns = 'http://www.sitemaps.org/schemas/sitemap/0.9'
ET.register_namespace('', ns)
sitemap = ET.Element('{' + ns + '}urlset')
for url in sorted(urls):
    ET.SubElement(ET.SubElement(sitemap, '{' + ns + '}url'), '{' + ns + '}loc').text = url
ET.ElementTree(sitemap).write(OUT / 'sitemap.xml', encoding='utf-8', xml_declaration=True)
(OUT / 'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: ' + ORIGIN + '/sitemap.xml\n', encoding='utf-8')
header_path = OUT / '_headers'
existing = header_path.read_text(encoding='utf-8') if header_path.exists() else ''
header_path.write_text(existing + '\n' + '\n'.join(headers), encoding='utf-8')
print(f'Generated sitemap and canonical URLs for {len(urls)} public pages')
