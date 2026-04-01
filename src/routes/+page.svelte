<script lang="ts">
	/**
	 * Muted base + black ink clipped by .reveal-line__ink-shell width (set in JS).
	 * Avoids iOS/Android bugs with mask/clip-path + calc(var(--reveal)).
	 */
	type WipeParams = { staggerIndex?: number };

	const LINE_STAGGER = 0.26;

	/** One scroll/touch batch for all lines — many listeners on mobile WebKit can break updates. */
	const wipeSubscribers = new Set<() => void>();
	let wipeRaf = 0;

	function flushWipeSubscribers() {
		wipeRaf = 0;
		for (const fn of wipeSubscribers) fn();
	}

	function scheduleWipeFlush() {
		if (wipeRaf) return;
		wipeRaf = requestAnimationFrame(flushWipeSubscribers);
	}

	let globalWipeListeners = false;

	function ensureWipeScrollPipeline() {
		if (globalWipeListeners || typeof window === 'undefined') return;
		globalWipeListeners = true;
		const s = () => scheduleWipeFlush();
		window.addEventListener('scroll', s, { passive: true, capture: true });
		document.documentElement.addEventListener('scroll', s, { passive: true });
		window.addEventListener('resize', s);
		window.visualViewport?.addEventListener('scroll', s);
		window.visualViewport?.addEventListener('resize', s);
		window.addEventListener('orientationchange', s);
		/* iOS: momentum / rubber-band; keeps progress in sync while finger moves */
		window.addEventListener('touchmove', s, { passive: true });
	}

	function scrollRevealWipe(node: HTMLElement, params: WipeParams = {}) {
		const reduce =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

		const shell = () => node.querySelector<HTMLElement>('.reveal-line__ink-shell');
		const ink = () => node.querySelector<HTMLElement>('.reveal-line__ink');

		const syncInkWidth = () => {
			const el = ink();
			if (!el) return;
			const w = node.getBoundingClientRect().width;
			if (w > 0) el.style.width = `${w}px`;
		};

		if (reduce) {
			requestAnimationFrame(() => {
				const sh = shell();
				if (sh) sh.style.width = '100%';
				syncInkWidth();
			});
			return {};
		}

		let staggerIndex = params.staggerIndex ?? 0;

		const update = () => {
			syncInkWidth();
			const rect = node.getBoundingClientRect();
			const vv = window.visualViewport;
			const vh = (vv?.height ?? window.innerHeight) || 1;
			const bandStart = vh * 0.88;
			const bandEnd = vh * 0.2;
			const top = rect.top;
			let p = (bandStart - top) / (bandStart - bandEnd);
			p -= staggerIndex * LINE_STAGGER;
			p = Math.max(0, Math.min(1, p));
			const sh = shell();
			if (sh) sh.style.width = `${p * 100}%`;
		};

		const ro =
			typeof ResizeObserver !== 'undefined'
				? new ResizeObserver(() => {
						syncInkWidth();
						scheduleWipeFlush();
					})
				: null;
		ro?.observe(node);

		wipeSubscribers.add(update);
		ensureWipeScrollPipeline();

		requestAnimationFrame(() => {
			update();
			requestAnimationFrame(() => {
				update();
				scheduleWipeFlush();
			});
		});

		if (typeof document !== 'undefined' && 'fonts' in document) {
			void document.fonts.ready.then(() => {
				syncInkWidth();
				scheduleWipeFlush();
			});
		}

		return {
			update(newParams: WipeParams) {
				staggerIndex = newParams.staggerIndex ?? 0;
				scheduleWipeFlush();
			},
			destroy() {
				ro?.disconnect();
				wipeSubscribers.delete(update);
			}
		};
	}
</script>

