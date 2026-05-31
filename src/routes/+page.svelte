<script lang="ts">
	import { browser } from '$app/environment';
	import { calculateDuration, parseIntervals } from '$lib/interval_parse';
	import { Timer, type TimeSlot } from '$lib/timer';
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';

	let intervals = $state('1m work\n1m break');
	let parsedIntervals: Array<TimeSlot> = $state([]);

	let timer: Timer | null = $state(null);

	let error: String | null = $state(null);

	const formatDuration = (duration: number) => {
		let time = Math.max(0, duration - 1) + 1000; // fake it
		const hours = Math.floor(time / 3600_000);
		const minutes = Math.floor((time - hours * 3600_000) / 60_000);
		const seconds = Math.floor((time - hours * 3600_000 - minutes * 60_000) / 1_000);

		const hh = hours.toString().padStart(2, '0');
		const mm = minutes.toString().padStart(2, '0');
		const ss = seconds.toString().padStart(2, '0');

		return `${hh}:${mm}:${ss}`;
	};

	const formatClock = (time: Date) => {
		const hours = time.getHours().toString().padStart(2, '0');
		const minutes = time.getMinutes().toString().padStart(2, '0');
		const seconds = time.getSeconds().toString().padStart(2, '0');
		return `${hours}:${minutes}:${seconds}`;
	};

	let timeNow = $state(new Date());
	let timeFinish = $state(new Date());
	let timeFormatted = $derived(formatClock(timeNow));
	let finishFormatted = $derived(formatClock(timeFinish));
	let durationFormatted = $derived(formatDuration(calculateDuration(parsedIntervals)));

	const reparseIntervals = () => {
		try {
			parsedIntervals = parseIntervals(intervals);
			timeFinish = new Date(timeNow.getTime() + calculateDuration(parsedIntervals));
			error = null;
		} catch (e) {
			error = e as string;
			console.log(e);
		}
	};

	onMount(() => {
		if (!browser) return;
		setInterval(() => {
			timeNow = new Date();
			if (timer) {
				timeFinish = new Date(timeNow.getTime() + timer.totalTimeRemaining);
			} else {
				timeFinish = new Date(timeNow.getTime() + calculateDuration(parsedIntervals));
			}
		}, 200);
		reparseIntervals();
	});

	// Running vars
	let sfxDing: HTMLAudioElement;
	let sfxTick: HTMLAudioElement;

	let timeRemaining = $state(0);
	let timeRemainingFormatted = $derived(formatDuration(timeRemaining));
	let sectionName = $state('');
	let sectionIndex = $state(0);
	let sectionCount = $state(0);
	let timerRunning = $state(true);

	const endTimer = () => {
		if (!timer) return;
		timer.clear();
	};
	const clearTimer = () => {
		sfxTickPlay();
		timer = null;
	};

	const toggleTimerPause = () => {
		if (!timer) return;
		sfxTickPlay();
		timer.timerRunning = !timer.timerRunning;
		timer.lastTickDate = Date.now();
		timerRunning = timer.timerRunning;
	};

	const timerAdvanced = () => {
		if (!timer) return;
		sectionName = timer.currentSlot.name;
	};

	const tick = () => {
		if (!timer) {
			console.error('tick without timer??');
			return;
		}
		timeRemaining = timer.timeRemaining;
		sectionName = timer.currentSlot.name;
		sectionIndex = timer.elapsedSlots.get(sectionName) || 0;
		sectionCount = timer.totalSlots.get(sectionName) || 0;
	};

	const skip = () => {
		if (!timer) return;
		timer.advance();
	};

	const ding = () => {
		sfxDing.currentTime = 0;
		sfxDing.play();
	};

	const sfxTickPlay = () => {
		sfxTick.currentTime = 0;
		sfxTick.play();
	};

	const startTimer = () => {
		if (error) return;
		timer = new Timer(parsedIntervals, clearTimer, tick, ding, timerAdvanced);
		timerRunning = true;
		tick();
	};
</script>

<audio bind:this={sfxTick} src={asset('/tick.mp3')}></audio>
<audio bind:this={sfxDing} src={asset('/advance.wav')} volume={0.3}></audio>

<div class="flex h-dvh w-full items-center justify-center bg-gray-800 p-4">
	<div class="flex aspect-1/2 h-full flex-col items-center font-mono">
		<div class="flex h-8 w-full border-b border-black bg-gray-200 p-1">
			<div class="border-r border-black pr-2 font-bold">Dictionaries</div>
			<div class="flex-1"></div>
			{#if timer}
				<div>FINISH: {finishFormatted} |&nbsp;</div>
			{/if}
			<div>{timeFormatted}</div>
		</div>
		<div class="flex w-full flex-1 flex-col">
			{#if !timer}
				<div class="flex flex-1 flex-col bg-gray-200 select-none">
					<div class="flex flex-1 flex-col items-center justify-center font-mono">
						<div class="text-6xl">dTimer</div>
						{#if error}
							<div class="text-red-500">Invalid Configuration</div>
							<div class="text-red-500">{error}</div>
						{:else}
							<div>Duration: {durationFormatted}</div>
							<div>Finish Time: {finishFormatted}</div>
						{/if}
						<div>&nbsp;</div>
						<div class="font-bold">Total Runs: x</div>
						<div class="font-bold">Aborted: x</div>
						<div class="font-bold">Finished: x</div>
					</div>
				</div>
				<div class="h-0.5 bg-black"></div>
				<div class="flex flex-1 flex-col gap-2 bg-gray-200">
					<textarea
						class="flex-1 resize-none gap-2 p-2 font-mono text-xl focus:border-green-500"
						onkeyup={reparseIntervals}
						bind:value={intervals}
						placeholder="Intervals..."
					></textarea>
					{#if error}
						<button class="border border-black bg-gray-400 p-2" onclick={startTimer}>Start</button>
					{:else}
						<button
							class="border border-black bg-green-400 p-2 hover:cursor-pointer hover:bg-green-200"
							onclick={startTimer}>Start</button
						>
					{/if}
				</div>
			{:else}
				<div class="flex h-full flex-col bg-gray-200 font-mono">
					<div class="flex flex-1 flex-col items-center justify-center">
						<div class="text-6xl">{timeRemainingFormatted}</div>
						<div class="text-2xl">{sectionName}</div>
						<div class="text-2xl">[{sectionIndex}/{sectionCount}]</div>
					</div>
					<div class="flex justify-between text-2xl">
						<button
							class="border border-black bg-red-400 p-2 hover:cursor-pointer hover:bg-green-200"
							onclick={endTimer}>Exit</button
						>
						{#if timerRunning}
							<button
								class="border border-black bg-yellow-400 p-2 hover:cursor-pointer hover:bg-green-200"
								onclick={toggleTimerPause}>Pause</button
							>
						{:else}
							<button
								class="border border-black bg-green-400 p-2 hover:cursor-pointer hover:bg-green-200"
								onclick={toggleTimerPause}>Resume</button
							>
						{/if}
						<button
							class="border border-black bg-green-400 p-2 hover:cursor-pointer hover:bg-green-200"
							onclick={skip}>Skip</button
						>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
