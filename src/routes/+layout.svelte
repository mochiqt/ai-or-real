<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex flex-col h-screen">
	<!-- Main Content -->
	<main class="flex-1 overflow-hidden">
		{@render children()}
	</main>
</div>
