---
mode: 'agent'
description: 'Clean WordPress uploads: drop thumbnails/derivatives, dedupe, and sync into cleaned_media/'
---

# /clean-media — WordPress media cleanup and sync

Goal: run [scripts/clean_uploads.py](../../scripts/clean_uploads.py) to clean the media in `portfolio_Legacy/uploads/` and sync it into `cleaned_media/`, generating `cleaned_media/_manifest.json` (with a `redirects` map from derivative → master for the migration scripts).

Source folder: ${input:src:portfolio_Legacy/uploads}

## Steps

1. Confirm `.gitignore` ignores `uploads/` and `cleaned_media/`; add them if missing.
2. Dry run first (writes nothing):
   ```powershell
   python scripts/clean_uploads.py --src "${input:src:portfolio_Legacy/uploads}" --extra assets/pic:blog/pic --dry-run
   ```
3. Report: files/size scanned, files/size kept, thumbnails dropped, duplicates dropped, skipped non-media folders, and space saved. Show 10 representative "dropped → master" samples for me to verify.
4. After I confirm, run for real (without `--dry-run`). The sync is incremental; unchanged files are skipped.
5. Use `--prune` only if I explicitly ask (it deletes stale files from `cleaned_media/`).
6. When finished, remind me to upload `cleaned_media/` to Cloudflare R2 (e.g. `rclone sync cleaned_media r2:<bucket> --progress`) and set `MEDIA_BASE_URL_REMOTE` in `config.js`.

## Constraints

- Never modify or delete files in the source `uploads/`.
- Master images, GIF masters, all `.mp4/.mov/.webm` videos and PDFs must be kept.
- Never `git add` any media files.
