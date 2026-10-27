"""Subset the licensed Gowun Batang source for the invitation's fixed copy.

Usage: python scripts/build-love-font.py /path/to/GowunBatang-Regular.ttf
Requires fonttools and brotli. Run again when the invitation copy changes.
"""

from pathlib import Path
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
text = "".join(path.read_text(encoding="utf-8") for path in (root / "app/love").glob("*.tsx"))
characters = set(map(ord, text)) | set(range(32, 127))
font = TTFont(sys.argv[1])
options = subset.Options()
options.flavor = "woff2"
options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
options.name_legacy = True
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=characters)
subsetter.subset(font)
font.flavor = "woff2"
destination = root / "public/love/fonts/GowunBatang-Regular.woff2"
font.save(destination)
print(f"Saved {destination.name}: {destination.stat().st_size:,} bytes")
