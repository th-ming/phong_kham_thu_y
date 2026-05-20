import sys
from pathlib import Path
sys.path.append('d:/QLy Phòng Khám Thú Y/.agent/skills/seo-fundamentals/scripts')
from seo_checker import find_pages
pages = find_pages(Path('d:/QLy Phòng Khám Thú Y'))
for p in pages:
    if p.name == 'index.html':
        print(p)
