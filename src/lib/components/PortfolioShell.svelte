<script lang="ts">
	import { onMount, tick } from 'svelte';

	const NAME = 'Lara Perez';
	const ROLE = 'Product & System Designer';

	let { children } = $props();

	/** Main copy visible after pixel curtain finishes. */
	let contentVisible = $state(false);

	let pixelCurtainCanvas: HTMLCanvasElement | undefined = $state();
	let curtainRaf = 0;
	let curtainVisible = $state(false);
	let curtainRunId = 0;

	function easeOutCubic(t: number): number {
		return 1 - Math.pow(1 - t, 3);
	}

	function hash01(i: number, j: number): number {
		let n = ((i * 73856093) ^ (j * 19349663) ^ (i * j * 17)) >>> 0;
		n = (n * 1103515245 + 12345) >>> 0;
		n = (n * 1103515245 + 12345) >>> 0;
		return (n & 0xffffff) / 0x1000000;
	}

	function runPixelCurtain(canvasEl?: HTMLCanvasElement): Promise<void> {
		const myRun = curtainRunId;
		return new Promise((resolve) => {
			const canvas = canvasEl ?? pixelCurtainCanvas;
			if (!canvas || typeof window === 'undefined') {
				resolve();
				return;
			}

			let ctx = canvas.getContext('2d', { alpha: false });
			if (!ctx) ctx = canvas.getContext('2d');
			if (!ctx) {
				resolve();
				return;
			}

			/** Mosaic cell size in CSS px — larger = chunkier transition. */
			const CELL = 20;
			const DISSOLVE_MS = 1180;
			const VERT_BIAS = 0.46;
			const RAGGED = 0.055;

			const readViewportCss = () => {
				const vv = window.visualViewport;
				let w = Math.round(vv?.width ?? window.innerWidth);
				let h = Math.round(vv?.height ?? window.innerHeight);
				if (w < 2 || h < 2) {
					w = Math.max(w, Math.round(window.screen.width / (window.devicePixelRatio || 1)));
					h = Math.max(h, Math.round(window.screen.height / (window.devicePixelRatio || 1)));
				}
				return { w: Math.max(2, w), h: Math.max(2, h) };
			};

			const paintSize = () => {
				const { w, h } = readViewportCss();
				const dpr = Math.min(window.devicePixelRatio || 1, 2);
				canvas.width = Math.floor(w * dpr);
				canvas.height = Math.floor(h * dpr);
				canvas.style.width = `${w}px`;
				canvas.style.height = `${h}px`;
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
				return { w, h };
			};

			const { w, h } = paintSize();
			const t0 = performance.now();

			const frame = (now: number) => {
				if (myRun !== curtainRunId) {
					resolve();
					return;
				}

				const elapsed = now - t0;
				const t = Math.min(1, elapsed / DISSOLVE_MS);
				const p = easeOutCubic(t);

				ctx.fillStyle = '#ffffff';
				ctx.fillRect(0, 0, w, h);

				const cols = Math.ceil(w / CELL);
				const rows = Math.ceil(h / CELL);
				const rowDen = Math.max(1, rows - 1);

				ctx.fillStyle = '#000000';
				for (let j = 0; j < rows; j++) {
					const v = j / rowDen;
					const ragged = RAGGED * Math.sin(j * 0.28 + p * 6.2);
					for (let i = 0; i < cols; i++) {
						const u = hash01(i, j);
						const threshold = p + v * VERT_BIAS + ragged;
						if (u > threshold) {
							ctx.fillRect(i * CELL, j * CELL, CELL, CELL);
						}
					}
				}

				if (t < 1) {
					curtainRaf = requestAnimationFrame(frame);
				} else {
					resolve();
				}
			};

			curtainRaf = requestAnimationFrame(frame);
		});
	}

	onMount(() => {
		const reduce =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

		if (reduce) {
			contentVisible = true;
			return () => {
				curtainRunId++;
				cancelAnimationFrame(curtainRaf);
				curtainVisible = false;
			};
		}

		let cancelled = false;

		const waitForCanvas = async () => {
			await tick();
			await tick();
			await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
			/* bind:this + first layout — single tick is often too early on mobile WebKit */
			let el = pixelCurtainCanvas;
			for (let i = 0; i < 8 && !el; i++) {
				await tick();
				await new Promise<void>((r) => requestAnimationFrame(() => r()));
				el = pixelCurtainCanvas;
			}
			return el;
		};

		void (async () => {
			if (cancelled) return;
			curtainVisible = true;
			await waitForCanvas();
			if (cancelled) return;

			const canvasEl = pixelCurtainCanvas;
			const curtainPromise = runPixelCurtain(canvasEl ?? undefined);

			const timeoutMs = 4000;
			const timeout = new Promise<void>((resolve) => {
				setTimeout(resolve, timeoutMs);
			});

			await Promise.race([curtainPromise, timeout]);
			if (!cancelled) {
				contentVisible = true;
				curtainVisible = false;
			}
		})();

		return () => {
			cancelled = true;
			curtainRunId++;
			cancelAnimationFrame(curtainRaf);
			curtainVisible = false;
		};
	});
