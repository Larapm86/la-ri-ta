<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import PortfolioShell from '$lib/components/PortfolioShell.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@600&family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400&family=Press+Start+2P&family=Rubik+Wet+Paint&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<PortfolioShell>{@render children()}</PortfolioShell>
