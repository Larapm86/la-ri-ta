<script lang="ts">
	/**
	 * Sharp vertical wipe: left = full ink (#000), right = muted (#ccc).
	 * --reveal 0…1 tracks scroll so each line progresses independently.
	 */
	type WipeParams = { staggerIndex?: number };

	const LINE_STAGGER = 0.26;

	function scrollRevealWipe(node: HTMLElement, params: WipeParams = {}) {
		const reduce =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

		if (reduce) {
			node.style.setProperty('--reveal', '1');
			return {};
		}

		let staggerIndex = params.staggerIndex ?? 0;
		let ticking = false;

		const update = () => {
			const rect = node.getBoundingClientRect();
			// visualViewport matches mobile browser chrome; innerHeight alone can drift on iOS
			const vv = window.visualViewport;
			const vh = (vv?.height ?? window.innerHeight) || 1;
			// Band: low on screen → muted; higher → full ink
			const bandStart = vh * 0.88;
			const bandEnd = vh * 0.2;
			const top = rect.top;
			let p = (bandStart - top) / (bandStart - bandEnd);
			p -= staggerIndex * LINE_STAGGER;
			p = Math.max(0, Math.min(1, p));
			node.style.setProperty('--reveal', p.toFixed(4));
		};

		const onScrollOrResize = () => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				ticking = false;
				update();
			});
		};

		// First paint on mobile often has rect(0); defer + listen on visualViewport for iOS
		const scheduleUpdate = () => {
			onScrollOrResize();
			requestAnimationFrame(() => {
				requestAnimationFrame(onScrollOrResize);
			});
		};
		scheduleUpdate();

		window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
		window.addEventListener('resize', onScrollOrResize);
		window.visualViewport?.addEventListener('scroll', onScrollOrResize);
		window.visualViewport?.addEventListener('resize', onScrollOrResize);

		return {
			update(newParams: WipeParams) {
				staggerIndex = newParams.staggerIndex ?? 0;
				scheduleUpdate();
			},
			destroy() {
				window.removeEventListener('scroll', onScrollOrResize, true);
				window.removeEventListener('resize', onScrollOrResize);
				window.visualViewport?.removeEventListener('scroll', onScrollOrResize);
				window.visualViewport?.removeEventListener('resize', onScrollOrResize);
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
				<span class="reveal-line__ink" aria-hidden="true">Selected work spans product systems,</span>
			</div>
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 1 }}>
				<span class="reveal-line__muted" aria-hidden="true">design tooling, and narrative sites</span>
				<span class="reveal-line__ink" aria-hidden="true">design tooling, and narrative sites</span>
			</div>
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 2 }}>
				<span class="reveal-line__muted" aria-hidden="true"
					>for teams who care how things feel as much as how they ship.</span
				>
				<span class="reveal-line__ink" aria-hidden="true"
					>for teams who care how things feel as much as how they ship.</span
				>
			</div>
		</div>

		<div class="home__lines home__lines--hero">
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 0 }}>
				<span class="reveal-line__muted" aria-hidden="true">This space is a placeholder: case studies,</span>
				<span class="reveal-line__ink" aria-hidden="true">This space is a placeholder: case studies,</span>
			</div>
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 1 }}>
				<span class="reveal-line__muted" aria-hidden="true">process notes, and experiments will land here</span>
				<span class="reveal-line__ink" aria-hidden="true">process notes, and experiments will land here</span>
			</div>
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 2 }}>
				<span class="reveal-line__muted" aria-hidden="true">as they’re ready. Nothing below is final copy.</span>
				<span class="reveal-line__ink" aria-hidden="true">as they’re ready. Nothing below is final copy.</span>
			</div>
		</div>

		<div class="home__lines home__lines--hero">
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 0 }}>
				<span class="reveal-line__muted" aria-hidden="true">If you’re looking for a collaborator on</span>
				<span class="reveal-line__ink" aria-hidden="true">If you’re looking for a collaborator on</span>
			</div>
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 1 }}>
				<span class="reveal-line__muted" aria-hidden="true">discovery, IA, UI, or front-end craft,</span>
				<span class="reveal-line__ink" aria-hidden="true">discovery, IA, UI, or front-end craft,</span>
			</div>
			<div class="reveal-line" use:scrollRevealWipe={{ staggerIndex: 2 }}>
				<span class="reveal-line__muted" aria-hidden="true">say hello — the usual channels are fine.</span>
				<span class="reveal-line__ink" aria-hidden="true">say hello — the usual channels are fine.</span>
			</div>
		</div>

		<div class="home__lines home__lines--footer">
			<div class="reveal-line reveal-line--small" use:scrollRevealWipe={{ staggerIndex: 0 }}>
				<span class="reveal-line__muted" aria-hidden="true">— Mock block for scroll rhythm</span>
				<span class="reveal-line__ink" aria-hidden="true">— Mock block for scroll rhythm</span>
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

	/* First block sits low in the viewport */
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
		--reveal: 0;
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
	}

	.reveal-line--small {
		font-size: clamp(0.65rem, 1.65vw + 0.15vh, 1.1rem);
		font-weight: 500;
		letter-spacing: 0.14em;
		line-height: 1.25;
		text-transform: uppercase;
	}

	.reveal-line__muted,
	.reveal-line__ink {
		display: block;
		width: 100%;
	}

	.reveal-line__muted {
		color: #cccccc;
	}

	.reveal-line__ink {
		position: absolute;
		left: 0;
		top: 0;
		color: #000000;
		pointer-events: none;
		/* iOS Safari: clip-path + calc(custom) is flaky; mask tracks the same edge reliably */
		-webkit-mask-image: linear-gradient(
			to right,
			#fff 0,
			#fff calc(var(--reveal, 0) * 100%),
			transparent calc(var(--reveal, 0) * 100%)
		);
		mask-image: linear-gradient(
			to right,
			#fff 0,
			#fff calc(var(--reveal, 0) * 100%),
			transparent calc(var(--reveal, 0) * 100%)
		);
		-webkit-mask-size: 100% 100%;
		mask-size: 100% 100%;
		-webkit-mask-repeat: no-repeat;
		mask-repeat: no-repeat;
		transform: translateZ(0);
	}
</style>
