---
Made by: Waghmare
GitHub repo: yt-supercut
cssclasses:
  - r-G
---
# YT Supercut — Complete 1:1 Tutorial

> **GitHub:** [Waghmare](https://github.com/sujit-waghmare/)
> **Version:** 1.0.0
> **Visibility:** Private
> <cite>Waghmare</cite>

---

<img src="https://img.shields.io/github/v/release/sujit-waghmare/yt-supercut?color=blue&style=flat-square" /><br><img src="https://img.shields.io/badge/Obsidian-v1.4.0+-purple?style=flat-square" /><br><img src="https://img.shields.io/badge/License-All_Rights_Reserved-red?style=flat-square" /><br><img src="https://img.shields.io/github/release-date/sujit-waghmare/yt-supercut?style=flat-square" /><br><img src="https://img.shields.io/badge/Mobile%20Friendly-Yes-brightgreen?style=flat-square" />

---

## Table of Contents

- [[#STEP 1 Prerequisites|Prerequisites]]
- [[#STEP 2 Manual Installation of the Plugin|Installation]]
- [[#STEP 3 Plugin Settings|Settings]]
- [[#STEP 4 Using the Plugin|Using the Plugin]]
- [[#STEP 5 Testing It Works|Testing]]
- [[#Troubleshooting|Troubleshooting]]
- [[#Pro Tips|Pro Tips]]
- [[#Quick Reference Card|Reference Card]]
- [[#File Reference|File Reference]]
- [[#FAQ|FAQ]]

---

## STEP 1: Prerequisites

Before anything, make sure you have the following ready in Obsidian:

1. **Reading View** — The floating player activates in Reading View/Preview mode only.
2. **YT Supercut** — The plugin we are installing to handle all YouTube workflows: floating player, iframe body embeds, background audio, metadata fetching, timestamp conversion, and a custom audio player.
3. **YouTube Data API v3 key** *(optional)* — Only needed for Sonicfonia **playlist** support. Single video playback works without a key.

To prepare for installation:
> Obsidian → Settings → Community Plugins → Turn off Restricted Mode → Browse

---

## STEP 2: Manual Installation of the Plugin

Since this plugin is not on the community store yet, install it manually from [GitHub](https://github.com/sujit-waghmare) or copy the files from [[#File Reference]].
*Make sure to name the files and folders **EXACTLY** as given below.*

> [!L-folder] ### Folder structure you need:
> ```
> YourVault/
> 	└── .obsidian/
> 		└── plugins/
> 			└── yt-supercut/
> 				├── main.js
> 				├── manifest.json
> 				└── styles.css
> ```

### Steps:

1. Open your vault folder on your computer or mobile.
   - Windows: Right-click vault in Obsidian → "Open vault folder"
   - Mac/Linux: Same option in File menu.
   - Mobile: Navigate to your vault folder → `.obsidian`
   - > [!warning] My vault does not have a `.obsidian` folder, what do I do?
   > Go to your file manager settings and enable `Show hidden files`.
2. Navigate to `.obsidian/plugins/`.
   - If the `plugins/` folder doesn't exist, create it manually.
3. Create a new folder named exactly: `yt-supercut`
4. Paste `main.js`, `manifest.json`, and `styles.css` inside it.
5. Open Obsidian.
6. Go to **Settings → Community Plugins**.
7. Click the **Refresh** button (circular arrow icon).
8. Find **"YT Supercut"** in the list.
9. Toggle it **ON**.

✅ Now ready to be worked.

---

## STEP 3: Plugin Settings

Go to:
> Settings → (scroll down) → YT Supercut

---

### 🎬 Section 1: Floating Window

No toggles here — behaviour is purely frontmatter-driven.

- **How it works:** Add `Float Window: true` to any note's frontmatter. Switch to Reading View — a draggable YouTube player appears.
- Shorts (`youtube.com/shorts/`) are automatically detected and rendered in a **portrait 9:16** window instead of the standard landscape 16:9.
- The window's **last dragged position is remembered** in plugin settings and restored the next time the window opens (until the vault is reloaded).

---

### 🔗 Section 2: iframe / Thumbnail Toggle

This is the most important section to understand.

**What `iframe: true/false` actually does:**

The `iframe` frontmatter property controls whether the **note body** shows a static thumbnail image or a live embedded YouTube player. It does **not** affect any URL in the frontmatter — it modifies the Markdown/HTML content of your note.

| `iframe` value | What's in the note body |
|---|---|
| `false` (default) | `![Thumbnail](https://img.youtube.com/vi/ID/maxresdefault.jpg)` |
| `true` | `<div class="youtube-container"><iframe src="…/embed/ID"></iframe></div>` |

**Aspect ratios applied automatically:**
- Normal video URL → `youtube-container` class → **16:9** ratio
- Shorts URL (`/shorts/`) → `youtube-container shorts` class → **9:16** ratio, max-width 360px

#### Customization Options:

1. **Embed position** — Where the iframe is injected when no thumbnail or iframe exists yet.
   - **Below H1** *(default)*: inserted after the `# Title` heading.
   - **Above H1**: inserted before it.

---

### 🎵 Section 3: Sonicfonia (Background Audio)

- **YouTube Data API key** — Paste your key here (password-masked). Only needed for playlists. Without it, single-video playback still works.

#### How to get a YouTube Data API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and sign in.
2. Click **Select a project** → **New Project** → name it anything → **Create**.
3. In the left sidebar: **APIs & Services → Library**.
4. Search for `YouTube Data API v3` → click it → **Enable**.
5. Go to **APIs & Services → Credentials → + Create Credentials → API Key**.
6. Copy the key (starts with `AIza…`) and paste it in the YT Supercut settings.

#### How to set a playlist as the fallback link:

1. Open any YouTube playlist in your browser.
2. Copy the URL from the address bar — it looks like:
   `https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxxxxxxxxxxx`
3. Paste that full URL into the **Primary link (fallback)** field in settings.
4. This playlist will play on any note that has `Sonicfonia: true` but no `YouTube Url` property.
5. To use it, also set your **YouTube Data API key** — playlist loading requires the API.

| Setting | Effect |
|---|---|
| YouTube Data API key | Enables playlist support |
| Primary link (fallback) | Plays when note has no YouTube Url |
| Enable Sonicfonia by default | Auto-plays on note switch even without `Sonicfonia: true` |
| Shuffle playlist | Randomises track order on load |
| Limit repeat count | Finite repeat vs loop forever |

---

### 🎚 Section 4: YT Audio Player (`ytaudio` block)

- **Bold title** — Renders the title in bold inside the player widget.
- **Title color** — Color picker for the title text.
- **Slider thumb color** — Drag handle color on the progress bar.
- **Progress bar gradient (up to 5 colors)** — Pick colors; they blend into a gradient. Set any to `#000000` to skip it.

---

## STEP 4: Using the Plugin

---

### 4.1 — Floating Draggable Player

Add to frontmatter:

```yaml
---
YouTube Url: https://youtu.be/dQw4w9WgXcQ
Float Window: true
---
```

Switch to **Reading View**. A draggable YouTube player appears.

- Drag it anywhere via the top handle bar. Position is **remembered** until vault reload.
- ✕ button closes it and sets `Float Window: false`.
- **Shorts** (`youtube.com/shorts/ID`) render in a 9:16 portrait window automatically — no config needed.

| Element | Visual Result |
|---|---|
| `Float Window: true` in Reading View | Draggable player (16:9 or 9:16 for Shorts) |
| `Float Window: false` | Player hidden |
| ✕ on player | Closes + sets `Float Window: false` |
| Drag handle | Moves window; position saved |

**Where to use:**
- **Study notes:** Watch a lecture while reading side by side.
- **Shorts notes:** Portrait player appears correctly without any setup.
- **Research:** Reference a YouTube source while drafting.

---

### 4.2 — iframe / Thumbnail Toggle

Run the command:

> `YT Supercut: Toggle iframe embed (thumbnail ↔ iframe in note body)`

Or toggle `iframe: true/false` in frontmatter — the plugin watches for changes and nothing happens automatically; the **command** is what performs the body modification.

**First run (no thumbnail or iframe in body yet):**
```markdown
# My Video
          ↓ command runs
# My Video
<div class="youtube-container"><iframe src="https://www.youtube.com/embed/ID" ...></iframe></div>
```

**When thumbnail exists:**
```markdown
![Thumbnail](https://img.youtube.com/vi/ID/maxresdefault.jpg)
          ↓ command runs
<div class="youtube-container"><iframe ...></iframe></div>
```

**When iframe exists (toggle back):**
```markdown
<div class="youtube-container"><iframe ...></iframe></div>
          ↓ command runs
![Thumbnail](https://img.youtube.com/vi/ID/maxresdefault.jpg)
```

**For a Shorts URL** (`youtube.com/shorts/ID`):
```html
<div class="youtube-container shorts">
  <iframe src="https://www.youtube.com/embed/ID" ...></iframe>
</div>
```
This renders at 9:16 ratio, centred, max-width 360px.

| Element | Visual Result |
|---|---|
| Normal URL + command | 16:9 embedded player |
| Shorts URL + command | 9:16 portrait player, 360px wide |
| Run again on iframe | Converts back to `![Thumbnail]()` |
| `iframe` property in frontmatter | Updated to `true` or `false` to reflect body state |

**Where to use:**
- **Video notes:** Embed the video directly in your notes page.
- **Shorts:** Correct portrait ratio, no extra steps.
- **Toggle back:** Switch to thumbnail for cleaner reading.

---

### 4.3 — Thumbnail ↔ Video URL (Cursor Line)

Place cursor on any line with a YouTube URL and run:

> `YT Supercut: Toggle: Thumbnail ↔ Video URL (cursor line)`

```markdown
Before: https://youtu.be/dQw4w9WgXcQ
After:  https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg

Before: https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg
After:  https://youtu.be/dQw4w9WgXcQ
```

This is a **URL-only swap** on the cursor line. It does not modify any HTML div container or note body structure — use [[#4.2 — iframe / Thumbnail Toggle]] for that.

| Element | Visual Result |
|---|---|
| Video URL on cursor line | Swapped to thumbnail URL |
| Thumbnail URL on cursor line | Swapped to video URL |
| No YouTube URL on line | Notice: "No YouTube URL on this line" |

**Where to use:**
- Swapping the `Thumbnail Url` frontmatter value manually.
- Toggling raw URL references in body text or link targets.

---

### 4.4 — Metadata Fetcher

Run:

> `YT Supercut: Fetch YouTube metadata for current note`

Requires `YouTube Url` in frontmatter (or a `[Watch video](url)` link in the body).

**What it writes:**

```markdown
---
YouTube Url: https://youtu.be/dQw4w9WgXcQ
Thumbnail Url: https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg
Channel UID: @RickAstleyYT
Timestamp: true
Sonicfonia: false
iframe: false
---

# Never Gonna Give You Up

![Thumbnail](https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg)

> <details>
> <summary>Description</summary>
> (fetched description here)
> </details>

\`\`\`ytaudio
Title: Never Gonna Give You Up
YouTube Url: https://youtu.be/dQw4w9WgXcQ
\`\`\`

👤 [RickAstleyYT](https://youtube.com/@RickAstleyYT) 🔗 [Watch video](https://youtu.be/dQw4w9WgXcQ)
```

| Element | Visual Result |
|---|---|
| Runs metadata fetch | H1 title, thumbnail, description block |
| Existing `Channel UID` | Preserved; not overwritten |
| Bare `mm:ss` in body | Converted to clickable timestamp links |
| Tracker parameters in URL | Stripped automatically |
| Note already has `<div class="youtube-container">` | Skips thumbnail injection — respects existing iframe |

---

### 4.5 — Timestamp Conversion

**Automatic (live):** When `Timestamp: true` is in frontmatter, plain `mm:ss` or `hh:mm:ss` patterns auto-convert to clickable links on save (1.2s debounce).

**Manual command:**

> `YT Supercut: Convert (mm:ss)/(hh:mm:ss) to clickable timestamp links`

```markdown
Before: at 1:23 and 1:02:30
After:  at [1:23](https://youtu.be/ID&t=1m23s) and [1:02:30](https://youtu.be/ID&t=62m30s)
```

---

### 4.6 — Sonicfonia (Background Audio)

Add to frontmatter:

```yaml
---
YouTube Url: https://youtu.be/dQw4w9WgXcQ
Sonicfonia: true
---
```

Switch notes or run command `Sonicfonia: Toggle play/stop`.

For a playlist:

```yaml
---
YouTube Url: https://www.youtube.com/playlist?list=PLxxxxxx
Sonicfonia: true
Repeat: true
---
```

> [!warning] Playlist requires YouTube Data API key in settings. Single videos do not.

| Element | Visual Result |
|---|---|
| `Sonicfonia: true` + note switch | Audio starts automatically |
| `Sonicfonia: false` | Audio stops |
| Status bar | Shows `▶ Sonicfonia [2/15]` |
| Playlist URL | Loads all tracks via API; shuffles if enabled |

**Commands (3 total — toggle covers play + stop):**

| Command | Action |
|---|---|
| `Sonicfonia: Toggle play/stop` | Starts if stopped; stops if playing |
| `Sonicfonia: Next track` | Advances queue |
| `Sonicfonia: Previous track` | Goes back in queue |

---

### 4.7 — YT Audio Player (`ytaudio` block)

````markdown
```ytaudio
Title: Never Gonna Give You Up
YouTube Url: https://youtu.be/dQw4w9WgXcQ
```
````

Switch to **Reading View**. Renders a compact audio player with:
- ▶/❚❚ play/pause
- Seekable gradient progress bar
- Time display or `🔴 LIVE` for live streams
- ⚙️ edit button — jumps cursor to that code block

---

## STEP 5: Testing It Works

1. Enable the plugin — [[#STEP 2 Manual Installation of the Plugin|Step 2]].
2. Create a new note with:

```yaml
---
YouTube Url: https://youtu.be/dQw4w9WgXcQ
Timestamp: true
Sonicfonia: false
iframe: false
Float Window: false
---

Some note text with a timestamp: 1:23
```

3. Run: `Fetch YouTube metadata` — verify H1, thumbnail, description, ytaudio block appear.
4. Check `1:23` became a clickable timestamp link.
5. Run: `Toggle iframe embed` — verify `![Thumbnail]` is replaced by `<div class="youtube-container">`.
6. Run it again — verify it reverts to `![Thumbnail]`.
7. Set `Float Window: true` → switch to Reading View → verify draggable player appears. Drag it — reopen the note — verify position is restored.
8. Use a Shorts URL (`youtube.com/shorts/ID`) → run `Toggle iframe embed` → verify the container has `class="youtube-container shorts"`.
9. Set `Sonicfonia: true` → switch to another note and back → verify status bar shows `▶ Sonicfonia`. Run `Toggle play/stop` to stop it.

---

## Troubleshooting

> [!L-cog] Floating window doesn't appear
> * Confirm you are in **Reading View** (not Live Preview or Source mode).
> * Confirm `Float Window: true` is in frontmatter (case-sensitive).
> * Confirm `YouTube Url` exists and is a valid YouTube link.

> [!L-cog] Floating window is not draggable
> * Make sure you are dragging from the **top handle bar** (with the grip dots), not the video itself.
> * The close button (✕) is on the handle bar — clicking it is not a drag.
> * On mobile, drag is not supported (mouse-only).

> [!L-cog] Shorts play audio only in float window
> * This was a known issue in earlier versions. Current version uses the standard `/embed/` path for all URLs — Shorts work correctly.
> * If you still see audio-only, confirm your URL contains `/shorts/` so the portrait window size is applied.

> [!L-cog] iframe toggle didn't change the note body
> * Confirm `YouTube Url` is in frontmatter before running the command.
> * Confirm the URL is valid (no extra spaces, correct format).
> * If no H1, thumbnail, or existing iframe div exists in the body, the command has nothing to anchor to — run `Fetch metadata` first to set up the note structure.

> [!L-cog] Sonicfonia not playing
> * Confirm `Sonicfonia: true` in frontmatter, or enable "Enable Sonicfonia by default" in settings.
> * For playlists: confirm YouTube Data API key is entered. Without it, only single videos work.
> * Check status bar — `⏳ Loading…` for more than 10s means the API key is invalid or quota exceeded.

> [!L-cog] Timestamps not converting
> * Confirm `Timestamp: true` in frontmatter.
> * Confirm `YouTube Url` is present — timestamps need a base URL to link to.
> * Try the manual command: `Convert (mm:ss)/(hh:mm:ss) to timestamp links`.

> [!L-cog] ytaudio block shows an error
> * Confirm the URL is a valid YouTube video (not a playlist or channel URL).
> * Confirm the block uses `YouTube Url:` (capital Y and U, space after colon).

---

## Pro Tips

* **Init template** — Add to a new note and run `Fetch YouTube metadata` once to scaffold everything:
  ```yaml
  ---
  YouTube Url: https://youtu.be/VIDEO_ID
  Timestamp: true
  Sonicfonia: false
  iframe: false
  Float Window: false
  ---
  ```
* **Sonicfonia + Float Window** — Both can be active simultaneously. Sonicfonia = hidden 1×1px iframe; Float Window = visible iframe. They don't conflict.
* **Shorts float window** — Uses a portrait 9:16 window automatically. No extra setting needed.
* **Float window position** — Position is saved to plugin settings (`data.json`) after every drag. It's restored on the next open but reset when the vault is reloaded.
* **iframe toggle is reversible** — Run the command again on a note that has an iframe and it converts back to `![Thumbnail]()`. Run it again and it goes back to iframe. Bidirectional, infinite.
* **Playlist fallback in settings** — If you want background music across all notes without adding `YouTube Url` to each note, paste your playlist URL in Settings → Primary link, enable "Enable Sonicfonia by default" toggle ON, and add your API key. Every note will play from the playlist automatically.

---

## Quick Reference Card

| What you want | How to do it |
|---|---|
| Show floating draggable player | `Float Window: true` in frontmatter → Reading View |
| Shorts in float window | Just use a `/shorts/` URL — portrait window is automatic |
| Embed iframe in note body | Command: `Toggle iframe embed` |
| Revert iframe back to thumbnail | Run `Toggle iframe embed` again |
| Swap URL between thumb and video | Cursor on URL line → `Toggle: Thumbnail ↔ Video URL` |
| Fetch title, thumbnail, description | Command: `Fetch YouTube metadata for current note` |
| Auto-convert timestamps | `Timestamp: true` in frontmatter |
| Convert timestamps manually | Command: `Convert (mm:ss)/(hh:mm:ss) to timestamp links` |
| Toggle background audio | Command: `Sonicfonia: Toggle play/stop` |
| Next/previous track | Commands: `Sonicfonia: Next/Previous track` |
| Embed interactive audio player | ` ```ytaudio ` block with `Title:` and `YouTube Url:` |
| Set fallback playlist | Settings → Primary link → paste playlist URL + add API key |
| Get YouTube Data API key | Google Cloud Console → YouTube Data API v3 → Credentials |

---

## File Reference

| File | Purpose | Edit? |
|---|---|---|
| `manifest.json` | Plugin ID, version, author metadata | ❌ No |
| `main.js` | All 7 features: logic, commands, settings, rendering | ❌ No |
| `styles.css` | Float window, youtube-container (16:9 + 9:16), ytaudio player, status bar | ❌ No |

*Plugin version: 1.0.0 — Compatible with Obsidian 1.4.0 and above*

### manifest.json

```json
{
  "id": "yt-supercut",
  "name": "YT Supercut",
  "version": "1.0.0",
  "minAppVersion": "1.4.0",
  "description": "All-in-one YouTube toolkit: floating player, inline embeds, thumbnail ↔ video toggle, metadata fetcher, live timestamp links, background audio (Sonicfonia), and custom audio player — unified in one plugin.",
  "author": "Waghmare",
  "authorUrl": "https://github.com/sujit-waghmare",
  "fundingUrl": "https://paypal.me/waghmaresujit",
  "isDesktopOnly": false
}
```

### main.js

```
See main.js from the yt-supercut plugin folder.
Full source: github.com/sujit-waghmare/yt-supercut
```

### styles.css

```
See styles.css from the yt-supercut plugin folder.
Full source: github.com/sujit-waghmare/yt-supercut
```

---

## FAQ

> [!multi-column|col2]
>
>> [!L-badge-question-mark] **Q: What does `iframe: true` in frontmatter actually do?**
>> *It reflects the current state of your note body — `true` means an embedded `<iframe>` div is present in the note; `false` means a static `![Thumbnail]()` image is there instead. The plugin updates this property when you run the toggle command. You can also toggle it manually; the next time you run the command it reads the body (not the property) to decide what to do.*
>
>> [!L-badge-question-mark] **Q: Do I need a YouTube API key?**
>> *Only for Sonicfonia playlist support. Single video playback, the float window, iframe toggle, metadata fetching, timestamp conversion, and the ytaudio block all work without any API key.*
>
>> [!L-badge-question-mark] **Q: Do Shorts work in the floating window?**
>> *Yes. Shorts URLs (`/shorts/ID`) are detected and displayed in a 9:16 portrait window (340px wide). Earlier versions had an audio-only issue; this is fixed — Shorts now embed correctly.*
>
>> [!L-badge-question-mark] **Q: The float window isn't moving when I drag it.**
>> *Drag from the top handle bar only — the area with the grip dots. Dragging the video area itself doesn't work. The iframe captures mouse events, so drag detection is on the handle only.*
>
>> [!L-badge-question-mark] **Q: My float window position resets after reloading Obsidian.**
>> *Position is saved to plugin `data.json` and restored within a session. It resets on full vault reload by design — this avoids the window being off-screen after a resolution change.*
>
>> [!L-badge-question-mark] **Q: Can I have Sonicfonia and the float window active at the same time?**
>> *Yes. They use separate iframes and don't conflict. Float window is visible; Sonicfonia is a 1×1px hidden iframe.*
>
>> [!L-badge-question-mark] **Q: How do I stop Sonicfonia? There's no stop command.**
>> *Use `Sonicfonia: Toggle play/stop` — it stops if playing, or starts if stopped. This replaces the old separate stop and play commands.*
>
>> [!L-badge-question-mark] **Q: The iframe toggle injected the player in the wrong place.**
>> *The setting "Embed position" (Below H1 / Above H1) controls where it injects when no thumbnail or iframe exists yet. If a `![Thumbnail]()` already exists, the command replaces it in-place regardless of setting.*
>
>> [!L-badge-question-mark] **Q: How do I use a playlist for Sonicfonia?**
>> *1) Get a YouTube Data API key (see Settings section for steps). 2) Enter the playlist URL `https://youtube.com/playlist?list=PLxxxxx` in the `YouTube Url` frontmatter of your note, or paste it in Settings → Primary link (fallback). 3) Make sure `Sonicfonia: true` is in frontmatter (or "Enable by default" is ON). The plugin fetches all track IDs via the API and queues them.*
>
>> [!L-badge-question-mark] **Q: What YouTube URL formats are supported?**
>> *All of them: `youtu.be/ID`, `youtube.com/watch?v=ID`, `youtube.com/shorts/ID`, `youtube.com/live/ID`, `youtube.com/embed/ID`, and bare 11-character video IDs.*
