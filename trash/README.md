# Trash Archive

This folder keeps retired code, generated artifacts, scratch files, and original assets that should not clutter the active repository structure.

## Current Buckets

- `src-legacy/` - older source files replaced by the current implementation.
- `src-unused/` - source files that were present in `src/` but had no active imports at the time of cleanup.
- `public-legacy/` - retired public assets.
- `root-scratch/` - root-level scratch files, logs, one-off scripts, and temporary diagnostics.
- `generated/` - generated build output that can be recreated from source.
- `media-originals/` - original media files whose active runtime copies live elsewhere.
- `logs/` - local runtime logs.

Do not import runtime code from this folder. If a file is restored, move it back into the active source tree and run the relevant build/registry checks.
