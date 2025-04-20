<script lang="ts">
    import ScreenBlur from '$lib/components/ScreenBlur.svelte';
    import { WarehouseStore } from '$lib/stores/CloakroomStore';
    import { UserStore } from '$lib/stores/UserStore';

    let isOpen: boolean = $state(false);
    let checkIn: boolean = $state(true);
    let belonging: string = $state('');

    const inputStyle = 'border-2 border-neutral-400 rounded-md px-2 py-2 bg-neutral-200';

    const handleSubmit = async () => {
        const response = await fetch(`/api/belonging/check${checkIn ? 'in' : 'out'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ belongingId: belonging, warehouseName: $WarehouseStore!.name, staffEmail: $UserStore!.email })
        });
        isOpen = false;
    }
</script>

<!-- {page.params.sessionId} -->

<main class={`h-screen w-screen grid place-items-center`}>
    {#if $UserStore?.type === 'student'}
        <div class={`flex flex-col justify-center items-center`}>
            <a href="/session">Goto /session</a>
        </div>
    {:else}
        <div class={`w-full px-4 flex flex-col gap-4`}>
            <div class={`flex flex-col gap-2 justify-center items-center`}>
                <button onclick={() => {isOpen = true; checkIn = true;}} class={`bg-green-400 border-2 border-neutral-400 rounded-full px-4 py-2`}>
                    Check In Item +
                </button>

                <button onclick={() => {isOpen = true; checkIn = false;}} class={`bg-green-400 border-2 border-neutral-400 rounded-full px-4 py-2`}>
                    Check Out Item +
                </button>
            </div>
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
                placeholder={`Belonging ID`}
                bind:value={belonging}
                required
            />

            <button type="submit" class={`bg-green-400 border-2 border-neutral-400 rounded-lg px-4 py-2`}>
                Check
                {#if checkIn}
                    In
                {:else}
                    Out
                {/if}
            </button>
        </form>
    </div>
{/if}