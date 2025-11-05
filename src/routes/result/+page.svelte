<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { game, type GameState } from '$lib/stores/game';
	import { highscores } from '$lib/stores/highscore';
	import { onMount } from 'svelte';
	type ResultSnapshot = Pick<
		GameState,
		'score' | 'totalRounds' | 'answers' | 'startedAt' | 'finishedAt'
	> & {
		accuracy: number;
		durationMs?: number;
	};

	let snapshot = $state<ResultSnapshot | null>(null);
	let canSubmit = $state(false);
	let name = $state('');
	let submitted = $state(false);

	onMount(() => {
		if (!browser) return;
		if ($game.status !== 'finished') {
			goto('/');
			return;
		}

		const started = $game.startedAt ? new Date($game.startedAt).getTime() : undefined;
		const finished = $game.finishedAt ? new Date($game.finishedAt).getTime() : undefined;

		snapshot = {
			score: $game.score,
			totalRounds: $game.totalRounds,
			answers: $game.answers,
			startedAt: $game.startedAt,
			finishedAt: $game.finishedAt,
			accuracy: $game.totalRounds ? $game.score / $game.totalRounds : 0,
			durationMs: started && finished ? finished - started : undefined
		};

		canSubmit = highscores.canEnter($game.score);
	});

	const handleSubmit = () => {
		if (!snapshot || submitted) return;

		const trimmed = name.trim();
		if (!trimmed) return;

		highscores.addEntry({
			name: trimmed.slice(0, 24),
			score: snapshot.score,
			rounds: snapshot.totalRounds,
			accuracy: snapshot.accuracy,
			durationMs: snapshot.durationMs
		});

		submitted = true;
		canSubmit = false;
		name = '';
	};

	const playAgain = () => {
		goto('/game');
	};

	const backHome = () => {
		goto('/');
	};

	const getAccuracyColor = (accuracy: number) => {
		if (accuracy >= 0.8) return 'text-green-400';
		if (accuracy >= 0.6) return 'text-yellow-400';
		return 'text-red-400';
	};

	let accuracyColor = $derived(getAccuracyColor(snapshot?.accuracy ?? 0));
</script>

<svelte:head>
	<title>AI or Real? – Ergebnis</title>
</svelte:head>

{#if snapshot}
	<section class="result-wrapper max-w-6xl min-h-screen flex items-center">
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-14 items-start w-full">
			<!-- LEFT: Stats + Highscore -->
			<div class="space-y-6">
				<!-- Stats -->
				<div class="mt-0 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
					<div class="rounded-2xl border border-slate-600/40 bg-slate-800/50 p-4 text-center">
						<p class="text-xs text-slate-400">Punkte</p>
						<p class="mt-2 text-3xl font-bold text-blue-400">{snapshot.score}</p>
						<p class="text-xs text-slate-500">von {snapshot.totalRounds}</p>
					</div>
					<div class="rounded-2xl border border-slate-600/40 bg-slate-800/50 p-4 text-center">
						<p class="text-xs text-slate-400">Trefferquote</p>
						<p class={['mt-2 text-3xl font-bold', accuracyColor]}>
							{Math.round(snapshot.accuracy * 100)}%
						</p>
					</div>
					{#if snapshot.durationMs}
						<div class="rounded-2xl border border-slate-600/40 bg-slate-800/50 p-4 text-center sm:col-span-1">
							<p class="text-xs text-slate-400">Spielzeit</p>
							<p class="mt-2 text-3xl font-bold text-cyan-400">
								{Math.round(snapshot.durationMs / 1000)}s
							</p>
						</div>
					{/if}
				</div>

				<!-- Highscore Form / Success -->
				{#if canSubmit && !submitted}
					<div class="highscore-form animate-fade-in">
						<h2 class="text-2xl font-bold text-white">🏆 In die Bestenliste eintragen</h2>
						<p class="text-sm text-slate-400">Du schaffst es in die Top 5!</p>
						<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
							<label for="player-name" class="block text-sm font-semibold text-slate-300">Dein Name</label>
							<input id="player-name" type="text" placeholder="Gib deinen Namen ein..." bind:value={name} maxlength="24" class="text-black" />
							<button type="submit" class="primary w-full mt-4" disabled={name.trim().length === 0}>✨ Eintragen</button>
						</form>
					</div>
				{:else if submitted}
					<div class="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-6 text-center animate-fade-in">
						<p class="success">🎉 Glückwunsch! Du bist in der Bestenliste!</p>
					</div>
				{/if}

				<!-- Actions -->
				<div class="actions">
					<button class="secondary" onclick={backHome}>⌂ Zur Startseite</button>
					<button class="primary" onclick={playAgain}>🔄 Noch eine Runde</button>
				</div>
			</div>

			<!-- RIGHT: Answers (scrollable) -->
			<div class="rounded-2xl border border-slate-600/40 bg-slate-800/50 p-4 max-h-[calc(100vh-240px)] overflow-y-auto">
				<h2 class="text-xl font-bold mb-2">📊 Deine Antworten im Detail</h2>
				<section class="answer-list">
					<ul>
						{#each snapshot.answers as answer, index (index)}
							<li class:correct={answer.correct} class:wrong={!answer.correct}>
								<div class="badge">{index + 1}</div>
								<img class="thumb" src={answer.imageSrc} alt={'Frage ' + (index + 1)} />
								<div class="details">
									<div class="flex items-start justify-between gap-2">
										<div>
											<p class="font-semibold text-white">Frage {index + 1}</p>
											<p class="label">Richtig: {answer.correctLabel === 'real' ? '📸 Echt' : '🤖 KI'}</p>
											<p class="label">Dein Tipp: {answer.guess === 'real' ? '📸 Echt' : '🤖 KI'}</p>
										</div>
										<span class="text-2xl">{answer.correct ? '✅' : '❌'}</span>
									</div>
								</div>
							</li>
						{/each}
					</ul>
				</section>
			</div>
		</div>
	</section>
{:else}
	<div class="empty-state py-16">
		<p class="text-2xl mb-4">🤔 Keine Spielstände gefunden</p>
		<p class="text-slate-400 mb-8">Starte eine neue Runde auf der <a href="/" class="text-blue-400 hover:text-blue-300">Startseite</a>.</p>
		<button class="primary" onclick={() => goto('/')}>← Zur Startseite</button>
	</div>
{/if}
