<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { game } from '$lib/stores/game';
	import { highscores } from '$lib/stores/highscore';

	onMount(() => {
		if (browser) {
			game.reset();
		}
	});

	const startGame = () => {
		goto('/game');
	};

	const formatDuration = (durationMs?: number) => {
		if (!durationMs) return '-';
		const seconds = Math.round(durationMs / 1000);
		if (seconds < 60) return seconds + 's';
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return minutes + 'm ' + secs + 's';
	};
</script>

<svelte:head>
	<title>AI or Real? – Erkenne, ob ein Bild echt oder KI-generiert ist</title>
</svelte:head>

<!-- Two Column Layout -->
<div class="h-[calc(100vh-56px)] grid grid-cols-1 lg:grid-cols-2 gap-4 px-3 sm:px-4 max-w-full mx-auto items-center">
	
	<!-- Left: Hero Section -->
	<div class="flex flex-col items-center justify-center w-full h-full overflow-hidden">
		<section class="hero text-center">
			<h1>AI or Real?</h1>
			<p class="lead text-lg sm:text-xl mb-16">
				Kannst du echte Fotos von KI-generierten Bildern unterscheiden?
			</p>
			
			<div class="flex justify-center mt-8 sm:mt-10">
				<button class="primary text-lg px-8 py-4" onclick={startGame}>
					🚀 Jetzt spielen
				</button>
			</div>
		</section>
	</div>

	<!-- Right: Leaderboard Section -->
	<div class="flex flex-col items-center justify-center w-full h-full overflow-hidden">
		<div class="mb-3 text-center w-full flex-shrink-0">
			<h2 class="text-2xl font-black text-white mb-1">
				<span class="inline-block">
					🏆 Top 5
				</span>
			</h2>
			<div class="h-0.5 w-12 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
			<p class="text-slate-400 mt-1 text-xs">Bestenliste</p>
		</div>

		<div class="scoreboard w-full overflow-x-hidden !p-4 max-w-md mx-auto h-auto">
			{#if $highscores.length === 0}
				<div class="py-4 text-center">
					<p class="text-slate-400 text-xs">
						🎮 Noch keine Einträge vorhanden
					</p>
				</div>
			{:else}
				<ol class="space-y-1">
					{#each $highscores as entry, index (index)}
						<li class="group">
							<div class="flex items-center justify-start gap-2">
								<div class="flex items-center gap-1.5 flex-1 min-w-0">
									<div class="rank text-2xl font-bold flex-shrink-0">
										{#if index === 0}
											🥇
										{:else if index === 1}
											🥈
										{:else if index === 2}
											🥉
										{:else}
											#{index + 1}
										{/if}
									</div>
									<div class="flex-1 min-w-0">
										<p class="name text-lg font-semibold truncate">{entry.name}</p>
										<p class="meta text-base text-slate-400 truncate">
											{Math.round(entry.accuracy * 100)}% · {entry.rounds}R · {formatDuration(entry.durationMs)} · <span class="opacity-80">Score:</span> {entry.score}
										</p>
									</div>
								</div>
							</div>
						</li>
					{/each}
				</ol>
			{/if}
		</div>
	</div>

</div>
