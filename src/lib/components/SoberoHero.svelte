<script lang="ts">
	import { onMount, tick } from 'svelte';

	const SRC = '/frame-1.svg';
	const NAT_W = 3840;
	const NAT_H = 2111;

	/** Each mosaic cell is exactly N×N CSS pixels on screen */
	const BLOCK = 8;

	let frameEl: HTMLButtonElement | undefined;
	let canvasEl: HTMLCanvasElement | undefined;
	let imgEl: HTMLImageElement | undefined;

	function drawCover(
		ctx: CanvasRenderingContext2D,
		img: HTMLImageElement,
		dw: number,
		dh: number
	) {
		const iw = img.naturalWidth;
		const ih = img.naturalHeight;
		const ir = iw / ih;
		const dr = dw / dh;
		let sx: number;
		let sy: number;
		let sw: number;
		let sh: number;
		if (ir > dr) {
			sh = ih;
			sw = ih * dr;
			sx = (iw - sw) / 2;
			sy = 0;
		} else {
			sw = iw;
			sh = iw / dr;
			sx = 0;
			sy = (ih - sh) / 2;
		}
		ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
	}

	function paint() {
		if (!frameEl || !canvasEl || !imgEl?.complete || imgEl.naturalWidth === 0) return;
		const rect = frameEl.getBoundingClientRect();
		const cssW = rect.width;
		const cssH = rect.height;
		const cellsX = Math.max(1, Math.floor(cssW / BLOCK));
		const cellsY = Math.max(1, Math.floor(cssH / BLOCK));
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		canvasEl.width = cellsX;
		canvasEl.height = cellsY;
		const displayW = cellsX * BLOCK;
		const displayH = cellsY * BLOCK;
		canvasEl.style.width = `${displayW}px`;
		canvasEl.style.height = `${displayH}px`;
		canvasEl.style.left = `${(cssW - displayW) / 2}px`;
		canvasEl.style.top = `${(cssH - displayH) / 2}px`;

		ctx.imageSmoothingEnabled = false;
		drawCover(ctx, imgEl, cellsX, cellsY);
	}

	onMount(() => {
		const ro = new ResizeObserver(() => paint());
		void tick().then(() => {
			paint();
			if (frameEl) ro.observe(frameEl);
		});
		return () => ro.disconnect();
	});
</script>

<figure class="sobero">
	<button
		type="button"
		class="sobero__frame"
		bind:this={frameEl}
		aria-label="Reveal full image — hover or press to see detail"
	>
		<img
			bind:this={imgEl}
			class="sobero__crisp"
			src={SRC}
			width={NAT_W}
			height={NAT_H}
			alt="Gradient hero artwork"
			loading="lazy"
			decoding="async"
			onload={paint}
		/>
		<canvas class="sobero__pixel" bind:this={canvasEl} aria-hidden="true"></canvas>
	</button>
</figure>

<style>
	.sobero {
		margin: 0;
		padding: 0;
		max-width: min(100%, 52rem);
	}

	.sobero__frame {
		display: block;
		position: relative;
		width: 100%;
		padding: 0;
		border: none;
		cursor: zoom-in;
		aspect-ratio: 3840 / 2111;
		overflow: hidden;
		border-radius: 0.35rem;
		background: rgb(245 245 245);
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.85) inset, 0 12px 40px rgb(0 0 0 / 0.08);
		transition: border-radius 0.55s cubic-bezier(0.22, 1, 0.36, 1);
		outline: none;
		font: inherit;
		color: inherit;
		text-align: left;
	}

	.sobero__frame:is(:hover, :focus-visible) {
		border-radius: 88px;
	}

	.sobero__frame:focus-visible {
		box-shadow:
			0 1px 0 rgb(255 255 255 / 0.85) inset,
			0 12px 40px rgb(0 0 0 / 0.08),
			0 0 0 2px rgb(59 130 246 / 0.45);
	}

	.sobero__crisp {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.sobero__pixel {
		position: absolute;
		image-rendering: pixelated;
		image-rendering: crisp-edges;
		pointer-events: none;
		transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.sobero__frame:is(:hover, :focus-visible) .sobero__crisp {
		opacity: 1;
	}

	.sobero__frame:is(:hover, :focus-visible) .sobero__pixel {
		opacity: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.sobero__frame {
			transition: none;
			border-radius: 88px;
		}

		.sobero__crisp,
		.sobero__pixel {
			transition: none;
		}

		.sobero__crisp {
			opacity: 1;
		}

		.sobero__pixel {
			opacity: 0;
		}
	}
</style>
