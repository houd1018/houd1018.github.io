---
name: sync-media
description: 'Clean, upload and verify site media (images, GIFs, videos, PDFs) on Cloudflare R2. Use when adding new media files, re-cleaning WordPress uploads, syncing cleaned_media/ to the R2 bucket houd1018-media, or checking that media URLs load from MEDIA_BASE_URL.'
argument-hint: 'What to sync, e.g. "new files in cleaned_media/projects/my-slug" or "re-clean WordPress uploads"'
---

# Sync media to Cloudflare R2

Media never goes into Git. It lives in `cleaned_media/` locally (git-ignored) and in the R2 bucket, and pages load it through `MEDIA_BASE_URL` in `config.js`.

| Item | Value |
|---|---|
| Local media root | `cleaned_media/` (git-ignored) |
| R2 bucket | `houd1018-media` |
| rclone remote | `r2` (configured by the user with their own API token; never ask for or print keys) |
| Public base URL | `https://pub-af66391f274d47529898def605b4df9a.r2.dev/` (`MEDIA_BASE_URL_REMOTE` in `config.js`) |
| Library layout | `YYYY/MM/<file>` (WordPress), `blog/pic/<file>` (old blog), `projects/<slug>/<file>`, `blog/<slug>/<file>` |

## A. Add new media (most common)

1. Put the files in `cleaned_media/projects/<slug>/` or `cleaned_media/blog/<slug>/`. Prefer short `.mp4` over very large GIFs.
2. Upload (copy never deletes remote files):
   ```powershell
   rclone copy cleaned_media r2:houd1018-media --exclude _manifest.json --transfers 8 --progress
   ```
3. Verify:
   ```powershell
   rclone check cleaned_media r2:houd1018-media --exclude _manifest.json --one-way --size-only
   ```
   and `Invoke-WebRequest -Method Head` one new file through the public base URL (URL-encode spaces / CJK characters).

If `rclone` is not recognized, refresh PATH: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`.
If `rclone listremotes` shows no `r2:`, tell the user to run (typing their keys themselves):
`rclone config create r2 s3 provider=Cloudflare access_key_id=<KEY> secret_access_key=<SECRET> endpoint=https://b570c45694c1550d54fc29ff56e91452.r2.cloudflarestorage.com acl=private no_check_bucket=true`

## B. Re-clean the WordPress uploads (rare)

Source: `portfolio_Legacy/uploads/` (local only). Script: [scripts/clean_uploads.py](../../../scripts/clean_uploads.py).

1. Dry run and review the report (kept / dropped thumbnails / duplicates / skipped plugin folders):
   ```powershell
   python scripts/clean_uploads.py --extra _legacy_backup/assets/pic:blog/pic --dry-run
   ```
2. Run without `--dry-run`. It syncs incrementally and writes `cleaned_media/_manifest.json` (`redirects`: thumbnail → master), which `scripts/migrate_wp_subpages.py` uses.
3. Use `--prune` only when the user explicitly asks. Then upload with step A.2.

## Rules

- Never `git add` media, `cleaned_media/`, or `uploads/`. Never modify files in `portfolio_Legacy/uploads/`.
- Reference master files only (no `-150x150`, `-scaled`, `-e<timestamp>`).
- Never run `rclone sync` or `rclone delete` against the bucket without explicit confirmation.
