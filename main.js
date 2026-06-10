'use strict';

var obsidian = require('obsidian');

// ═══════════════════════════════════════════════════════════
//  SHARED HELPERS
// ═══════════════════════════════════════════════════════════

function extractVideoId(url) {
	if (!url) return null;
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
		/^([a-zA-Z0-9_-]{11})$/,
	];
	for (const p of patterns) {
		const m = String(url).match(p);
		if (m) return m[1];
	}
	return null;
}

function extractPlaylistId(url) {
	if (!url) return null;
	const m = String(url).match(/[?&]list=([a-zA-Z0-9_-]+)/);
	return m ? m[1] : null;
}

function isPlaylistUrl(url) {
	return !!extractPlaylistId(url);
}

function shuffleArray(arr) {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function getFrontmatterValue(app, file, key) {
	const cache = app.metadataCache.getFileCache(file);
	if (!cache || !cache.frontmatter) return null;
	const val = cache.frontmatter[key];
	return (val === undefined || val === null) ? null : val;
}

function formatTime(seconds) {
	if (!seconds || isNaN(seconds)) return '0:00';
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return m + ':' + (s < 10 ? '0' : '') + s;
}

function cleanYouTubeUrl(url) {
	if (!url) return '';
	const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
	if (m && m[1]) {
		const id = m[1];
		if (url.includes('youtu.be/')) return `https://youtu.be/${id}`;
		if (url.includes('shorts/')) return `https://www.youtube.com/shorts/${id}`;
		if (url.includes('live/')) return `https://www.youtube.com/live/${id}`;
		return `https://www.youtube.com/watch?v=${id}`;
	}
	return url;
}

function thumbFromVideoId(videoId) {
	return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

function videoUrlFromThumb(thumbUrl) {
	// https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg  →  https://youtu.be/VIDEO_ID
	const m = thumbUrl.match(/img\.youtube\.com\/vi\/([\w-]{11})\//);
	return m ? `https://youtu.be/${m[1]}` : null;
}

function isYouTubeThumbnailUrl(url) {
	return /img\.youtube\.com\/vi\/[\w-]{11}\//.test(url);
}

// ═══════════════════════════════════════════════════════════
//  PLAYLIST FETCHER
// ═══════════════════════════════════════════════════════════

async function fetchPlaylistVideoIds(playlistId, apiKey) {
	if (!apiKey) throw new Error('No YouTube API key set in settings.');
	let videoIds = [];
	let pageToken = '';
	do {
		const params = new URLSearchParams({
			part: 'contentDetails',
			playlistId: playlistId,
			maxResults: '50',
			key: apiKey,
		});
		if (pageToken) params.set('pageToken', pageToken);
		const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(`YouTube API: ${err?.error?.message || 'HTTP ' + res.status}`);
		}
		const data = await res.json();
		videoIds.push(...(data.items || []).map(i => i?.contentDetails?.videoId).filter(Boolean));
		pageToken = data.nextPageToken || '';
	} while (pageToken);
	return videoIds;
}

// ═══════════════════════════════════════════════════════════
//  SONICFONIA: hidden iframe audio player
// ═══════════════════════════════════════════════════════════

function sonicfonia_createIframe(videoId, loop) {
	sonicfonia_removeIframe();
	const loopParam = loop ? '1' : '0';
	const iframe = document.createElement('iframe');
	iframe.id = 'yts-sonicfonia-iframe';
	iframe.style.cssText =
		'position:fixed;bottom:0;right:0;width:1px;height:1px;' +
		'border:none;opacity:0.01;pointer-events:none;z-index:-1;';
	iframe.allow = 'autoplay; encrypted-media';
	iframe.setAttribute('allowfullscreen', '');
	iframe.src =
		`https://www.youtube.com/embed/${videoId}` +
		`?autoplay=1&loop=${loopParam}&playlist=${videoId}` +
		`&controls=0&rel=0&modestbranding=1&playsinline=1&mute=0`;
	document.body.appendChild(iframe);
	return iframe;
}

function sonicfonia_loadPlaylistInIframe(queue, queueIndex, repeatEnabled) {
	sonicfonia_removeIframe();
	const ordered = [...queue.slice(queueIndex), ...queue.slice(0, queueIndex)];
	const videoId = ordered[0];
	const loopParam = repeatEnabled ? '1' : '0';
	const iframe = document.createElement('iframe');
	iframe.id = 'yts-sonicfonia-iframe';
	iframe.style.cssText =
		'position:fixed;bottom:0;right:0;width:1px;height:1px;' +
		'border:none;opacity:0.01;pointer-events:none;z-index:-1;';
	iframe.allow = 'autoplay; encrypted-media';
	iframe.setAttribute('allowfullscreen', '');
	iframe.src =
		`https://www.youtube.com/embed/${videoId}` +
		`?autoplay=1&loop=${loopParam}&playlist=${ordered.join(',')}` +
		`&controls=0&rel=0&modestbranding=1&playsinline=1&mute=0`;
	document.body.appendChild(iframe);
}

function sonicfonia_removeIframe() {
	const el = document.getElementById('yts-sonicfonia-iframe');
	if (el) el.remove();
}

// ═══════════════════════════════════════════════════════════
//  DEFAULT SETTINGS
// ═══════════════════════════════════════════════════════════

const DEFAULT_SETTINGS = {
	// Float window
	floatWindowEnabled: false,

	// Inline embed
	inlineEmbedPosition: 'below', // 'above' | 'below'

	// Sonicfonia
	sonicfoniaEnabled: true,
	sonicfoniaDefaultOn: true,
	sonicfoniaPrimaryLink: '',
	sonicfoniaApiKey: '',
	sonicfoniaShuffle: false,
	sonicfoniaRepeatEnabled: false,
	sonicfoniaRepeatCount: 3,

	// YT Audio player
	ytAudioTitleColor: '#8fa0ba',
	ytAudioBoldTitle: false,
	ytAudioThumbColor: '#ffffff',
	ytAudioTrackColors: ['#2978ef', '#8ec822', '#dfaa22', '#c84922', '#dd4a86'],
};

// ═══════════════════════════════════════════════════════════
//  SETTINGS TAB
// ═══════════════════════════════════════════════════════════

class YTSuperCutSettingTab extends obsidian.PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h1', { text: 'YT Supercut' });
		containerEl.createEl('p', {
			text: 'All-in-one YouTube toolkit for Obsidian.',
			cls: 'yts-settings-desc',
		});

		// ── Floating Window ──────────────────────────────
		containerEl.createEl('h2', { text: '🎬 Floating Window' });
		containerEl.createEl('p', {
			text: 'Triggered by frontmatter: Float Window: true. Reads YouTube Url property.',
			cls: 'yts-settings-desc',
		});

		// ── Inline Embeds ────────────────────────────────
		containerEl.createEl('h2', { text: '🔗 Inline Embeds' });
		containerEl.createEl('p', {
			text: 'Renders [Text|iframe](youtube.com/…) links as embedded iframes. Controlled by frontmatter: iframe: true.',
			cls: 'yts-settings-desc',
		});

		new obsidian.Setting(containerEl)
			.setName('Embed position')
			.setDesc('Render the iframe above or below the link line.')
			.addDropdown((d) =>
				d
					.addOption('below', 'Below text')
					.addOption('above', 'Above text')
					.setValue(this.plugin.settings.inlineEmbedPosition)
					.onChange(async (v) => {
						this.plugin.settings.inlineEmbedPosition = v;
						await this.plugin.saveSettings();
					})
			);

		// ── Sonicfonia ───────────────────────────────────
		containerEl.createEl('h2', { text: '🎵 Sonicfonia (Background Audio)' });
		containerEl.createEl('p', {
			text: 'Plays YouTube audio silently. Reads YouTube Url and Sonicfonia frontmatter.',
			cls: 'yts-settings-desc',
		});

		new obsidian.Setting(containerEl)
			.setName('YouTube Data API key')
			.setDesc('Required for playlist support. Get a free key from Google Cloud Console → YouTube Data API v3.')
			.addText((t) => {
				t.inputEl.type = 'password';
				t.setPlaceholder('AIza…')
					.setValue(this.plugin.settings.sonicfoniaApiKey)
					.onChange(async (v) => {
						this.plugin.settings.sonicfoniaApiKey = v.trim();
						await this.plugin.saveSettings();
					});
			});

		new obsidian.Setting(containerEl)
			.setName('Enable Sonicfonia by default')
			.setDesc('When a note has no Sonicfonia property, use this default.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.sonicfoniaDefaultOn).onChange(async (v) => {
					this.plugin.settings.sonicfoniaDefaultOn = v;
					await this.plugin.saveSettings();
				})
			);

		new obsidian.Setting(containerEl)
			.setName('Primary link (fallback)')
			.setDesc('Used when the note has no YouTube Url. Single video or playlist URL.')
			.addText((t) =>
				t
					.setPlaceholder('https://youtube.com/watch?v=… or ?list=…')
					.setValue(this.plugin.settings.sonicfoniaPrimaryLink)
					.onChange(async (v) => {
						this.plugin.settings.sonicfoniaPrimaryLink = v.trim();
						await this.plugin.saveSettings();
					})
			);

		new obsidian.Setting(containerEl)
			.setName('Shuffle playlist')
			.setDesc('Randomise playlist track order.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.sonicfoniaShuffle).onChange(async (v) => {
					this.plugin.settings.sonicfoniaShuffle = v;
					await this.plugin.saveSettings();
				})
			);

		new obsidian.Setting(containerEl)
			.setName('Limit repeat count')
			.setDesc('ON = repeat N times. OFF = loop forever.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.sonicfoniaRepeatEnabled).onChange(async (v) => {
					this.plugin.settings.sonicfoniaRepeatEnabled = v;
					await this.plugin.saveSettings();
					this.display();
				})
			);

		if (this.plugin.settings.sonicfoniaRepeatEnabled) {
			new obsidian.Setting(containerEl)
				.setName('Default repeat count')
				.setDesc('1–10 times.')
				.addSlider((s) =>
					s
						.setLimits(1, 10, 1)
						.setValue(this.plugin.settings.sonicfoniaRepeatCount)
						.setDynamicTooltip()
						.onChange(async (v) => {
							this.plugin.settings.sonicfoniaRepeatCount = v;
							await this.plugin.saveSettings();
						})
				);
		}

		// ── YT Audio Player ──────────────────────────────
		containerEl.createEl('h2', { text: '🎚 YT Audio Player (```ytaudio block)' });

		new obsidian.Setting(containerEl)
			.setName('Bold title')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.ytAudioBoldTitle).onChange(async (v) => {
					this.plugin.settings.ytAudioBoldTitle = v;
					await this.plugin.saveSettings();
				})
			);

		new obsidian.Setting(containerEl)
			.setName('Title color')
			.addColorPicker((c) =>
				c.setValue(this.plugin.settings.ytAudioTitleColor).onChange(async (v) => {
					this.plugin.settings.ytAudioTitleColor = v;
					await this.plugin.saveSettings();
				})
			);

		new obsidian.Setting(containerEl)
			.setName('Slider thumb color')
			.addColorPicker((c) =>
				c.setValue(this.plugin.settings.ytAudioThumbColor).onChange(async (v) => {
					this.plugin.settings.ytAudioThumbColor = v;
					await this.plugin.saveSettings();
				})
			);

		containerEl.createEl('h3', { text: 'Progress Bar Gradient (up to 5 colours)' });
		containerEl.createEl('p', {
			text: 'Set a colour to #000000 to skip it.',
			cls: 'yts-settings-desc',
		});

		for (let i = 0; i < 5; i++) {
			new obsidian.Setting(containerEl)
				.setName(`Gradient colour ${i + 1}`)
				.addColorPicker((c) =>
					c
						.setValue(this.plugin.settings.ytAudioTrackColors[i] || '#000000')
						.onChange(async (v) => {
							this.plugin.settings.ytAudioTrackColors[i] = v;
							await this.plugin.saveSettings();
						})
				);
		}

		// ── Credits ──────────────────────────────────────
		containerEl.createEl('h2', { text: 'Credits' });
		const cred = containerEl.createDiv({ cls: 'yts-settings-section' });
		cred.createEl('p', { text: 'Plugin: YT Supercut' });
		cred.createEl('p', { text: 'Author: Waghmare' });
		const ghLine = cred.createEl('p');
		ghLine.createSpan({ text: 'GitHub: ' });
		ghLine.createEl('a', {
			text: 'github.com/sujit-waghmare',
			href: 'https://github.com/sujit-waghmare',
		});
		const payLine = cred.createEl('p');
		payLine.createSpan({ text: 'Support: ' });
		payLine.createEl('a', {
			text: 'paypal.me/waghmaresujit',
			href: 'https://paypal.me/waghmaresujit',
		});
	}
}

