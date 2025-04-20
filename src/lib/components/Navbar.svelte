<script lang="ts">
    import { page } from "$app/state";
    import ScreenBlur from "./ScreenBlur.svelte";

    let isOpen: boolean = $state(false);

    let internalAnchors = [
        { id: 1, display: 'Home', href: '/' },
        { id: 2, display: 'Belongings', href: '/belongings' },
        { id: 3, display: 'Session', href: '/session' },
        { id: 4, display: 'Incidents', href: '/incidents' },
    ];
</script>

<nav class={`z-50 fixed top-2 right-2`}>
    <button
        onclick={() => isOpen = !isOpen}
        class={`z-50 h-[40px] px-4 bg-neutral-600/40 backdrop-blur-sm grid place-items-center rounded-full border-2 border-neutral-800`}
    >
        Menu
    </button>
</nav>

{#if isOpen}
    <ScreenBlur />

    <div class={`z-50 fixed top-14 right-2 bg-neutral-600/40 backdrop-blur-sm flex flex-col px-2 py-2 rounded-lg border-2 border-neutral-800`}>
        <ul class={`flex flex-col`}>
            {#each internalAnchors as anchor (anchor.id)}
                <a class={`text-right ${page.url.pathname === anchor.href ? 'text-green-400' : ''}`} href={anchor.href}>{anchor.display}</a>
            {/each}
        </ul>
    </div>
{/if}