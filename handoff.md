# YT Supercut — Handoff Document

**Plugin ID:** `yt-supercut`  
**Author:** Waghmare (`github.com/sujit-waghmare`)  
**Funding:** `paypal.me/waghmaresujit`  
**Version:** 1.0.0  
**Mobile:** ✅ Enabled  
**Files:** `main.js` · `styles.css` · `manifest.json`

---

## What This Plugin Does

All-in-one YouTube toolkit compiled from four sources:

| Feature | Source |
|---|---|
| Draggable floating player | `youtube-floating-window` plugin |
| Inline iframe embeds (`[Text\|iframe](url)`) | New |
| Thumbnail ↔ Video URL toggle | Templater script v1.5.2 |
| YouTube metadata fetcher | Templater script v1.5.2 |
| Live timestamp conversion | Templater script v1.5.2 |
| Background audio (Sonicfonia) | `sonicfonia` plugin |
| Custom audio player (`ytaudio` block) | `yt-audio` plugin |

---

## Frontmatter Properties Used

| Property | Type | Used By |
|---|---|---|
| `YouTube Url` | string | Everything |
| `Thumbnail Url` | string | Metadata fetcher (writes) |
| `Channel UID` | string | Metadata fetcher (reads/writes) |
| `Float Window` | boolean | Floating player |
| `iframe` | boolean | Inline embed renderer |
| `Sonicfonia` | boolean | Background audio |
| `Timestamp` | boolean | Live timestamp processor |
| `Repeat` | boolean | Sonicfonia repeat |

---

## Commands

| Command ID | Name |
|---|---|
| `yts-toggle-float` | Toggle float window |
| `yts-toggle-iframe` | Toggle inline iframe embed |
| `yts-toggle-thumb-video` | Toggle Thumbnail ↔ Video URL on cursor line |
| `yts-fetch-metadata` | Fetch YouTube metadata for current note |
| `yts-convert-timestamps` | Convert (mm:ss)/(hh:mm:ss) to timestamp links |
| `yts-sonicfonia-play` | Sonicfonia: Play |
| `yts-sonicfonia-stop` | Sonicfonia: Stop |
| `yts-sonicfonia-toggle` | Sonicfonia: Toggle play/stop |
| `yts-sonicfonia-next` | Sonicfonia: Next track |
| `yts-sonicfonia-prev` | Sonicfonia: Previous track |

---

## Feature Details

### 1. Floating Window
- Toggled via ribbon icon or `yts-toggle-float` command — writes `Float Window: true/false` to frontmatter.
- Only activates in **Reading View**.
- Window is **draggable** via the top handle bar.
- Close button (✕) removes the window and sets `Float Window: false`.
- Reads `YouTube Url` frontmatter for the video.

### 2. Inline Embeds
- Syntax: `[Any Text|iframe](https://youtube.com/watch?v=VIDEO_ID)`
- The `|iframe` suffix in the link text is the trigger.
- Requires `iframe: true` in frontmatter to render.
- **Setting:** embed position — above or below the link line (Settings → YT Supercut → Embed position).
- Rendered as 16:9 `<iframe>` via a markdown post-processor.

### 3. Thumbnail ↔ Video URL Toggle
- Runs on the **cursor line** in the editor.
- Detects any YouTube video URL → converts to `https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg`
- Detects any YouTube thumbnail URL → converts to `https://youtu.be/VIDEO_ID`
- Bidirectional; fires in one pass.

### 4. Metadata Fetcher
- Reads `YouTube Url` from frontmatter (or falls back to `[Watch video](url)` in body).
- Calls `oembed` API for title + channel name (no API key needed).
- Fetches `ytInitialPlayerResponse` from raw HTML for description.
- Writes: H1 title, thumbnail image, description block, `ytaudio` code block, channel/watch links.
- Updates frontmatter with clean URL (tracker stripped), thumbnail URL, channel UID.
- Runs timestamp conversion pass as part of the same operation.
- Uses `obsidian.requestUrl` — works on mobile.

### 5. Live Timestamp Conversion
- Triggers automatically on `metadataCache.changed` when `Timestamp: true` in frontmatter.
- Debounced 1200ms to avoid IO spam.
- Also available as explicit command (`yts-convert-timestamps`) via editor callback.
- Converts bare `mm:ss` or `hh:mm:ss` patterns (with optional surrounding `()[]{}`).
- Skips patterns already inside a markdown link.
- Format: `[original](YouTube_Url&t=Xm Ys)` — uses `?t=` or `&t=` correctly depending on URL.

### 6. Sonicfonia (Background Audio)
- Hidden 1×1px iframe approach. No YouTube API key needed for single videos.
- API key required for playlist support (YouTube Data API v3).
- Reads `Sonicfonia` frontmatter; falls back to Settings default.
- Playlist loads via `fetchPlaylistVideoIds` → optional shuffle → queued playback.
- For multi-track playlists: passes comma-separated video IDs to YouTube embed's `playlist=` param.
- Status bar item shows playback state + queue position.
- All 5 commands + ribbon icon available.

