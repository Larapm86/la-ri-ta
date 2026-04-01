<script lang="ts">
	import { onMount } from 'svelte';

	const NAME = 'Lara Perez';
	const ROLE = 'Product & System Designer';

	let { children } = $props();

	/**
	 * Main must never depend on JS to become visible — iOS often paints before
	 * onMount; gating opacity caused a permanently blank page when anything failed.
	 * Curtain is decorative overlay only.
	 */
	let shellMounted = $state(false);
	let curtainVisible = $state(false);

	let canvasEl: HTMLCanvasElement | undefined = undefined;

	let curtainRaf = 0;
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

	function runPixelCurtain(canvas: HTMLCanvasElement): Promise<void> {
		const myRun = curtainRunId;
		return new Promise((resolve) => {
			if (typeof window === 'undefined') {
				resolve();
				return;
			}

			let ctx = canvas.getContext('2d', { alpha: false });
			if (!ctx) ctx = canvas.getContext('2d');
			if (!ctx) {
				resolve();
				return;
			}

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
		shellMounted = true;

		const reduce =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

		if (reduce) {
			return () => {
				curtainRunId++;
				cancelAnimationFrame(curtainRaf);
				curtainVisible = false;
			};
		}

		let cancelled = false;

		const hideCurtain = () => {
			if (!cancelled) curtainVisible = false;
		};

		const failSafe = window.setTimeout(hideCurtain, 8000);

		const start = () => {
			if (cancelled) return;
			const canvas =
				canvasEl ?? (document.querySelector('.portfolio__pixel-curtain') as HTMLCanvasElement | null);
			if (!canvas) {
				window.clearTimeout(failSafe);
				return;
			}

			curtainVisible = true;

			void runPixelCurtain(canvas)
				.catch(() => {})
				.finally(() => {
					window.clearTimeout(failSafe);
					hideCurtain();
				});
		};

		requestAnimationFrame(() => {
			requestAnimationFrame(start);
		});

		return () => {
			cancelled = true;
			window.clearTimeout(failSafe);
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
		bind:this={canvasEl}
		aria-hidden="true"
	></canvas>

	<main class="main" class:main--mounted={shellMounted}>
		{@render children()}
	</main>
</div>

<style>
	.portfolio {
		min-height: 100vh;
		min-height: 100dvh;
		position: relative;
	}

	/* Full-viewport overlay while animating; main stays visible underneath */
	.portfolio__pixel-curtain {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100vh;
		height: 100dvh;
		max-width: 100%;
		pointer-events: none;
		opacity: 0;
		z-index: -1;
		-webkit-transform: translateZ(0);
		transform: translateZ(0);
	}

	.portfolio__pixel-curtain--on {
		z-index: 60;
		opacity: 1;
	}

	.portfolio__load-stack {
		position: fixed;
		z-index: 70;
		left: 0;
		right: 0;
		top: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		box-sizing: border-box;
		padding: var(--nav-pad-y) var(--nav-pad-x);
		padding-top: max(var(--nav-pad-y), env(safe-area-inset-top));
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
		text-shadow: var(--nav-rail-shadow);
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
		z-index: 5;
		padding: 0 var(--nav-pad-x);
		padding-left: max(var(--nav-pad-x), env(safe-area-inset-left));
		padding-right: max(var(--nav-pad-x), env(safe-area-inset-right));
		padding-top: max(calc(var(--nav-pad-y) + 3.5rem), env(safe-area-inset-top));
		padding-bottom: max(var(--nav-pad-y), env(safe-area-inset-bottom));
		opacity: 1;
		pointer-events: auto;
	}

	.main.main--mounted {
		animation: main-in 0.85s var(--ease-out-expo) forwards;
	}

	@keyframes main-in {
		from {
			transform: translateY(8px);
		}
		to {
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.main.main--mounted {
			animation: none;
		}

		.portfolio__pixel-curtain {
			display: none !important;
		}
	}
</style>
