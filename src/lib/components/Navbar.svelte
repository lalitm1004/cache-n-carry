<script lang="ts">
    import { onNavigate } from "$app/navigation";
    import { page } from "$app/state";
    import ScreenBlur from "./ScreenBlur.svelte";

    let isOpen: boolean = $state(false);

    let internalAnchors = [
        { id: 1, display: 'Home', href: '/' },
        { id: 2, display: 'Belongings', href: '/belongings' },
        { id: 3, display: 'Session', href: '/session' },
        { id: 4, display: 'Incidents', href: '/incidents' },
    ];

    onNavigate(() => {isOpen = false});
</script>

<nav class={`z-50 fixed top-2 right-2`}>
    <button
        onclick={() => isOpen = !isOpen}
        class={`z-50 h-[40px] px-4 bg-neutral-200/60 backdrop-blur-sm grid place-items-center rounded-full border-2 border-neutral-400`}
    >
        Menu
    </button>
</nav>

{#if isOpen}
    <ScreenBlur bind:isOpen />

    <div class={`z-50 fixed top-14 right-2 bg-neutral-200/40 backdrop-blur-sm flex flex-col px-4 py-2 rounded-lg border-2 border-neutral-400`}>
        <ul class={`flex flex-col text-xl`}>
            {#each internalAnchors as anchor (anchor.id)}
                <a
                    class={`text-right ${page.url.pathname === anchor.href ? 'text-neutral-950 text-xl font-bold' : ''}`}
                    href={anchor.href}
                >
                    {anchor.display}
                </a>
            {/each}
        </ul>
    </div>
{/if}