### 7. YT Audio Player (`ytaudio` block)
- Code block syntax:
  ````
  ```ytaudio
  Title: My Video
  YouTube Url: https://youtube.com/watch?v=VIDEO_ID
  ```
  ````
- Uses YouTube IFrame API (injected once on plugin load).
- Features: play/pause, seekable progress bar, live stream detection, edit button.
- Settings: title color, bold title, thumb color, gradient progress bar (up to 5 colors; set to `#000000` to skip).

---

## Settings Reference

All settings live under **Settings → YT Supercut**.

| Setting Key | Default | Notes |
|---|---|---|
| `inlineEmbedPosition` | `'below'` | `'above'` \| `'below'` |
| `sonicfoniaDefaultOn` | `true` | Fallback when no `Sonicfonia` property |
| `sonicfoniaPrimaryLink` | `''` | Fallback URL for Sonicfonia |
| `sonicfoniaApiKey` | `''` | YouTube Data API v3 key |
| `sonicfoniaShuffle` | `false` | Shuffle playlist |
| `sonicfoniaRepeatEnabled` | `false` | Finite repeat toggle |
| `sonicfoniaRepeatCount` | `3` | Repeat count (1–10) |
| `ytAudioTitleColor` | `'#8fa0ba'` | ytaudio title text color |
| `ytAudioBoldTitle` | `false` | Bold title in ytaudio |
| `ytAudioThumbColor` | `'#ffffff'` | Progress bar thumb color |
| `ytAudioTrackColors` | 5-color array | Progress bar gradient |

---

## File Structure

```
yt-supercut/
├── main.js        ← All plugin logic (single file)
├── styles.css     ← All styles (float window, inline embed, ytaudio, sonicfonia)
└── manifest.json  ← Plugin metadata
```

### main.js Internal Structure

```
SHARED HELPERS          extractVideoId, extractPlaylistId, formatTime, cleanYouTubeUrl, ...
PLAYLIST FETCHER        fetchPlaylistVideoIds (YouTube Data API v3)
SONICFONIA IFRAMES      sonicfonia_createIframe, sonicfonia_loadPlaylistInIframe, sonicfonia_removeIframe
DEFAULT SETTINGS        DEFAULT_SETTINGS object
SETTINGS TAB            YTSuperCutSettingTab class
MAIN PLUGIN             YTSuperCutPlugin class
  ├─ onload / onunload
  ├─ Feature 1          _floatToggleProperty, _floatUpdate, _floatCreate, _floatRemove
  ├─ Feature 2          _inlineToggleProperty, _processInlineEmbeds
  ├─ Feature 3          _thumbVideoToggle
  ├─ Feature 4          _fetchMetadata
  ├─ Feature 5          _applyTimestampConversion, _tsLiveProcess, _convertTimestamps
  ├─ Feature 6          _sfPlay*, _sfLoad*, _sfStop*, _sfToggle*, _sfUpdateStatusBar
  └─ Feature 7          _ytAudioBlock
```

---

## Known Limitations / TODOs

- **Floating window drag** is mouse-only; no touch/mobile drag support yet.
- **Inline embeds** require `iframe: true` in frontmatter; they won't auto-render on all notes (intentional to avoid performance issues).
- **Sonicfonia playlist** uses YouTube's native embed `playlist=` param — track advancement is handled by YouTube, not the plugin. Next/Prev commands only work when the plugin manages the queue (single videos or API-loaded playlists).
- **Metadata fetcher** scrapes `ytInitialPlayerResponse` from raw HTML — YouTube can change this structure without notice. If description stops working, check for changes to that key.
- **YT IFrame API** (`window.YT`) is injected globally. If another plugin also injects it, the `id='yts-yt-api'` guard prevents duplication.
- **Timestamp live processing** debounces at 1200ms. Very fast typists editing frontmatter may see a slight lag before timestamps convert.
- **Embed above/below** setting only affects inline `[Text|iframe]` links, not `ytaudio` blocks.

---

## Adding New Features

1. Add setting key to `DEFAULT_SETTINGS`.
2. Add UI control in `YTSuperCutSettingTab.display()`.
3. Add method(s) to `YTSuperCutPlugin` with `_featureName` prefix.
4. Wire command in `onload()` via `this.addCommand({...})`.
5. Add CSS to `styles.css` under a clearly labelled section comment.
6. Update this document.

---

## Frontmatter Init Template

Paste into a new note, then run **Fetch YouTube metadata**:

```yaml
---
YouTube Url: https://youtu.be/VIDEO_ID
Thumbnail Url: ""
Channel UID: ""
Timestamp: true
Sonicfonia: false
iframe: false
Float Window: false
---
```
