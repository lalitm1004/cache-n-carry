<script lang="ts">
    import { browser } from "$app/environment";
    import ScreenBlur from "$lib/components/ScreenBlur.svelte";
    import { UserStore } from "$lib/stores/UserStore";
    import { qr } from "@svelte-put/qr/svg";
    import { Html5Qrcode } from "html5-qrcode";
    import type { Html5QrcodeError, Html5QrcodeResult } from "html5-qrcode/esm/core";
    import { onMount, tick } from "svelte";

    let { data } = $props();
    let { sessions } = $derived(data);

    let isOpen: boolean = $state(false);
    let cloakroom: string = $state('');

    let scanQr: boolean = $state(false);

    const handleSubmit = async () => {
        // const response = await fetch('/api/session/create', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(''),
        // });
        scanQr = true;
        isOpen = false;
        init();
    }

    let htmlqr: Html5Qrcode | null = $state(null);
    let scanning: boolean = $state(false);

    $effect(() => {
        (async () => {
            if (!scanQr) htmlqr?.stop();;
        })();
    })

    async function init() {
        try {
            await tick();
            htmlqr = new Html5Qrcode('reader');
            console.log('sex')
            await startScanning();
        } catch (err) {
            console.error('Error initializing scanner:', err);
            alert('Failed to initialize QR scanner');
        }
    }

    async function startScanning() {
        try {
            if (!htmlqr) return;
            await htmlqr.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                onScanSuccess,
                onScanFailure
            );
            scanning = true;
        } catch (err) {
            console.error('Error starting scanner:', err);
            alert('Failed to start scanner. Please ensure camera permissions are granted.');
        }
    }

    async function onScanSuccess(decodedText: string, decodedResult: Html5QrcodeResult) {
        await htmlqr!.stop();
        scanning = false;
    }

    function onScanFailure(error: string) {
        console.warn(`Code scan error = ${error}`);
    }

    const inputStyle = 'border-2 border-neutral-400 rounded-md px-2 py-2 bg-neutral-200';
</script>

<main class={`h-screen w-screen grid place-items-center`}>
    {#if $UserStore?.type === 'student'}
        <div class={`flex flex-col justify-center items-center`}>
            <svg class={`h-[200px] aspect-square`} use:qr={{
                data: $UserStore.rollNumber
            }}/>
            <p class={`text-center`}>Have a staff member scan this QR code to begin a session!</p>
        </div>
    {:else}
        <div>
            <div class={`flex flex-col justify-center items-center`}>
                <button onclick={() => isOpen = true} class={`bg-green-400 border-2 border-neutral-400 rounded-full px-4 py-2`}>
                    Create Session +
                </button>
            </div>
            <ul>
                {#each sessions as session (session.id)}
                    <li>
                        <pre>{JSON.stringify(session)}</pre>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
</main>

{#if isOpen}
    <ScreenBlur bind:isOpen/>

    <div class={`z-50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 bg-neutral-200/80 backdrop-blur-sm flex flex-col px-4 py-2 rounded-lg border-2 border-neutral-900`}>
        <form class={`z-50 flex flex-col gap-2`}
            onsubmit={handleSubmit}
        >
            <input
                class={`${inputStyle} z-50`}
                placeholder={`Cloakroom Name`}
                bind:value={cloakroom}
                required
            />

            <button type="submit" class={`bg-green-400 border-2 border-neutral-400 rounded-lg px-4 py-2`}>
                Scan QR
            </button>
        </form>
    </div>
{/if}

{#if scanQr}
<button onclick={() => {scanQr = false}} aria-label={`close menu`} class={`z-40 absolute top-0 left-0 h-dvh w-dvw bg-neutral-900/40 backdrop-blur-sm`}></button>

<div class={`z-50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 bg-neutral-200/80 backdrop-blur-sm flex flex-col px-4 py-2 rounded-lg border-2 border-neutral-900`}>
    <div id="reader" class={`h-[200px] aspect-square bg-neutral-950`}></div>
</div>
{/if}