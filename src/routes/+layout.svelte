<script lang="ts">
	import BackgroundTexture from '$lib/components/BackgroundTexture.svelte';
    import { device, setDevice } from '$lib/stores/DeviceStore';
    import { onMount } from 'svelte';
	import '../app.css';
    import { ToastStore } from '$lib/stores/ToastStore';
    import Toast from '$lib/components/Toast.svelte';
    import MobileOnly from '$lib/components/MobileOnly.svelte';

	let { children } = $props();

	onMount(() => {
		if (window.matchMedia("(max-width: 767px)").matches)
			setDevice("mobile");
		else setDevice("desktop");
	});
</script>

<!-- handle device resize -->
<svelte:window
	onresize={() =>
		setDevice(
			window.matchMedia('(max-width: 767px)').matches
			? 'mobile'
			: 'desktop'
		)
	}
/>

{#if $device === 'mobile'}
	{@render children()}
	<BackgroundTexture />
{:else}
	<MobileOnly />
{/if}


{#if $ToastStore}
	{#each $ToastStore as toast (toast.id)}
		<Toast {...toast} />
	{/each}
{/if}