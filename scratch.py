import sys
from pathlib import Path
sys.path.append('d:/QLy Phòng Khám Thú Y/.agent/skills/seo-fundamentals/scripts')
from seo_checker import check_page
print(check_page(Path('d:/QLy Phòng Khám Thú Y/Frontend/index.html')))