</script>

<div class="portfolio">
	<div class="portfolio__load-stack" aria-live="polite" aria-busy={curtainVisible}>
		<p class="nav-rail__name portfolio__cell-name">{NAME}</p>
		<p class="nav-rail__role portfolio__cell-role">{ROLE}</p>
	</div>

	<canvas
		class="portfolio__pixel-curtain"
		class:portfolio__pixel-curtain--on={curtainVisible}
		bind:this={pixelCurtainCanvas}
		aria-hidden="true"
	></canvas>

	<main class="main" class:main--ready={contentVisible} aria-hidden={!contentVisible}>
		{@render children()}
	</main>
</div>

<style>
	.portfolio {
		min-height: 100vh;
		position: relative;
	}

	.portfolio__pixel-curtain {
		position: fixed;
		z-index: 48;
		inset: 0;
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
		pointer-events: none;
		opacity: 0;
		visibility: hidden;
		/* iOS: promote layer so 2D draws show above page */
		-webkit-transform: translateZ(0);
		transform: translateZ(0);
	}

	.portfolio__pixel-curtain--on {
		opacity: 1;
		visibility: visible;
	}

	.portfolio__load-stack {
		position: fixed;
		z-index: 55;
		left: 0;
		right: 0;
		top: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		box-sizing: border-box;
		padding: var(--nav-pad-y) var(--nav-pad-x);
		pointer-events: none;
	}

	.portfolio__cell-name,
	.portfolio__cell-role {
		position: relative;
		z-index: 1;
		margin: 0;
		min-height: 1.5rem;
		display: flex;
		align-items: center;
		color: var(--color-text);
		pointer-events: auto;
	}

	.portfolio__cell-role {
		justify-content: flex-end;
	}

	.nav-rail__name,
	.nav-rail__role {
		position: relative;
		margin: 0;
		flex: 0 1 auto;
		font-size: clamp(0.75rem, 1.5vw, 0.8125rem);
		font-weight: 400;
		letter-spacing: 0.06em;
		line-height: 1.2;
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
		text-shadow: 0 1px 0 rgb(255 255 255 / 0.5);
	}

	.nav-rail__name {
		padding: 0.12em 0.55em 0.12em 0;
		white-space: nowrap;
	}

	.nav-rail__role {
		padding: 0.12em 0 0.12em 0.55em;
		text-align: right;
		max-width: min(42vw, 15rem);
		white-space: normal;
	}

	.main {
		position: relative;
		z-index: 1;
		padding: 0 var(--nav-pad-x);
		padding-top: calc(var(--nav-pad-y) + 3.5rem);
		padding-bottom: var(--nav-pad-y);
		opacity: 0;
		pointer-events: none;
		/* avoid visibility:hidden — WebKit can skip IO / layout for descendants before reveal */
	}

	.main.main--ready {
		pointer-events: auto;
		animation: main-in 0.85s var(--ease-out-expo) forwards;
	}

	@keyframes main-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.main.main--ready {
			animation: none;
			opacity: 1;
		}

		.portfolio__pixel-curtain {
			display: none;
		}
	}
</style>
