<script lang="ts">
	import LaraBrosHub from '$lib/components/LaraBrosHub.svelte';
</script>

<div class="home">
	<LaraBrosHub />
</div>

<style>
	/**
	 * Hub is `position: fixed` with its own top inset for the nav — main’s default
	 * top padding would stack and force body scroll (wastes space under mobile browser UI).
	 */
	:global(main.main) {
		padding-top: max(env(safe-area-inset-top), 0.65rem);
		padding-bottom: env(safe-area-inset-bottom);
		min-height: 100dvh;
		min-height: 100svh;
	}

	/** Full viewport; overflow hidden avoids rubber-band scroll under fixed hub. */
	.home {
		min-height: 100dvh;
		min-height: 100svh;
		overflow: hidden;
	}
</style>
