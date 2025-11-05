<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { game } from '$lib/stores/game';

	let redirecting = $state(false);
	let timeRemaining = $state(0);

	onMount(() => {
		if ($game.status !== 'active') {
			game.start();
		}
	});

	$effect(() => {
		if (browser && $game.status === 'finished' && !redirecting) {
			redirecting = true;
			goto('/result');
		}
	});

	// Timer logic
	$effect(() => {
		if (!browser || $game.status !== 'active' || !$game.endTime) return;

		const updateTimer = () => {
			const now = new Date().getTime();
			const end = new Date($game.endTime!).getTime();
			const remaining = Math.max(0, Math.floor((end - now) / 1000));
			
			timeRemaining = remaining;

			if (remaining <= 0 && $game.status === 'active') {
				game.endGame(true);
			}
		};

		updateTimer();
		const interval = setInterval(updateTimer, 100);

		return () => {
			clearInterval(interval);
		};
	});

	const handleGuess = (choice: 'real' | 'ai') => {
		game.guess(choice);
	};

	let currentImage = $derived($game.queue[$game.currentIndex]);
	let lastAnswer = $derived($game.answers[$game.answers.length - 1]);
	let roundsLeft = $derived($game.totalRounds - $game.answers.length);
	let progress = $derived(
		$game.totalRounds ? Math.round(($game.answers.length / $game.totalRounds) * 100) : 0
	);

	let feedbackMessage = $derived.by(() => {
		if (!lastAnswer) return '';
		if (lastAnswer.correct) return 'Richtig! 🎉';
		return `Falsch! Das war ${lastAnswer.correctLabel === 'real' ? 'ein echtes Foto' : 'KI-generiert'}`;
	});

	let feedbackEl: HTMLElement | null = null;
	$effect(() => {
		if (lastAnswer && feedbackEl) {
			feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	});

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};
</script>

<svelte:head>
	<title>AI or Real? – Spiel</title>
</svelte:head>

<section class="game-wrapper">
	<!-- Header -->
	<div class="topbar grid grid-cols-[1fr_auto_1fr] items-center">
		<div class="pill justify-self-start">
			<span class="text-sm">Runde</span>
			<span class="font-bold text-blue-400">{$game.answers.length + 1} / {$game.totalRounds}</span>
		</div>
		<a href="/" class="justify-self-center text-sm sm:text-base font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
			🎮 AI or Real?
		</a>
		<div class="badge-soft justify-self-end">
			<span class="text-sm">Punkte:</span>
			<span class="font-bold text-lg">{$game.score}</span>
		</div>
	</div>

	<!-- Timer -->
	{#if $game.status === 'active' && $game.timeLimit}
		<div class="mt-2 mb-2">
			<div class="flex items-center justify-between text-sm mb-1">
				<span class="text-slate-400">⏱️ Zeit verbleibend:</span>
				<span class={['font-bold', timeRemaining <= 10 ? 'text-red-400' : 'text-cyan-400']}>
					{formatTime(timeRemaining)}
				</span>
			</div>
			<div class="progress">
				<div 
					class="bar" 
					style={'width: ' + Math.max(0, Math.min(100, (timeRemaining / ($game.timeLimit || 60)) * 100)) + '%'}
				></div>
			</div>
		</div>
	{/if}

	<!-- Progress Bar -->
	<div class="space-y-2">
		<div class="progress">
			<div class="bar" style={'width: ' + progress + '%'}></div>
		</div>
		<p class="text-right text-xs text-slate-400">{progress}% abgeschlossen</p>
	</div>

	{#if currentImage}
		<!-- Image Card -->
		<div class="mt-6">
			<figure class="image-card">
				<div class="w-full h-[40vh] sm:h-[48vh] lg:h-[50vh] overflow-hidden">
					<img src={currentImage.src} alt="Aktuelles Spielbild" class="w-full h-full object-cover" />
				</div>
				<figcaption class="pt-3">
					<h2>Was ist dieses Bild?</h2>
					<p class="text-slate-400 text-sm">Klicke auf deine Antwort unten</p>
					<div class="mt-4 actions justify-center gap-4 sm:gap-6">
						<button 
							class="primary flex-1 sm:flex-none"
							onclick={() => handleGuess('real')}
						>
							<span class="text-xl">📸</span>
							<span>Echt</span>
						</button>
						<button 
							class="secondary flex-1 sm:flex-none"
							onclick={() => handleGuess('ai')}
						>
							<span class="text-xl">🤖</span>
							<span>KI-generiert</span>
						</button>
					</div>
				</figcaption>
			</figure>
		</div>

		<!-- Feedback Message -->
		{#if lastAnswer}
			<div 
				bind:this={feedbackEl}
				class:correct={lastAnswer.correct} 
				class:wrong={!lastAnswer.correct} 
				class="feedback animate-fade-in"
			>
				<div class="flex items-center gap-3">
					<span class="text-2xl">
						{lastAnswer.correct ? '✅' : '❌'}
					</span>
					<div>
						<p class="font-semibold">
							{feedbackMessage}
						</p>
						<p class="text-xs mt-1">
							{lastAnswer.correct 
								? 'Gute Beobachtung!' 
								: 'Besser beim nächsten Mal!'}
						</p>
					</div>
				</div>
				<span class="streak">
					<div class="text-right">
						<p class="text-xs text-slate-400">Score</p>
						<p class="font-bold text-lg">{$game.score}</p>
					</div>
				</span>
			</div>

			<!-- Next Round Info -->
			{#if roundsLeft > 0}
				<div class="mt-4 rounded-lg border border-slate-600/40 bg-slate-700/30 p-3 text-center text-sm text-slate-300">
					{roundsLeft} {roundsLeft === 1 ? 'Runde' : 'Runden'} verbleibend
				</div>
			{/if}
		{:else}
			<div class="mt-6 text-center text-slate-400">
				<p class="text-sm">Wähle deine Antwort, um zu beginnen</p>
			</div>
		{/if}
	{:else}
		<div class="empty-state py-12">
			<p class="text-xl mb-4">📷 Keine Bilddaten gefunden</p>
			<p class="text-slate-400 mb-6 max-w-md mx-auto">
				Lege Dateien in <code>src/lib/assets/ai</code> und <code>src/lib/assets/real</code> ab.
			</p>
			<button class="secondary" onclick={() => goto('/')}>
				Zur Startseite
			</button>
		</div>
	{/if}
</section>