// ═══════════════════════════════════════════════════════════
//  MAIN PLUGIN
// ═══════════════════════════════════════════════════════════

class YTSuperCutPlugin extends obsidian.Plugin {
	constructor(app, manifest) {
		super(app, manifest);

		// Float window state
		this.floatOverlay = null;
		this.floatCurrentVideoId = null;
		this._dragState = null;

		// Sonicfonia state
		this.sfQueue = [];
		this.sfQueueIndex = 0;
		this.sfCurrentVideoId = null;
		this.sfIsPlaying = false;
		this.sfRepeatEnabled = true;
		this.sfRepeatCount = 0;
		this.sfPlayCount = 0;
		this._sfTrackTimer = null;

		// Timestamp live-processing state
		this._tsEditorHandler = null;
	}

	// ── Lifecycle ────────────────────────────────────────

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new YTSuperCutSettingTab(this.app, this));

		// Inject styles
		this._injectStyles();

		// Inject YouTube IFrame API (for ytaudio player)
		this._injectYTApi();

		// ── Status bar ──
		this.sfStatusBar = this.addStatusBarItem();
		this.sfStatusBar.addClass('yts-sonicfonia-status');
		this._sfUpdateStatusBar('idle');

		// ── Ribbon ──
		this.addRibbonIcon('youtube', 'YT Supercut: Toggle float window', () => {
			this._floatToggleProperty();
		});
		this.addRibbonIcon('music', 'Sonicfonia: Toggle play/stop', () => {
			this._sfTogglePlayback();
		});

		// ── Commands ──

		// Float window
		this.addCommand({
			id: 'yts-toggle-float',
			name: 'Toggle float window',
			callback: () => this._floatToggleProperty(),
		});

		// Inline embed toggle
		this.addCommand({
			id: 'yts-toggle-iframe',
			name: 'Toggle inline iframe embed (frontmatter)',
			callback: () => this._inlineToggleProperty(),
		});

		// Thumbnail ↔ Video toggle
		this.addCommand({
			id: 'yts-toggle-thumb-video',
			name: 'Toggle: Thumbnail URL ↔ Video URL (cursor line)',
			editorCallback: (editor) => this._thumbVideoToggle(editor),
		});

		// Metadata fetch
		this.addCommand({
			id: 'yts-fetch-metadata',
			name: 'Fetch YouTube metadata for current note',
			callback: () => this._fetchMetadata(),
		});

		// Timestamp conversion
		this.addCommand({
			id: 'yts-convert-timestamps',
			name: 'Convert (mm:ss)/(hh:mm:ss) to clickable timestamp links',
			editorCallback: (editor) => this._convertTimestamps(editor),
		});

		// Sonicfonia
		this.addCommand({
			id: 'yts-sonicfonia-play',
			name: 'Sonicfonia: Play audio for current note',
			callback: () => this._sfPlayCurrentNote(),
		});
		this.addCommand({
			id: 'yts-sonicfonia-stop',
			name: 'Sonicfonia: Stop audio',
			callback: () => this._sfStopAudio(),
		});
		this.addCommand({
			id: 'yts-sonicfonia-toggle',
			name: 'Sonicfonia: Toggle play/stop',
			callback: () => this._sfTogglePlayback(),
		});
		this.addCommand({
			id: 'yts-sonicfonia-next',
			name: 'Sonicfonia: Next track',
			callback: () => this._sfNextTrack(),
		});
		this.addCommand({
			id: 'yts-sonicfonia-prev',
			name: 'Sonicfonia: Previous track',
			callback: () => this._sfPrevTrack(),
		});

		// ── Code block processor: ytaudio ──
		this.registerMarkdownCodeBlockProcessor('ytaudio', (source, el, ctx) => {
			this._ytAudioBlock(source, el, ctx);
		});

		// ── Markdown post-processor: inline [Text|iframe](url) ──
		this.registerMarkdownPostProcessor((el, ctx) => {
			this._processInlineEmbeds(el, ctx);
		});

		// ── Events ──
		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				if (file === this.app.workspace.getActiveFile()) {
					this._floatUpdate(file);
					this._sfOnActiveFileMetaChanged(file);
					this._tsLiveProcess(file);
				}
			})
		);
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				const file = this.app.workspace.getActiveFile();
				if (file) this._floatUpdate(file);
			})
		);
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				const file = this.app.workspace.getActiveFile();
				if (file) {
					this._floatUpdate(file);
					this._sfOnLeafChange(leaf);
				} else {
					this._floatRemove();
					this._sfStopAudio();
				}
			})
		);

		console.log('YT Supercut loaded ✦');
	}

	onunload() {
		this._floatRemove();
		this._sfStopAudio();
		const existing = document.getElementById('yts-styles');
		if (existing) existing.remove();
		console.log('YT Supercut unloaded');
	}

	// ── Settings ────────────────────────────────────────

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// ── Style Injection ─────────────────────────────────

	_injectStyles() {
		if (document.getElementById('yts-styles')) return;
		const link = document.createElement('link');
		link.id = 'yts-styles';
		link.rel = 'stylesheet';
		// Styles are bundled in styles.css which Obsidian loads automatically for plugins
		// This is a no-op placeholder; Obsidian handles styles.css loading
	}

	_injectYTApi() {
		if (document.getElementById('yts-yt-api')) return;
		const tag = document.createElement('script');
		tag.id = 'yts-yt-api';
		tag.src = 'https://www.youtube.com/iframe_api';
		const first = document.getElementsByTagName('script')[0];
		first.parentNode.insertBefore(tag, first);
	}

	// ═══════════════════════════════════════════════════
	//  FEATURE 1: DRAGGABLE FLOATING WINDOW
	// ═══════════════════════════════════════════════════

	async _floatToggleProperty() {
		const file = this.app.workspace.getActiveFile();
		if (!file) return;
		await this.app.fileManager.processFrontMatter(file, (fm) => {
			fm['Float Window'] = !fm['Float Window'];
		});
	}

	_floatUpdate(file) {
		const leaf = this.app.workspace.getLeaf(false);
		if (!leaf) return;
		const view = leaf.view;
		const isReading = view?.getState?.()?.mode === 'preview';

		const cache = this.app.metadataCache.getFileCache(file);
		const fm = cache?.frontmatter;
		const url = fm?.['YouTube Url'];
		const isEnabled = fm?.['Float Window'] === true;

		if (isReading && isEnabled && url) {
			const videoId = extractVideoId(url);
			if (videoId && videoId !== this.floatCurrentVideoId) {
				this._floatCreate(videoId);
			}
		} else {
			this._floatRemove();
		}
	}

	_floatCreate(videoId) {
		this._floatRemove();
		this.floatCurrentVideoId = videoId;

		// Overlay (full-screen, non-blocking)
		this.floatOverlay = document.body.createDiv({ cls: 'yts-float-overlay' });

		// Draggable window
		const win = this.floatOverlay.createDiv({ cls: 'yts-float-window' });

		// Start position: top-centre
		win.style.top = '60px';
		win.style.left = '50%';
		win.style.transform = 'translateX(-50%)';

		// Drag handle bar
		const handle = win.createDiv({ cls: 'yts-drag-handle' });
		const grip = handle.createDiv({ cls: 'yts-drag-grip' });
		for (let i = 0; i < 6; i++) grip.createSpan();

		const closeBtn = handle.createEl('button', { cls: 'yts-float-close', text: '✕' });
		closeBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this._floatRemove();
			// Also toggle off the frontmatter property
			const file = this.app.workspace.getActiveFile();
			if (file) {
				this.app.fileManager.processFrontMatter(file, (fm) => {
					fm['Float Window'] = false;
				});
			}
		});

		// iframe
		const iframe = document.createElement('iframe');
		iframe.src = `https://www.youtube.com/embed/${videoId}`;
		iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
		iframe.allowFullscreen = true;
		iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:none;';
		win.appendChild(iframe);

		// ── Drag Logic ──
		let startX, startY, startLeft, startTop;

		const onMouseDown = (e) => {
			if (e.target === closeBtn) return;
			e.preventDefault();

			// On first drag, resolve the transform-based centering to px values
			const rect = win.getBoundingClientRect();
			win.style.transform = 'none';
			win.style.left = rect.left + 'px';
			win.style.top = rect.top + 'px';

			startX = e.clientX;
			startY = e.clientY;
			startLeft = rect.left;
			startTop = rect.top;

			handle.style.cursor = 'grabbing';

			const onMouseMove = (e2) => {
				const dx = e2.clientX - startX;
				const dy = e2.clientY - startY;
				const newLeft = Math.max(0, Math.min(window.innerWidth - win.offsetWidth, startLeft + dx));
				const newTop = Math.max(0, Math.min(window.innerHeight - win.offsetHeight, startTop + dy));
				win.style.left = newLeft + 'px';
				win.style.top = newTop + 'px';
			};

			const onMouseUp = () => {
				handle.style.cursor = 'grab';
				document.removeEventListener('mousemove', onMouseMove);
				document.removeEventListener('mouseup', onMouseUp);
			};

			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mouseup', onMouseUp);
		};

		handle.addEventListener('mousedown', onMouseDown);
	}

	_floatRemove() {
		if (this.floatOverlay) {
			this.floatOverlay.remove();
			this.floatOverlay = null;
			this.floatCurrentVideoId = null;
		}
	}

	// ═══════════════════════════════════════════════════
	//  FEATURE 2: INLINE EMBEDS  [Text|iframe](url)
	// ═══════════════════════════════════════════════════

	async _inlineToggleProperty() {
		const file = this.app.workspace.getActiveFile();
		if (!file) return;
		await this.app.fileManager.processFrontMatter(file, (fm) => {
			fm['iframe'] = !fm['iframe'];
		});
	}

	_processInlineEmbeds(el, ctx) {
		// Only render when frontmatter iframe: true
		const file = this.app.workspace.getActiveFile();
		if (!file) return;
		const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
		if (!fm || fm['iframe'] !== true) return;

		// Find all <a> tags that look like YouTube links with the |iframe marker
		const links = el.querySelectorAll('a');
		links.forEach((a) => {
			const href = a.href || '';
			const text = a.textContent || '';
			// Match [Text|iframe](yturl) — the rendered <a> text will be "Text|iframe"
			if (!text.includes('|iframe')) return;
			const videoId = extractVideoId(href);
			if (!videoId) return;

			const wrap = document.createElement('div');
			wrap.addClass('yts-inline-wrap');
			const iframe = document.createElement('iframe');
			iframe.src = `https://www.youtube.com/embed/${videoId}`;
			iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
			iframe.allowFullscreen = true;
			wrap.appendChild(iframe);

			// Position above or below the link's parent paragraph
			const parent = a.closest('p') || a.parentElement;
			if (this.settings.inlineEmbedPosition === 'above') {
				parent.parentElement.insertBefore(wrap, parent);
			} else {
				parent.parentElement.insertBefore(wrap, parent.nextSibling);
			}
		});
	}

	// ═══════════════════════════════════════════════════
	//  FEATURE 3: THUMBNAIL ↔ VIDEO URL TOGGLE
	// ═══════════════════════════════════════════════════

	_thumbVideoToggle(editor) {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);

		// Find any YouTube-related URL on this line
		const thumbPattern = /https?:\/\/img\.youtube\.com\/vi\/([\w-]{11})\/[^\s\)\"]+/g;
		const videoPattern = /https?:\/\/(?:(?:www\.)?youtube\.com\/(?:watch\?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})[^\s\)\"']*/g;

		let newLine = line;
		let changed = false;

		// Thumb → Video
		newLine = newLine.replace(thumbPattern, (match, vid) => {
			changed = true;
			return `https://youtu.be/${vid}`;
		});

		// Video → Thumb (only if thumb pattern didn't already fire)
		if (!changed) {
			newLine = newLine.replace(videoPattern, (match, vid) => {
				changed = true;
				return thumbFromVideoId(vid);
			});
		}

		if (changed) {
			editor.setLine(cursor.line, newLine);
			new obsidian.Notice('YT Supercut: URL toggled ↔');
		} else {
			new obsidian.Notice('YT Supercut: No YouTube URL found on this line.');
		}
	}

	// ═══════════════════════════════════════════════════
	//  FEATURE 4: METADATA FETCHER
	// ═══════════════════════════════════════════════════

	async _fetchMetadata() {
		const file = this.app.workspace.getActiveFile();
		if (!file) { new obsidian.Notice('YT Supercut: No active note.'); return; }

		const cache = this.app.metadataCache.getFileCache(file);
		let url = cache?.frontmatter?.['YouTube Url'];
		if (!url) {
			// Try to extract from body
			const content = await this.app.vault.read(file);
			const m = content.match(/\[Watch video\]\((https?:\/\/[^)]+)\)/i);
			if (m) url = m[1];
		}
		if (!url) {
			new obsidian.Notice('YT Supercut: No YouTube Url found in note.'); return;
		}
		url = cleanYouTubeUrl(url.trim());

		const videoId = extractVideoId(url);
		if (!videoId) { new obsidian.Notice('YT Supercut: Invalid YouTube URL.'); return; }

		new obsidian.Notice('YT Supercut: Fetching metadata…');

		let fetchedTitle = '';
		let fetchedChannelName = '';
		let fetchedDescriptionBlock = '';
		const thumbUrl = thumbFromVideoId(videoId);

		try {
			const oembedRes = await obsidian.requestUrl({
				url: `https://www.youtube.com/oembed?format=json&url=${url}`,
			});
			const data = JSON.parse(oembedRes.text);
			fetchedTitle = data.title || '';
			fetchedChannelName = data.author_name || '';
		} catch (e) {
			console.warn('YT Supercut: oEmbed fetch failed', e);
		}

		try {
			const rawRes = await obsidian.requestUrl({ url });
			const rawHtml = rawRes.text;
			const playerMatch = rawHtml.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/);
			if (playerMatch && playerMatch[1]) {
				const playerData = JSON.parse(playerMatch[1]);
				let rawDesc = playerData.videoDetails?.shortDescription || '';
				rawDesc = rawDesc.replace(/#[\w-]+/g, '').trim();
				if (rawDesc) {
					const lines = rawDesc.split(/\r?\n/).map((l) => `> ${l}`).join('\n');
					fetchedDescriptionBlock =
						`> <details>\n> <summary>Description</summary>\n> \n${lines}\n> \n> </details>\n\n`;
				}
			}
		} catch (e) {
			console.warn('YT Supercut: raw HTML fetch failed', e);
		}

		let content = await this.app.vault.read(file);
		const fm = cache?.frontmatter;
		const existingChannel = fm?.['Channel UID'] || '';

		// Bulletproof frontmatter slicing
		let frontmatterStr = '';
		let bodyStr = content;
		if (cache?.frontmatterPosition) {
			const end = cache.frontmatterPosition.end.offset;
			frontmatterStr = content.substring(0, end);
			bodyStr = content.substring(end).replace(/^\n+/, '\n');
			frontmatterStr += '\n';
		}

		const h1Match = bodyStr.match(/^#\s+(.*)$/m);
		const displayTitle = fetchedTitle || (h1Match ? h1Match[1] : 'YouTube Video');
		const rawChannel = existingChannel || fetchedChannelName || 'Channel Name';
		const cleanChannel = rawChannel.replace(/^@/, '');
		const channelLink = rawChannel.startsWith('@')
			? `https://youtube.com/${rawChannel}`
			: `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanChannel)}`;

		if (!h1Match) bodyStr = `# ${displayTitle}\n\n` + bodyStr;
		if (!bodyStr.includes('![Thumbnail]')) {
			bodyStr = bodyStr.replace(/^#\s+.*$/m, (m) => m + `\n\n![Thumbnail](${thumbUrl})`);
		}
		if (fetchedDescriptionBlock && !bodyStr.includes('<summary>Description</summary>')) {
			bodyStr = bodyStr.replace(/!\[Thumbnail\]\([^)]+\)/, (m) => m + '\n\n' + fetchedDescriptionBlock.trim());
		}

		let injectionBlock = '';
		if (!bodyStr.includes('```ytaudio')) {
			injectionBlock += `\`\`\`ytaudio\nTitle: ${displayTitle}\nYouTube Url: ${url}\n\`\`\`\n\n`;
		}
		const hasChannel = bodyStr.includes('👤');
		const hasWatch = bodyStr.includes('🔗');
		if (!hasChannel && !hasWatch) {
			injectionBlock += `👤 [${cleanChannel}](${channelLink}) 🔗 [Watch video](${url})\n`;
		} else {
			if (hasChannel) {
				bodyStr = bodyStr.replace(/👤\s*\[([^\]]+)\]\([^)]+\)/, `👤 [${cleanChannel}](${channelLink})`);
			}
			if (hasWatch) {
				bodyStr = bodyStr.replace(/\[Watch video\]\((https?:\/\/[^)]+)\)/gi, `[Watch video](${url})`);
			}
		}
		if (injectionBlock) {
			if (bodyStr.includes('</details>')) {
				bodyStr = bodyStr.replace(/<\/details>/, (m) => m + '\n\n' + injectionBlock.trim());
			} else {
				bodyStr = bodyStr.replace(/!\[Thumbnail\]\([^)]+\)/, (m) => m + '\n\n' + injectionBlock.trim());
			}
		}

		// Timestamp pass
		bodyStr = this._applyTimestampConversion(bodyStr, url);

		await this.app.vault.modify(file, frontmatterStr + bodyStr);

		// Write frontmatter
		await this.app.fileManager.processFrontMatter(file, (fmw) => {
			const currentTs = fmw['Timestamp'] !== undefined ? fmw['Timestamp'] : true;
			const currentSf = fmw['Sonicfonia'] !== undefined ? fmw['Sonicfonia'] : false;
			const currentIframe = fmw['iframe'] !== undefined ? fmw['iframe'] : false;
			delete fmw['YouTube Url'];
			delete fmw['Thumbnail Url'];
			delete fmw['Channel UID'];
			delete fmw['Timestamp'];
			delete fmw['Sonicfonia'];
			delete fmw['iframe'];
			fmw['YouTube Url'] = url;
			fmw['Thumbnail Url'] = thumbUrl;
			fmw['Channel UID'] = rawChannel;
			fmw['Timestamp'] = currentTs;
			fmw['Sonicfonia'] = currentSf;
			fmw['iframe'] = currentIframe;
		});

		new obsidian.Notice('YT Supercut: Metadata applied ✓');
	}

	// ═══════════════════════════════════════════════════
	//  FEATURE 5: LIVE TIMESTAMP CONVERSION
	// ═══════════════════════════════════════════════════

	_applyTimestampConversion(body, videoUrl) {
		const joinSymbol = videoUrl.includes('?') ? '&' : '?';
		const tsRegex =
			/\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(?<!\[)([[({])?\b(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\b([}\])])?(?!\])/g;

		return body.replace(tsRegex, (match, linkText, linkUrl, open, hh, mm, ss, close) => {
			if (linkUrl) return match; // already a link
			const hours = hh ? parseInt(hh) : 0;
			const minutes = parseInt(mm);
			const totalMinutes = hours * 60 + minutes;
			const timeParam = `${totalMinutes}m${ss}s`;
			let label = match;
			if (label.startsWith('[') && label.endsWith(']')) {
				label = `(${label.substring(1, label.length - 1)})`;
			}
			return `[${label}](${videoUrl}${joinSymbol}t=${timeParam})`;
		});
	}

	_tsLiveProcess(file) {
		// Only run when Timestamp: true in frontmatter
		const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
		if (!fm || fm['Timestamp'] !== true) return;
		const url = fm['YouTube Url'];
		if (!url) return;

		// Run on the active editor without full file write (post-process in reading view)
		// For live-in-editor conversion, we hook the editor-change event once per file switch.
		// Approach: debounced vault modify so we don't hammer IO.
		if (this._tsDebounce) clearTimeout(this._tsDebounce);
		this._tsDebounce = setTimeout(async () => {
			const currentFile = this.app.workspace.getActiveFile();
			if (!currentFile || currentFile.path !== file.path) return;
			const content = await this.app.vault.read(file);
			const cache2 = this.app.metadataCache.getFileCache(file);
			let bodyStr = content;
			let frontmatterStr = '';
			if (cache2?.frontmatterPosition) {
				const end = cache2.frontmatterPosition.end.offset;
				frontmatterStr = content.substring(0, end) + '\n';
				bodyStr = content.substring(end).replace(/^\n+/, '\n');
			}
			const converted = this._applyTimestampConversion(bodyStr, cleanYouTubeUrl(url));
			if (converted !== bodyStr) {
				await this.app.vault.modify(file, frontmatterStr + converted);
			}
		}, 1200);
	}

	_convertTimestamps(editor) {
		// Command-triggered: convert entire current note
		const file = this.app.workspace.getActiveFile();
		if (!file) return;
		const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
		const url = fm?.['YouTube Url'];
		if (!url) {
			new obsidian.Notice('YT Supercut: No YouTube Url in frontmatter.'); return;
		}
		const fullText = editor.getValue();
		const converted = this._applyTimestampConversion(fullText, cleanYouTubeUrl(url));
		if (converted !== fullText) {
			editor.setValue(converted);
			new obsidian.Notice('YT Supercut: Timestamps converted ✓');
		} else {
			new obsidian.Notice('YT Supercut: No plain timestamps found.');
		}
	}

	// ═══════════════════════════════════════════════════
	//  FEATURE 6: SONICFONIA (background audio)
	// ═══════════════════════════════════════════════════

	async _sfPlayCurrentNote() {
		const file = this.app.workspace.getActiveFile();
		if (!file) { new obsidian.Notice('YT Supercut: No active note.'); return; }
		await this._sfPlayForFile(file);
	}

	async _sfPlayForFile(file) {
		const sfRaw = getFrontmatterValue(this.app, file, 'Sonicfonia');
		const sfOn = sfRaw === null
			? this.settings.sonicfoniaDefaultOn
			: sfRaw === true || sfRaw === 'true';
		if (!sfOn) { this._sfStopAudio(); return; }

		let url = getFrontmatterValue(this.app, file, 'YouTube Url');
		if (!url || String(url).trim() === '') url = this.settings.sonicfoniaPrimaryLink;
		if (!url || String(url).trim() === '') {
			new obsidian.Notice('YT Supercut: No YouTube URL in note and no fallback set.');
			this._sfStopAudio();
			return;
		}
		url = String(url).trim();

		const repRaw = getFrontmatterValue(this.app, file, 'Repeat');
		this.sfRepeatEnabled = repRaw === null ? true : repRaw === true || repRaw === 'true';
		this.sfRepeatCount = this.settings.sonicfoniaRepeatEnabled ? this.settings.sonicfoniaRepeatCount : 0;
		this.sfPlayCount = 0;

		if (isPlaylistUrl(url)) {
			await this._sfLoadPlaylist(url);
		} else {
			const videoId = extractVideoId(url);
			if (!videoId) { new obsidian.Notice('YT Supercut: Invalid YouTube URL.'); return; }
			if (this.sfCurrentVideoId === videoId && this.sfIsPlaying && this.sfQueue.length <= 1) return;
			this.sfQueue = [videoId];
			this.sfQueueIndex = 0;
			this._sfPlayCurrent();
		}
	}

	async _sfLoadPlaylist(url) {
		const playlistId = extractPlaylistId(url);
		if (!playlistId) { new obsidian.Notice('YT Supercut: Bad playlist URL.'); return; }
		if (!this.settings.sonicfoniaApiKey) {
			new obsidian.Notice('YT Supercut: YouTube API key not set. Settings → YT Supercut.');
			return;
		}
		this._sfUpdateStatusBar('loading');
		new obsidian.Notice('Sonicfonia: Loading playlist…');
		try {
			let ids = await fetchPlaylistVideoIds(playlistId, this.settings.sonicfoniaApiKey);
			if (!ids.length) { new obsidian.Notice('Sonicfonia: Playlist empty or private.'); this._sfUpdateStatusBar('idle'); return; }
			if (this.settings.sonicfoniaShuffle) ids = shuffleArray(ids);
			this.sfQueue = ids;
			this.sfQueueIndex = 0;
			this._sfPlayCurrent();
			new obsidian.Notice(`Sonicfonia: Loaded ${ids.length} tracks`);
		} catch (e) {
			console.error('Sonicfonia playlist error:', e);
			new obsidian.Notice(`Sonicfonia: ${e.message}`);
			this._sfUpdateStatusBar('idle');
		}
	}

	_sfPlayCurrent() {
		if (!this.sfQueue.length) return;
		const videoId = this.sfQueue[this.sfQueueIndex];
		if (!videoId) return;
		this.sfCurrentVideoId = videoId;
		this.sfIsPlaying = true;
		const isSingle = this.sfQueue.length === 1;
		const nativeLoop = isSingle && this.sfRepeatEnabled && this.sfRepeatCount === 0;
		if (this.sfQueue.length > 1) {
			sonicfonia_loadPlaylistInIframe(this.sfQueue, this.sfQueueIndex, this.sfRepeatEnabled);
		} else {
			sonicfonia_createIframe(videoId, nativeLoop);
		}
		this._sfUpdateStatusBar('playing');
	}

	_sfNextTrack() {
		if (!this.sfQueue.length) return;
		this.sfQueueIndex = (this.sfQueueIndex + 1) % this.sfQueue.length;
		this._sfPlayCurrent();
		new obsidian.Notice(`Sonicfonia: Track ${this.sfQueueIndex + 1}/${this.sfQueue.length}`);
	}

	_sfPrevTrack() {
		if (!this.sfQueue.length) return;
		this.sfQueueIndex = (this.sfQueueIndex - 1 + this.sfQueue.length) % this.sfQueue.length;
		this._sfPlayCurrent();
		new obsidian.Notice(`Sonicfonia: Track ${this.sfQueueIndex + 1}/${this.sfQueue.length}`);
	}

	_sfStopAudio() {
		sonicfonia_removeIframe();
		if (this._sfTrackTimer) { clearTimeout(this._sfTrackTimer); this._sfTrackTimer = null; }
		this.sfCurrentVideoId = null;
		this.sfIsPlaying = false;
		this.sfQueue = [];
		this.sfQueueIndex = 0;
		this._sfUpdateStatusBar('idle');
	}

	_sfTogglePlayback() {
		if (this.sfIsPlaying) {
			this._sfStopAudio();
		} else {
			this._sfPlayCurrentNote();
		}
	}

	_sfOnLeafChange(leaf) {
		if (!leaf) return;
		const view = leaf.view;
		if (view && view.file) {
			this._sfPlayForFile(view.file);
		} else {
			this._sfStopAudio();
		}
	}

	_sfOnActiveFileMetaChanged(file) {
		const sfRaw = getFrontmatterValue(this.app, file, 'Sonicfonia');
		const sfOn = sfRaw === null
			? this.settings.sonicfoniaDefaultOn
			: sfRaw === true || sfRaw === 'true';
		if (!sfOn) {
			this._sfStopAudio();
		} else {
			this._sfPlayForFile(file);
		}
	}

	_sfUpdateStatusBar(state) {
		const map = {
			idle: '🎵 Sonicfonia',
			loading: '⏳ Loading…',
			playing: '▶ Sonicfonia',
			paused: '⏸ Sonicfonia',
		};
		const queueInfo = this.sfQueue.length > 1
			? ` [${this.sfQueueIndex + 1}/${this.sfQueue.length}]`
			: '';
		this.sfStatusBar.setText(
			state === 'playing' ? (map[state] || map.idle) + queueInfo : (map[state] || map.idle)
		);
	}

	// ═══════════════════════════════════════════════════
	//  FEATURE 7: YT AUDIO PLAYER  ```ytaudio block
	// ═══════════════════════════════════════════════════

	_ytAudioBlock(source, el, ctx) {
		let title = 'Unknown Audio';
		let url = '';
		source.split('\n').forEach((line) => {
			const lower = line.toLowerCase();
			if (lower.startsWith('title:')) title = line.substring(6).trim();
			if (lower.startsWith('youtube url:')) url = line.substring(12).trim();
		});

		const urlMatch = url.match(
			/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|live\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
		);
		if (!urlMatch) {
			el.createEl('div', { text: 'Error: Invalid YouTube URL.', cls: 'yt-error' });
			return;
		}
		const videoId = urlMatch[1];

		const container = el.createEl('div', { cls: 'yt-audio-custom-container' });
		const topRow = container.createEl('div', { cls: 'yt-top-row' });

		const titleEl = topRow.createEl('div', { cls: 'yt-title', text: title });
		titleEl.style.color = this.settings.ytAudioTitleColor;
		if (this.settings.ytAudioBoldTitle) titleEl.style.fontWeight = 'bold';

		const controlsEl = topRow.createEl('div', { cls: 'yt-controls' });
		const playBtn = controlsEl.createEl('button', { cls: 'yt-play-btn', text: '▶' });
		const timeDisp = controlsEl.createEl('span', { cls: 'yt-time', text: '0:00 / 0:00' });
		const editBtn = controlsEl.createEl('button', { cls: 'yt-edit-btn', text: '⚙️' });

		editBtn.onclick = () => {
			const view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
			if (view) {
				const info = ctx.getSectionInfo(el);
				if (info) {
					view.editor.setCursor({ line: info.lineStart, ch: 0 });
					view.editor.focus();
				}
			}
		};

		const bottomRow = container.createEl('div', { cls: 'yt-bottom-row' });
		const slider = bottomRow.createEl('input', {
			type: 'range',
			cls: 'yt-slider',
			attr: { min: 0, max: 100, value: 0 },
		});

		const validColors = this.settings.ytAudioTrackColors.filter(
			(c) => c && c.trim() !== '#000000' && c.trim() !== ''
		);
		const gradientStr =
			validColors.length > 1
				? `linear-gradient(to right, ${validColors.join(', ')})`
				: validColors.length === 1
				? validColors[0]
				: '#444';
		slider.style.setProperty('--track-bg', gradientStr);
		slider.style.setProperty('--thumb-color', this.settings.ytAudioThumbColor);

		const hiddenPlayer = el.createEl('div', { cls: 'yt-hidden-player' });

		const initPlayer = () => {
			const player = new window.YT.Player(hiddenPlayer, {
				height: '0',
				width: '0',
				videoId: videoId,
				playerVars: { playsinline: 1, controls: 0, disablekb: 1 },
				events: {
					onReady: () => {
						playBtn.onclick = () => {
							if (player.getPlayerState() === window.YT.PlayerState.PLAYING) {
								player.pauseVideo();
								playBtn.innerText = '▶';
							} else {
								player.playVideo();
								playBtn.innerText = '❚❚';
							}
						};
						slider.oninput = (e) => {
							const vd = player.getVideoData?.() ?? {};
							const dur = player.getDuration();
							if (!vd.isLive && dur) player.seekTo((e.target.value / 100) * dur, true);
						};
						setInterval(() => {
							if (player.getPlayerState() === window.YT.PlayerState.PLAYING) {
								const cur = player.getCurrentTime();
								const dur = player.getDuration();
								const vd = player.getVideoData?.() ?? {};
								const isLive = vd.isLive || dur === 0;
								if (isLive) {
									timeDisp.innerText = '🔴 LIVE';
									slider.value = 100;
									slider.style.pointerEvents = 'none';
								} else {
									slider.style.pointerEvents = 'auto';
									if (document.activeElement !== slider && dur) slider.value = (cur / dur) * 100;
									timeDisp.innerText = formatTime(cur) + ' / ' + formatTime(dur);
								}
							}
						}, 500);
					},
					onStateChange: (event) => {
						if (event.data === window.YT.PlayerState.ENDED) {
							playBtn.innerText = '▶';
							slider.value = 0;
							const dur = player.getDuration();
							timeDisp.innerText = dur === 0 ? 'Ended' : '0:00 / ' + formatTime(dur);
						}
					},
				},
			});
		};

		const waitForYT = setInterval(() => {
			if (window.YT && window.YT.Player) {
				clearInterval(waitForYT);
				initPlayer();
			}
		}, 100);
	}
}

module.exports = YTSuperCutPlugin;
