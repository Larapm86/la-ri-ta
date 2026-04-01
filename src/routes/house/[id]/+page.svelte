<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.label} · Lara Bros</title>
</svelte:head>

<div class="house">
	<p class="house__tag">LARA BROS</p>
	<h1 class="house__title">{data.label}</h1>
	<p class="house__copy">Placeholder level — drop your case study, experiment, or game stage here.</p>
	<a class="house__back" href="/">← World map</a>
</div>

<style>
	.house {
		max-width: 28rem;
		margin: 0 auto;
		padding: 1rem 0 2rem;
	}

	.house__tag {
		margin: 0 0 0.5rem;
		font-family: 'Press Start 2P', ui-monospace, monospace;
		font-size: 0.45rem;
		color: #c84c0c;
		letter-spacing: 0.08em;
	}

	.house__title {
		margin: 0 0 0.75rem;
		font-size: 1.5rem;
		font-weight: 500;
		letter-spacing: -0.02em;
	}

	.house__copy {
		margin: 0 0 1.5rem;
		font-size: 0.9375rem;
		line-height: 1.55;
		color: rgb(0 0 0 / 0.62);
	}

	@media (prefers-color-scheme: dark) {
		.house__copy {
			color: rgb(255 255 255 / 0.72);
		}
	}

	.house__back {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.house__back:hover {
		color: #c84c0c;
	}
</style>
