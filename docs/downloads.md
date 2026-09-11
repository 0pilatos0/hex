# Download Hosting

## Public Paths

```ts
hex.kitlangton.dev                         // versioned links and platform requirements
├── downloads.hex.kitlangton.dev           // direct R2 Custom Domain; no redirect
│   ├── releases/HEX-<version>-arm64.dmg
│   ├── releases/HEX-<version>-arm64.zip    // signed Sparkle artifact
│   ├── releases/HEX-latest-arm64.dmg      // mutable pointer; no-cache
│   └── appcast.xml                       // mutable pointer; published last
└── github.com/anomalyco/hex
    └── releases/download/app-v<version>/HEX-<version>-arm64.dmg
```

The `hex-releases` bucket retains its existing `r2.dev` public endpoint so older
Rust installations can still fetch the feed. The current appcast's enclosure
URLs use the custom hostname. No legacy Swift feed is involved.

The download hostname has active TLS with minimum TLS 1.2. A Cloudflare
Configuration Rule disables **Browser Integrity Check** only for
`http.host eq "downloads.hex.kitlangton.dev"`. This is public file hosting for
browser and non-browser clients: the inherited zone check returned HTTP 403,
error 1010, for Python's default user agent. The host-specific rule restored
HTTP 200 without changing the zone-wide setting. Keep future browser challenges
off download and updater routes.

`scripts/release-app.sh publish` uploads and reads back the R2 DMG and ZIP, then
calls `scripts/publish-app-mirror.sh`. The mirror starts as a draft, verifies
the uploaded DMG, publishes with `--latest=false`, and verifies an unauthenticated
download. Existing assets must match byte-for-byte; they are never clobbered.
Only then does the publisher move the latest DMG and publish the appcast.
App tags remain separate from TypeScript SDK tags; do not use GitHub's generic
`releases/latest` redirect for an app download.

After each macOS publication, update the site's `MAC_VERSION`, the README's
explicit app mirror link, and `anomalyco/homebrew-tap/Casks/hex.rb`. Deploy the
site using its checked-in Wrangler config and verify both rendered links.

## Network Recovery

App and model downloads have different hosts. Managed networks may need to allow:

- `downloads.hex.kitlangton.dev` for app artifacts and feeds.
- GitHub release downloads and their asset delivery host for the alternative DMG.
- `huggingface.co` and its model download CDN for dictation-model setup.
- `download.moonshine.ai` for optional Voice Commands.

If the old update endpoint is blocked, install the new signed DMG manually.
After restoring model-host access, retry preparation in Settings or choose
Retry for Commands. Transfer failures preserve partial downloads. App download
success does not establish model-host reachability, and our external checks do
not establish access from a particular enterprise network.

## Observed Migration Checks — September 11, 2026

- The initial 2.1.16 mirror and custom-domain DMG matched the published Homebrew
  SHA-256: `102dc1a8d80dc359ee15a30141957b6a311e581214b44a3c615026fa91288b8a`.
  Its notarization staple validated.
- All five retained Sparkle ZIPs (2.1.12–2.1.16) were fetched directly through
  the custom domain, compared to the prepared artifacts, checked against the
  feed's lengths, and verified with the app's Ed25519 public key.
- The migration changed only feed hostnames and terminal whitespace; versions,
  signatures, lengths, and release notes were preserved. The published feed was
  read back identically from both the custom host and old R2 endpoint.
- The live website was rendered and inspected at 1280×900 and 390×844. Both
  showed the version, requirements, and alternate link.
- Homebrew's cask and livecheck use the custom hostname; the 2.1.16 checksum
  stayed unchanged during the host migration.
- `cargo test --locked`: 455 passed, 10 opt-in tests ignored, and all 12 keyboard
  layout child processes passed. A stale Homebrew `libgit2` build-cache path was
  cleared before the successful run. Strict all-target/all-feature Clippy and
  the site's TypeScript/production build passed.
- No signed Linux feed has been published yet. Linux installer/updater source
  defaults were migrated; no Linux native install or enterprise-network test
  was performed as part of these hosting checks.
