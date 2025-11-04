import { browser } from '$app/environment';
import { IMAGE_POOL, type ImageEntry, type ImageLabel } from '$lib/data/images';
import { writable } from 'svelte/store';

export type Answer = {
	imageSrc: string;
	correctLabel: ImageLabel;
	guess: ImageLabel;
	correct: boolean;
};

export type GameState = {
	status: 'idle' | 'active' | 'finished';
	queue: ImageEntry[];
	currentIndex: number;
	totalRounds: number;
	score: number;
	answers: Answer[];
	startedAt?: string;
	finishedAt?: string;
};

const STORAGE_KEY = 'ai-or-real:game';
const DEFAULT_ROUNDS = 10;

const initialState = (): GameState => ({
	status: 'idle',
	queue: [],
	currentIndex: 0,
	totalRounds: 0,
	score: 0,
	answers: []
});

const isImageEntry = (value: unknown): value is ImageEntry =>
	typeof value === 'object' &&
	value !== null &&
	typeof (value as ImageEntry).src === 'string' &&
	(value as ImageEntry).label !== undefined &&
	((value as ImageEntry).label === 'real' || (value as ImageEntry).label === 'ai');

const isAnswer = (value: unknown): value is Answer =>
	typeof value === 'object' &&
	value !== null &&
	typeof (value as Answer).imageSrc === 'string' &&
	((value as Answer).correctLabel === 'real' || (value as Answer).correctLabel === 'ai') &&
	((value as Answer).guess === 'real' || (value as Answer).guess === 'ai') &&
	typeof (value as Answer).correct === 'boolean';

const loadFromStorage = (): GameState => {
	if (!browser) return initialState();
	const raw = sessionStorage.getItem(STORAGE_KEY);
	if (!raw) return initialState();

	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed.queue) || parsed.queue.length === 0) {
			return initialState();
		}
		if (!parsed.queue.every(isImageEntry)) {
			return initialState();
		}

		const answers = Array.isArray(parsed.answers) ? parsed.answers.filter(isAnswer) : [];

		const currentIndex =
			typeof parsed.currentIndex === 'number'
				? Math.max(0, Math.min(parsed.currentIndex, parsed.queue.length - 1))
				: 0;

		const status =
			parsed.status === 'active' || parsed.status === 'finished' ? parsed.status : 'idle';

		return {
			status,
			queue: parsed.queue,
			currentIndex,
			totalRounds: typeof parsed.totalRounds === 'number' ? parsed.totalRounds : parsed.queue.length,
			score: typeof parsed.score === 'number' ? parsed.score : 0,
			answers,
			startedAt: parsed.startedAt,
			finishedAt: parsed.finishedAt
		};
	} catch (error) {
		console.warn('Konnte Spielstand nicht laden:', error);
		return initialState();
	}
};

const store = writable<GameState>(loadFromStorage());

if (browser) {
	store.subscribe((value) => {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	});
}

const shuffle = <T>(input: T[]): T[] => {
	const array = [...input];
	for (let i = array.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
};

const buildQueue = (rounds: number): ImageEntry[] => {
	const pool = shuffle(IMAGE_POOL);
	const amount = Math.min(rounds, pool.length);
	return pool.slice(0, amount);
};

const gameStore = {
	subscribe: store.subscribe,
	start(rounds: number = DEFAULT_ROUNDS) {
		const queue = buildQueue(rounds);
		store.set({
			status: 'active',
			queue,
			currentIndex: 0,
			totalRounds: queue.length,
			score: 0,
			answers: [],
			startedAt: new Date().toISOString(),
			finishedAt: undefined
		});
	},
	guess(choice: ImageLabel) {
		store.update((state) => {
			if (state.status !== 'active') return state;

			const current = state.queue[state.currentIndex];
			if (!current) return state;

			const correct = current.label === choice;
			const answers: Answer[] = [
				...state.answers,
				{
					imageSrc: current.src,
					correctLabel: current.label,
					guess: choice,
					correct
				}
			];

			const nextIndex = state.currentIndex + 1;
			const finished = nextIndex >= state.totalRounds;

			return {
				...state,
				score: correct ? state.score + 1 : state.score,
				answers,
				currentIndex: finished ? state.currentIndex : nextIndex,
				status: finished ? 'finished' : 'active',
				finishedAt: finished ? new Date().toISOString() : state.finishedAt
			};
		});
	},
	reset() {
		store.set(initialState());
		if (browser) {
			sessionStorage.removeItem(STORAGE_KEY);
		}
	}
};

export const game = gameStore;