<div class="home">
	<section class="home__section" aria-labelledby="home-intro-heading">
		<h2 id="home-intro-heading" class="visually-hidden">Introduction</h2>
		<p class="visually-hidden">
			Selected work spans product systems, design tooling, and narrative sites for teams who care how
			things feel as much as how they ship. This space is a placeholder: case studies, process notes,
			and experiments will land here as they’re ready. Nothing below is final copy. If you’re looking
			for a collaborator on discovery, IA, UI, or front-end craft, say hello — the usual channels are
			fine.
		</p>

		<div class="home__lines home__lines--hero home__lines--first">
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 0 }}>
				<span class="reveal-line__muted" aria-hidden="true">Selected work spans product systems,</span>
				<div class="reveal-line__ink-shell" aria-hidden="true">
					<span class="reveal-line__ink">Selected work spans product systems,</span>
				</div>
			</div>
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 1 }}>
				<span class="reveal-line__muted" aria-hidden="true">design tooling, and narrative sites</span>
				<div class="reveal-line__ink-shell" aria-hidden="true">
					<span class="reveal-line__ink">design tooling, and narrative sites</span>
				</div>
			</div>
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 2 }}>
				<span class="reveal-line__muted" aria-hidden="true"
					>for teams who care how things feel as much as how they ship.</span
				>
				<div class="reveal-line__ink-shell" aria-hidden="true">
					<span class="reveal-line__ink">for teams who care how things feel as much as how they ship.</span>
				</div>
			</div>
		</div>

		<div class="home__lines home__lines--hero">
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 0 }}>
				<span class="reveal-line__muted" aria-hidden="true">This space is a placeholder: case studies,</span>
				<div class="reveal-line__ink-shell" aria-hidden="true">
					<span class="reveal-line__ink">This space is a placeholder: case studies,</span>
				</div>
			</div>
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 1 }}>
				<span class="reveal-line__muted" aria-hidden="true">process notes, and experiments will land here</span>
				<div class="reveal-line__ink-shell" aria-hidden="true">
					<span class="reveal-line__ink">process notes, and experiments will land here</span>
				</div>
			</div>
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 2 }}>
				<span class="reveal-line__muted" aria-hidden="true">as they’re ready. Nothing below is final copy.</span>
				<div class="reveal-line__ink-shell" aria-hidden="true">
					<span class="reveal-line__ink">as they’re ready. Nothing below is final copy.</span>
				</div>
			</div>
		</div>

		<div class="home__lines home__lines--hero">
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 0 }}>
				<span class="reveal-line__muted" aria-hidden="true">If you’re looking for a collaborator on</span>
				<div class="reveal-line__ink-shell" aria-hidden="true">
					<span class="reveal-line__ink">If you’re looking for a collaborator on</span>
				</div>
			</div>
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 1 }}>
				<span class="reveal-line__muted" aria-hidden="true">discovery, IA, UI, or front-end craft,</span>
				<div class="reveal-line__ink-shell" aria-hidden="true">
					<span class="reveal-line__ink">discovery, IA, UI, or front-end craft,</span>
				</div>
			</div>
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 2 }}>
				<span class="reveal-line__muted" aria-hidden="true">say hello — the usual channels are fine.</span>
				<div class="reveal-line__ink-shell" aria-hidden="true">
					<span class="reveal-line__ink">say hello — the usual channels are fine.</span>
				</div>
			</div>
		</div>

		<div class="home__lines home__lines--footer">
			<div class="reveal-line reveal-line--small" use:scrollRevealWipe={{ staggerIndex: 0 }}>
				<span class="reveal-line__muted" aria-hidden="true">— Mock block for scroll rhythm</span>
				<div class="reveal-line__ink-shell" aria-hidden="true">
					<span class="reveal-line__ink">— Mock block for scroll rhythm</span>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.home {
		width: 100%;
		max-width: none;
		padding-bottom: min(25vh, 12rem);
	}

	.home__section {
		display: flex;
		flex-direction: column;
		gap: clamp(4rem, 14vh, 9rem);
	}

	.home__lines {
		display: flex;
		flex-direction: column;
		gap: clamp(0.15em, 0.8vh, 0.45em);
		min-height: min(85vh, 52rem);
		min-height: min(85svh, 52rem);
		justify-content: center;
	}

	.home__lines--first {
		min-height: 100vh;
		min-height: 100svh;
		justify-content: flex-end;
		padding-bottom: clamp(1.25rem, 5vh, 3.5rem);
	}

	.home__lines--footer {
		min-height: 45vh;
		min-height: 45svh;
		justify-content: flex-end;
		padding-bottom: clamp(2rem, 8vh, 5rem);
	}

	.reveal-line {
		position: relative;
		display: block;
		margin: 0;
		font-family: var(--font-sans);
		font-size: clamp(1.75rem, 5.8vw + 0.5vh, 5.25rem);
		font-weight: 500;
		letter-spacing: -0.035em;
		line-height: 0.98;
		text-align: left;
		text-wrap: balance;
		/* lets % height resolve for the ink shell on WebKit */
		min-height: 0;
	}

	.reveal-line--small {
		font-size: clamp(0.65rem, 1.65vw + 0.15vh, 1.1rem);
		font-weight: 500;
		letter-spacing: 0.14em;
		line-height: 1.25;
		text-transform: uppercase;
	}

	.reveal-line__muted {
		display: block;
		width: 100%;
		color: #cccccc;
	}

	.reveal-line__ink-shell {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 0%;
		overflow: hidden;
		pointer-events: none;
	}

	.reveal-line__ink {
		display: block;
		position: absolute;
		left: 0;
		top: 0;
		color: #000000;
		box-sizing: border-box;
		/* width set in JS (px) to full line — must not be % of narrow shell */
	}
</style>
