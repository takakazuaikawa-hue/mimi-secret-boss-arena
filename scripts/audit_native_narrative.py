from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "src" / "narrative" / "content"
PUBLIC_DIR = ROOT / "public"


class DuplicateKeyError(ValueError):
    pass


def reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise DuplicateKeyError(key)
        result[key] = value
    return result


def collect_definition_ids(value: Any, output: list[str]) -> None:
    if isinstance(value, dict):
        identifier = value.get("id")
        if isinstance(identifier, str):
            output.append(identifier)
        for child in value.values():
            collect_definition_ids(child, output)
    elif isinstance(value, list):
        for child in value:
            collect_definition_ids(child, output)


def main() -> int:
    files = sorted(CONTENT_DIR.glob("*.json"))
    duplicate_keys: list[str] = []
    parse_errors: list[str] = []
    definition_ids: list[str] = []
    asset_paths: set[str] = set()

    for path in files:
        try:
            block = json.loads(
                path.read_text(encoding="utf-8"),
                object_pairs_hook=reject_duplicate_keys,
            )
        except DuplicateKeyError as error:
            duplicate_keys.append(f"{path.name}: {error}")
            continue
        except (OSError, json.JSONDecodeError) as error:
            parse_errors.append(f"{path.name}: {error}")
            continue

        collect_definition_ids(block, definition_ids)
        for asset in block.get("presentation", {}).get("assets", []):
            asset_path = asset.get("path")
            if isinstance(asset_path, str):
                asset_paths.add(asset_path)

    duplicate_ids = sorted(
        identifier
        for identifier, count in Counter(definition_ids).items()
        if count > 1
    )
    missing_assets: list[str] = []
    broken_assets: list[str] = []

    for asset_path in sorted(asset_paths):
        path = PUBLIC_DIR / asset_path.lstrip("/")
        if not path.is_file():
            missing_assets.append(asset_path)
            continue
        try:
            with Image.open(path) as image:
                image.load()
        except Exception as error:  # Pillow reports decoder-specific subclasses.
            broken_assets.append(f"{asset_path}: {error}")

    print(f"formal_blocks={len(files)}")
    print(f"definition_ids={len(definition_ids)}")
    print(f"unique_assets={len(asset_paths)}")
    print(f"duplicate_json_keys={len(duplicate_keys)}")
    print(f"parse_errors={len(parse_errors)}")
    print(f"duplicate_ids={len(duplicate_ids)}")
    print(f"missing_assets={len(missing_assets)}")
    print(f"broken_assets={len(broken_assets)}")

    problems = duplicate_keys + parse_errors + duplicate_ids + missing_assets + broken_assets
    if problems:
        for problem in problems:
            print(problem, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
