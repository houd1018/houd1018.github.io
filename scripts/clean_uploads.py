#!/usr/bin/env python3
"""Clean a WordPress ``uploads/`` library into ``cleaned_media/`` for CDN hosting.

What it does
------------
* Scans only the WordPress media library folders ``YYYY/MM/`` (plugin folders such as
  ``elementor/``, ``wpforms/``, ``ast-block-templates-json/`` are skipped and reported).
* Drops WordPress-generated derivatives when a master exists in the same group:
    - resized thumbnails  ``name-150x150.jpg``, ``name-300x169.png``, ``name-1024x576.gif`` ...
    - big-image copies    ``name-scaled.jpg``
    - editor crops        ``name-e1710660781451.gif``
  If no unsuffixed master exists, the best candidate (``-scaled`` > edited > largest size) is kept.
* Always keeps masters, every GIF master, every video (.mp4/.mov/.webm/.m4v) and every PDF.
* Deduplicates byte-identical masters (SHA-256, only for files with equal size).
* Incrementally syncs kept files to the destination (unchanged files are skipped).
* Optionally copies extra folders as-is (e.g. old blog images ``assets/pic`` -> ``blog/pic``).
* Writes ``<dest>/_manifest.json`` with the kept file list and a ``redirects`` map
  (dropped path -> kept path) used by the migration scripts to rewrite references.

Source files are never modified or deleted.

Examples
--------
    python scripts/clean_uploads.py --dry-run
    python scripts/clean_uploads.py --extra assets/pic:blog/pic
    python scripts/clean_uploads.py --keep-gif-variants --verbose --dry-run
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = REPO_ROOT / "portfolio_Legacy" / "uploads"
DEFAULT_DEST = REPO_ROOT / "cleaned_media"
MANIFEST_NAME = "_manifest.json"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".bmp"}
VIDEO_EXTS = {".mp4", ".mov", ".webm", ".m4v"}
DOC_EXTS = {".pdf"}
MEDIA_EXTS = IMAGE_EXTS | VIDEO_EXTS | DOC_EXTS
# Never treated as derivatives (WordPress does not resize them).
ALWAYS_KEEP_EXTS = VIDEO_EXTS | DOC_EXTS

YEAR_RE = re.compile(r"^\d{4}$")
MONTH_RE = re.compile(r"^\d{2}$")
SIZE_RE = re.compile(r"-(\d{1,5})x(\d{1,5})$")
EDIT_RE = re.compile(r"-e\d{10,13}$")
SCALED_RE = re.compile(r"-scaled$")
IGNORED_NAMES = {"thumbs.db", "desktop.ini", ".ds_store"}

HASH_CHUNK = 1024 * 1024


class MediaFile:
    __slots__ = ("path", "rel", "size", "mtime", "canonical", "kinds", "area")

    def __init__(self, path: Path, rel: str) -> None:
        stat = path.stat()
        self.path = path
        self.rel = rel
        self.size = stat.st_size
        self.mtime = stat.st_mtime
        self.canonical, self.kinds, self.area = parse_variant(path.stem)

    @property
    def ext(self) -> str:
        return self.path.suffix.lower()

    @property
    def is_derivative(self) -> bool:
        return bool(self.kinds)


def parse_variant(stem: str) -> Tuple[str, Tuple[str, ...], int]:
    """Strip WP derivative suffixes. Returns (canonical stem, suffix kinds, pixel area of size suffix)."""
    kinds: List[str] = []
    area = 0
    changed = True
    while changed:
        changed = False
        m = SIZE_RE.search(stem)
        if m and m.start() > 0:
            if not area:
                area = int(m.group(1)) * int(m.group(2))
            stem = stem[: m.start()]
            kinds.append("size")
            changed = True
            continue
        for kind, pattern in (("edit", EDIT_RE), ("scaled", SCALED_RE)):
            m = pattern.search(stem)
            if m and m.start() > 0:
                stem = stem[: m.start()]
                kinds.append(kind)
                changed = True
                break
    return stem, tuple(kinds), area


def human(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if abs(n) < 1024 or unit == "GB":
            return f"{n:.1f} {unit}" if unit != "B" else f"{int(n)} B"
        n /= 1024
    return f"{n:.1f} GB"


def is_ignored(path: Path) -> bool:
    return path.name.lower() in IGNORED_NAMES or path.name.startswith(".")


def iter_library_dirs(src: Path) -> Tuple[List[Path], List[str]]:
    """Return (YYYY/MM dirs, skipped top-level entries)."""
    month_dirs: List[Path] = []
    skipped: List[str] = []
    for top in sorted(src.iterdir()):
        if top.is_dir() and YEAR_RE.match(top.name):
            for month in sorted(top.iterdir()):
                if month.is_dir() and MONTH_RE.match(month.name):
                    month_dirs.append(month)
                else:
                    skipped.append(month.relative_to(src).as_posix())
        else:
            skipped.append(top.name + ("/" if top.is_dir() else ""))
    return month_dirs, skipped


def collect(src: Path, month_dirs: Iterable[Path]) -> Tuple[List[MediaFile], Counter]:
    files: List[MediaFile] = []
    ignored: Counter = Counter()
    for month in month_dirs:
        for path in sorted(month.rglob("*")):
            if not path.is_file() or is_ignored(path):
                continue
            if path.suffix.lower() not in MEDIA_EXTS:
                ignored[path.suffix.lower() or "<none>"] += 1
                continue
            files.append(MediaFile(path, path.relative_to(src).as_posix()))
    return files, ignored


def pick_master(group: List[MediaFile]) -> MediaFile:
    originals = [f for f in group if not f.is_derivative]
    if originals:
        return max(originals, key=lambda f: f.size)

    def rank(f: MediaFile) -> Tuple[int, int, int]:
        no_size = "size" not in f.kinds
        scaled = "scaled" in f.kinds
        return (int(no_size) * 2 + int(scaled), f.area, f.size)

    return max(group, key=rank)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(HASH_CHUNK), b""):
            h.update(chunk)
    return h.hexdigest()


def plan_library(
    files: List[MediaFile],
    keep_gif_variants: bool,
    keep_edited: bool,
    hash_dedupe: bool,
) -> Tuple[List[MediaFile], Dict[str, str], Dict[str, str]]:
    """Return (kept files, derivative redirects, duplicate redirects)."""
    groups: Dict[Tuple[str, str, str], List[MediaFile]] = defaultdict(list)
    kept: List[MediaFile] = []

    for f in files:
        if f.ext in ALWAYS_KEEP_EXTS:
            kept.append(f)
        else:
            parent = f.rel.rsplit("/", 1)[0]
            groups[(parent, f.canonical.lower(), f.ext)].append(f)

    derivative_redirects: Dict[str, str] = {}
    for group in groups.values():
        master = pick_master(group)
        kept.append(master)
        for f in group:
            if f is master:
                continue
            if (keep_gif_variants and f.ext == ".gif") or (
                keep_edited and f.kinds == ("edit",)
            ):
                kept.append(f)
            else:
                derivative_redirects[f.rel] = master.rel

    duplicate_redirects: Dict[str, str] = {}
    if hash_dedupe:
        by_size: Dict[int, List[MediaFile]] = defaultdict(list)
        for f in kept:
            by_size[f.size].append(f)
        drop: set = set()
        for same_size in by_size.values():
            if len(same_size) < 2:
                continue
            by_hash: Dict[str, List[MediaFile]] = defaultdict(list)
            for f in same_size:
                by_hash[sha256(f.path)].append(f)
            for dupes in by_hash.values():
                if len(dupes) < 2:
                    continue
                dupes.sort(key=lambda f: f.rel)
                for f in dupes[1:]:
                    duplicate_redirects[f.rel] = dupes[0].rel
                    drop.add(f.rel)
        kept = [f for f in kept if f.rel not in drop]
        for derived, target in list(derivative_redirects.items()):
            derivative_redirects[derived] = duplicate_redirects.get(target, target)

    kept.sort(key=lambda f: f.rel)
    return kept, derivative_redirects, duplicate_redirects


def parse_extra(value: str) -> Tuple[Path, str]:
    if ":" not in value or value.rfind(":") <= 1:
        raise argparse.ArgumentTypeError("expected SRC:PREFIX, e.g. assets/pic:blog/pic")
    src, prefix = value.rsplit(":", 1)
    path = Path(src)
    if not path.is_absolute():
        path = REPO_ROOT / path
    prefix = prefix.strip("/\\").replace("\\", "/")
    if not prefix or ".." in prefix.split("/"):
        raise argparse.ArgumentTypeError(f"invalid prefix: {prefix!r}")
    return path, prefix


def collect_extra(src: Path, prefix: str) -> List[Tuple[Path, str]]:
    items: List[Tuple[Path, str]] = []
    for path in sorted(src.rglob("*")):
        if path.is_file() and not is_ignored(path) and path.suffix.lower() in MEDIA_EXTS:
            items.append((path, f"{prefix}/{path.relative_to(src).as_posix()}"))
    return items


def needs_copy(src: Path, dst: Path) -> bool:
    if not dst.exists():
        return True
    s, d = src.stat(), dst.stat()
    return s.st_size != d.st_size or int(s.st_mtime) > int(d.st_mtime)


def ensure_utf8_stdout() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
        except (AttributeError, ValueError):
            pass


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Remove WordPress thumbnails/duplicates and sync media into cleaned_media/.",
    )
    p.add_argument("--src", type=Path, default=DEFAULT_SRC, help=f"WordPress uploads dir (default: {DEFAULT_SRC.relative_to(REPO_ROOT)})")
    p.add_argument("--dest", type=Path, default=DEFAULT_DEST, help=f"output dir (default: {DEFAULT_DEST.relative_to(REPO_ROOT)})")
    p.add_argument("--extra", type=parse_extra, action="append", default=[], metavar="SRC:PREFIX",
                   help="copy another folder as-is under PREFIX, e.g. assets/pic:blog/pic (repeatable)")
    p.add_argument("--dry-run", action="store_true", help="report only, write nothing")
    p.add_argument("--keep-gif-variants", action="store_true", help="also keep resized/edited GIF derivatives")
    p.add_argument("--keep-edited", action="store_true", help="keep WP editor crops (-e<timestamp>) as separate files")
    p.add_argument("--no-hash-dedupe", action="store_true", help="skip SHA-256 duplicate detection")
    p.add_argument("--prune", action="store_true", help="delete files in DEST that are no longer part of the plan")
    p.add_argument("--verbose", "-v", action="store_true", help="list every dropped file")
    return p


def main(argv: Optional[List[str]] = None) -> int:
    ensure_utf8_stdout()
    args = build_parser().parse_args(argv)

    src: Path = (args.src if args.src.is_absolute() else Path.cwd() / args.src).resolve()
    dest: Path = (args.dest if args.dest.is_absolute() else Path.cwd() / args.dest).resolve()

    if not src.is_dir():
        print(f"[error] source not found: {src}", file=sys.stderr)
        return 2
    if dest == src or src in dest.parents or dest in src.parents:
        print("[error] --dest must not be inside --src (or vice versa)", file=sys.stderr)
        return 2
    for extra_src, _ in args.extra:
        if not extra_src.is_dir():
            print(f"[error] extra source not found: {extra_src}", file=sys.stderr)
            return 2

    print(f"Source : {src}")
    print(f"Dest   : {dest}")
    print(f"Mode   : {'DRY RUN' if args.dry_run else 'WRITE'}\n")

    month_dirs, skipped_dirs = iter_library_dirs(src)
    files, ignored_exts = collect(src, month_dirs)
    if not args.no_hash_dedupe:
        print("Hashing same-size files for duplicate detection...\n", flush=True)
    kept, derivative_redirects, duplicate_redirects = plan_library(
        files,
        keep_gif_variants=args.keep_gif_variants,
        keep_edited=args.keep_edited,
        hash_dedupe=not args.no_hash_dedupe,
    )

    # (source path, destination-relative path)
    plan: List[Tuple[Path, str]] = [(f.path, f.rel) for f in kept]
    for extra_src, prefix in args.extra:
        plan.extend(collect_extra(extra_src, prefix))

    dest_rels = {rel for _, rel in plan}
    if len(dest_rels) != len(plan):
        print("[error] destination path collision between library and --extra folders", file=sys.stderr)
        return 2

    # --- Report -----------------------------------------------------------
    by_rel = {f.rel: f for f in files}
    scanned_bytes = sum(f.size for f in files)
    kept_lib_bytes = sum(f.size for f in kept)
    deriv_bytes = sum(by_rel[r].size for r in derivative_redirects)
    dup_bytes = sum(by_rel[r].size for r in duplicate_redirects)
    kept_by_ext = Counter(f.ext for f in kept)

    print("=== WordPress library ===")
    print(f"Month folders scanned : {len(month_dirs)}")
    print(f"Media files scanned   : {len(files):>6}  ({human(scanned_bytes)})")
    print(f"Kept (masters)        : {len(kept):>6}  ({human(kept_lib_bytes)})")
    print(f"Dropped derivatives   : {len(derivative_redirects):>6}  ({human(deriv_bytes)})")
    print(f"Dropped duplicates    : {len(duplicate_redirects):>6}  ({human(dup_bytes)})")
    print("Kept by type          : " + ", ".join(f"{ext}={n}" for ext, n in sorted(kept_by_ext.items())))
    if ignored_exts:
        print("Ignored non-media     : " + ", ".join(f"{ext}={n}" for ext, n in sorted(ignored_exts.items())))
    if skipped_dirs:
        print("Skipped (not YYYY/MM) : " + ", ".join(skipped_dirs))
    for extra_src, prefix in args.extra:
        count = sum(1 for _, rel in plan if rel.startswith(prefix + "/"))
        print(f"Extra {extra_src.name} -> {prefix}/ : {count} files")

    if args.verbose:
        print("\n--- Dropped derivatives ---")
        for derived, target in sorted(derivative_redirects.items()):
            print(f"  {derived}  ->  {target}")
        print("\n--- Dropped duplicates ---")
        for dup, target in sorted(duplicate_redirects.items()):
            print(f"  {dup}  ==  {target}")
    else:
        sample = sorted(derivative_redirects.items())[:10]
        if sample:
            print("\nSample redirects (use --verbose for all):")
            for derived, target in sample:
                print(f"  {derived}  ->  {target}")

    # --- Sync -------------------------------------------------------------
    to_copy = [(s, rel) for s, rel in plan if needs_copy(s, dest / rel)]
    copy_bytes = sum(s.stat().st_size for s, _ in to_copy)
    print(f"\nTo copy : {len(to_copy)} files ({human(copy_bytes)}), up to date: {len(plan) - len(to_copy)}")

    stale: List[Path] = []
    if dest.is_dir():
        for path in dest.rglob("*"):
            if path.is_file() and path.name != MANIFEST_NAME:
                if path.relative_to(dest).as_posix() not in dest_rels:
                    stale.append(path)
    if stale:
        action = "will delete" if args.prune else "not in plan (use --prune to delete)"
        print(f"Stale in dest: {len(stale)} files, {action}")

    if args.dry_run:
        print("\nDry run complete. Nothing was written.")
        return 0

    for i, (s, rel) in enumerate(to_copy, 1):
        target = dest / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(s, target)
        if i % 200 == 0 or i == len(to_copy):
            print(f"  copied {i}/{len(to_copy)}", flush=True)

    if args.prune:
        for path in stale:
            path.unlink()
        for d in sorted((p for p in dest.rglob("*") if p.is_dir()), key=lambda p: len(p.parts), reverse=True):
            if not any(d.iterdir()):
                d.rmdir()

    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": src.as_posix(),
        "options": {
            "keep_gif_variants": args.keep_gif_variants,
            "keep_edited": args.keep_edited,
            "hash_dedupe": not args.no_hash_dedupe,
            "extra": [f"{p.as_posix()}:{prefix}" for p, prefix in args.extra],
        },
        "stats": {
            "scanned": len(files),
            "scanned_bytes": scanned_bytes,
            "kept": len(plan),
            "kept_bytes": sum(s.stat().st_size for s, _ in plan),
            "dropped_derivatives": len(derivative_redirects),
            "dropped_duplicates": len(duplicate_redirects),
        },
        "files": sorted(dest_rels),
        "redirects": dict(sorted({**derivative_redirects, **duplicate_redirects}.items())),
    }
    dest.mkdir(parents=True, exist_ok=True)
    (dest / MANIFEST_NAME).write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDone. Manifest written to {(dest / MANIFEST_NAME)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
