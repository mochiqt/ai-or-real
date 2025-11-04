import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';

export type HighscoreEntry = {
	name: string;
	score: number;
	rounds: number;
	accuracy: number;
	playedAt: string;
	durationMs?: number;
};

const STORAGE_KEY = 'ai-or-real:highscores';

const loadFromStorage = (): HighscoreEntry[] => {
	if (!browser) return [];
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return [];

	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		console.warn('Konnte Highscores nicht laden:', error);
		return [];
	}
};

const store = writable<HighscoreEntry[]>(loadFromStorage());

if (browser) {
	store.subscribe((value) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	});
}

const sortAndTrim = (entries: HighscoreEntry[]): HighscoreEntry[] =>
	[...entries]
		.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score;
			return new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime();
		})
		.slice(0, 5);

const highscoreStore = {
	subscribe: store.subscribe,
	addEntry(entry: Omit<HighscoreEntry, 'playedAt'>) {
		const item: HighscoreEntry = { ...entry, playedAt: new Date().toISOString() };
		store.update((current) => sortAndTrim([...current, item]));
	},
	clear() {
		store.set([]);
		if (browser) {
			localStorage.removeItem(STORAGE_KEY);
		}
	},
	canEnter(score: number) {
		const current = get(store);
		if (current.length < 5) return true;
		return score >= current[current.length - 1].score;
	}
};

export const highscores = highscoreStore;
