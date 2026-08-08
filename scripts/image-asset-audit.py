import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "public" / "assets"
IMAGE_SUFFIXES = {".png", ".webp", ".jpg", ".jpeg"}


def project_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


images = []
failures = []

for path in sorted(
    item
    for item in ASSET_ROOT.rglob("*")
    if item.is_file() and item.suffix.lower() in IMAGE_SUFFIXES
):
    try:
        with Image.open(path) as image:
            width, height = image.size
            alpha_bbox = None
            bottom_clipped = False
            if "A" in image.getbands():
                alpha = image.getchannel("A")
                alpha_bbox = alpha.getbbox()
                bottom_clipped = bool(alpha_bbox and alpha_bbox[3] >= height)
            images.append(
                {
                    "path": project_path(path),
                    "width": width,
                    "height": height,
                    "bytes": path.stat().st_size,
                    "mode": image.mode,
                    "alphaBbox": alpha_bbox,
                    "bottomClipped": bottom_clipped,
                }
            )
    except Exception as error:  # Audit output must retain every unreadable asset.
        failures.append({"path": project_path(path), "error": str(error)})

sprites = [
    image
    for image in images
    if image["path"].startswith("public/assets/story/sprites/")
]
dimension_counts = {}
for image in images:
    key = f'{image["width"]}x{image["height"]}'
    dimension_counts[key] = dimension_counts.get(key, 0) + 1

report = {
    "images": len(images),
    "totalBytes": sum(image["bytes"] for image in images),
    "dimensionCounts": dict(
        sorted(
            dimension_counts.items(),
            key=lambda item: (-item[1], item[0]),
        )
    ),
    "oversized": [
        image
        for image in sorted(images, key=lambda item: item["bytes"], reverse=True)
        if image["bytes"] >= 2_000_000
    ],
    "sprites": sprites,
    "spritesTouchingBottom": [
        image["path"] for image in sprites if image["bottomClipped"]
    ],
    "failures": failures,
}

print(json.dumps(report, ensure_ascii=False, indent=2))
