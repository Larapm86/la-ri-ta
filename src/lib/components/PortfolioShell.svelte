<script lang="ts">
	let { children } = $props();
</script>

<div class="portfolio">
	<main class="main">
		{@render children()}
	</main>
</div>

<style>
	.portfolio {
		min-height: 100vh;
		min-height: 100dvh;
		position: relative;
	}

	.main {
		position: relative;
		z-index: 5;
		padding: 0 var(--nav-pad-x);
		padding-left: max(var(--nav-pad-x), env(safe-area-inset-left));
		padding-right: max(var(--nav-pad-x), env(safe-area-inset-right));
		padding-top: max(var(--nav-pad-y), env(safe-area-inset-top));
		padding-bottom: max(var(--nav-pad-y), env(safe-area-inset-bottom));
		opacity: 1;
		pointer-events: auto;
	}

</style>
