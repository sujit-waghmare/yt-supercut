<div align="center">

# YT Supercut

**All-in-one YouTube toolkit for Obsidian**

<img src="https://img.shields.io/github/v/release/sujit-waghmare/yt-supercut?color=blue&style=flat-square" />  <img src="https://img.shields.io/badge/Obsidian-v0.15.0+-purple?style=flat-square" />  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />  <img src="https://img.shields.io/github/release-date/sujit-waghmare/yt-supercut?style=flat-square" />  <img src="https://img.shields.io/badge/Mobile%20Friendly-Yes-brightgreen?style=flat-square" />


[Features](#features) · [Installation](#installation) · [Usage](#usage) · [Settings](#settings) · [Commands](#commands) · [FAQ](#faq)

</div>

---

YT Supercut merges seven separate YouTube tools into one plugin: a **draggable floating player**, **body iframe embed toggle** (with correct 16:9 / 9:16 aspect ratios for Shorts), **thumbnail ↔ video URL swap**, **metadata fetcher**, **live timestamp links**, **Sonicfonia background audio**, and a **custom ytaudio player block**.

No Templater. No separate plugins. One install.

---

## Features

### 🎬 Draggable Floating Window
- Activates via `Float Window: true` in frontmatter (Reading View only)
- Drag anywhere on screen — **position is cached** and restored until vault reload
- **Shorts** (`/shorts/` URLs) render in a portrait 9:16 window automatically
- Close button writes `Float Window: false` back to frontmatter

### 🔗 iframe Body Toggle
- Replaces `![Thumbnail]()` in your note body with a live embedded player — or reverts it back
- **Normal videos** → `youtube-container` → 16:9 ratio
- **Shorts** → `youtube-container shorts` → 9:16 ratio, max-width 360px
- One command, bidirectional, infinite toggles

### 🔄 Thumbnail ↔ Video URL Swap
- Cursor on any line containing a YouTube URL → run command → URL type swaps
- `https://youtu.be/ID` ↔ `https://img.youtube.com/vi/ID/maxresdefault.jpg`
- URL-only, does not touch note body structure

### 📋 Metadata Fetcher
- One command scaffolds the entire note: H1 title, thumbnail, description block, ytaudio player, channel + watch links
- Fetches via YouTube oEmbed (no API key needed) + raw HTML scrape
- Strips tracking parameters from URLs
- Skips re-injection if content already exists — safe to re-run

### ⏱ Live Timestamp Conversion
- `Timestamp: true` in frontmatter → plain `mm:ss` / `hh:mm:ss` patterns auto-convert to clickable links on save
- `1:23` → `[1:23](https://youtu.be/ID?t=1m23s)`
- `1:02:30` → `[1:02:30](https://youtu.be/ID?t=62m30s)`
- Also available as a manual command

### 🎵 Sonicfonia — Background Audio
- Plays YouTube audio silently in a hidden 1×1px iframe
- Starts automatically on note switch when `Sonicfonia: true`
- Playlist support via YouTube Data API v3 (optional — single videos need no key)
- Shuffle, repeat, queue navigation
- Status bar shows playback state + queue position

### 🎚 YT Audio Player — `ytaudio` block
- Interactive audio player rendered from a code block in Reading View
- Play/pause, seekable gradient progress bar, time display
- Live stream detection (`🔴 LIVE`) with seek disabled
- Edit button (⚙️) jumps cursor back to the block

---

## Installation

> YT Supercut is not yet in the Obsidian community store. Install manually.

1. Download the [latest release](https://github.com/sujit-waghmare/yt-supercut/releases/latest) — `main.js`, `styles.css`, `manifest.json`
2. In your vault: navigate to `.obsidian/plugins/` (enable hidden files if needed)
3. Create a folder named exactly `yt-supercut`
4. Drop all three files inside
5. Obsidian → Settings → Community Plugins → Refresh → Enable **YT Supercut**

---

## Usage

### Frontmatter properties

| Property | Type | Purpose |
|---|---|---|
| `YouTube Url` | string | Source URL — used by all features |
| `Thumbnail Url` | string | Written by metadata fetcher |
| `Channel UID` | string | Written by metadata fetcher |
| `Float Window` | boolean | `true` = show floating player (Reading View) |
| `iframe` | boolean | Reflects body state: `true` = iframe div present |
| `Sonicfonia` | boolean | `true` = play background audio on note switch |
| `Timestamp` | boolean | `true` = auto-convert timestamps on save |
| `Repeat` | boolean | Sonicfonia loop control |

### Init template

Paste into a new note and run **Fetch YouTube metadata** once to scaffold everything:

```yaml
---
YouTube Url: https://youtu.be/VIDEO_ID
Timestamp: true
Sonicfonia: false
iframe: false
Float Window: false
---
```

### ytaudio block syntax

````markdown
```ytaudio
Title: My Video Title
YouTube Url: https://youtu.be/VIDEO_ID
```
````

---

## Settings

Go to **Settings → YT Supercut**.

| Setting | Default | Description |
|---|---|---|
| Embed position | Below H1 | Where the iframe is injected when no existing element is found |
| YouTube Data API key | — | Required for Sonicfonia playlist support only |
| Primary link (fallback) | — | Played by Sonicfonia when note has no `YouTube Url` |
| Enable Sonicfonia by default | ON | Auto-play on note switch without needing `Sonicfonia: true` |
| Shuffle playlist | OFF | Randomise playlist track order |
| Limit repeat count | OFF | Finite repeat vs loop forever |
| Bold title (ytaudio) | OFF | Bold title text in the audio player |
| Title / thumb / gradient colors | — | Style the ytaudio player |

### Getting a YouTube Data API key

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and sign in
2. **Select a project → New Project** → Create
3. **APIs & Services → Library** → search `YouTube Data API v3` → Enable
4. **APIs & Services → Credentials → + Create Credentials → API Key**
5. Copy the key (`AIza…`) → paste into Settings → YT Supercut → YouTube Data API key

### Setting a playlist as Sonicfonia fallback

1. Open any YouTube playlist → copy the URL: `https://youtube.com/playlist?list=PLxxxxxx`
2. Paste into **Settings → Primary link (fallback)**
3. Add your API key (required for playlist loading)
4. Enable **Enable Sonicfonia by default** — or add `Sonicfonia: true` per note

---

## Commands

| Command | Description |
|---|---|
| `Toggle float window` | Shows/hides the floating player (writes to frontmatter) |
| `Toggle iframe embed` | Swaps `![Thumbnail]()` ↔ `<div class="youtube-container">` in note body |
| `Toggle: Thumbnail ↔ Video URL (cursor line)` | Swaps URL type on the current editor line |
| `Fetch YouTube metadata for current note` | Scaffolds the full note from the YouTube URL |
| `Convert (mm:ss)/(hh:mm:ss) to clickable timestamp links` | Manual timestamp conversion |
| `Sonicfonia: Toggle play/stop` | Starts or stops background audio |
| `Sonicfonia: Next track` | Advances playlist queue |
| `Sonicfonia: Previous track` | Reverses playlist queue |

---

## FAQ

**Do I need an API key?**  
No, for most features. The API key is only required for Sonicfonia playlist support. Single-video playback, the floating window, iframe toggle, metadata fetcher, timestamps, and the ytaudio block all work without one.

**Do Shorts work?**  
Yes. `/shorts/` URLs are detected automatically. The floating window shows a 9:16 portrait player; the iframe body toggle injects a 9:16 container (max-width 360px).

**What does `iframe: true` in frontmatter mean?**  
It reflects the current state of your note body. `true` means a `<div class="youtube-container">` embed is present; `false` means a static `![Thumbnail]()` is there. The plugin updates this value when you run the toggle command. You don't need to set it manually.

**How do I stop Sonicfonia?**  
Run `Sonicfonia: Toggle play/stop` — it stops if playing, starts if stopped. There is no separate stop command.

---

## Support

Building and maintaining these tools takes significant time and energy. Your tips keep the caffeine flowing and helps me stay focused on delivering high-quality, reliable products for the community. 

<p align="left">
  <a href="https://paypal.me/waghmaresujit">
    <img src="https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white" height="36" />
  </a>
  <a href="https://ko-fi.com/sujitwaghmare">
    <img src="https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white" height="36" />
  </a>
  <img src="https://img.shields.io/badge/UPI_(_Scan_Below_)-122E31?style=for-the-badge&logo=upi&logoColor=white" height="36" />
</p>

<details>
<summary><b>Donate via UPI (QR Code)</b></summary>
<br>
<p align="left">
<img src="https://img.shields.io/badge/exotic.sus@axl-122E31?style=for-the-badge&logo=upi&logoColor=white" />
</p>
<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=exotic.sus@axl&pn=Sujit%20Rajabhau%20Waghmare&cu=INR" alt="UPI QR Code" />
</details>

---

<div align="center">
  
[Depth Tutorial for User](https://github.com/sujit-waghmare/yt-supercut/blob/main/Comprehensive%20Guide.md) • [Handoff File for Devs](https://github.com/sujit-waghmare/yt-supercut/blob/main/handoff.md)

</div>

---

<div align="center">

Made by [Waghmare](https://github.com/sujit-waghmare) • Obsidian Plugin • Star repo 

</div>
