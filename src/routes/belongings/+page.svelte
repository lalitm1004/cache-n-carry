<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import ScreenBlur from '$lib/components/ScreenBlur.svelte';
    import { UserStore } from '$lib/stores/UserStore';
    import { qr } from '@svelte-put/qr/svg';

    let { data } = $props();
    let { belongings } = $derived(data);

    let isOpen: boolean = $state(false);
    let qrCode: string = $state('');
    let isLuggage: boolean = $state(true);
    let description: string = $state('');

    const inputStyle = 'border-2 border-neutral-400 rounded-md px-2 py-2 bg-neutral-200';

    const handleSubmit = async () => {
        const user = $UserStore!;
        let rollNumber: string = '';
        if (user.type === 'student') rollNumber = user.rollNumber;

        const response = await fetch('/api/belonging', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rollNumber: rollNumber, type: isLuggage ? 'luggage' : 'mattress', description })
        });

        isOpen = false;
        invalidateAll();
    }
</script>

<main class={`h-screen w-screen flex flex-col py-16 px-4`}>
    <div class={`flex flex-col justify-center items-center`}>
        <button onclick={() => isOpen = true} class={`bg-green-400 border-2 border-neutral-400 rounded-full px-4 py-2`}>
            Create Belonging +
        </button>
    </div>

    <ul class={`flex flex-col gap-2 mt-4`}>
        {#each belongings as item (item.id)}
            <li class={`relative flex flex-col border-2 rounded-md px-4 py-2`}>
                <button class={`absolute top-1/2 right-2 -translate-y-1/2`} onclick={() => qrCode = item.id} aria-label="Display QR">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-qr-code-icon lucide-qr-code"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
                </button>

                <div class={`flex gap-2 items-center`}>
                    <div class={`h-[12px] aspect-square rounded-full ${item.isCheckedIn ? 'bg-green-700' : item.checkedOutAt ? 'bg-purple-500' : 'bg-amber-300'}`}></div>
                    <h1>{item.description}</h1>
                </div>

                <div>
                    <p>
                        <span class={`font-bold`}>Status:</span>
                        {#if item.isCheckedIn}
                            Checked In
                        {:else if item.checkedOutAt}
                            Checked Out
                        {:else}
                            Not Checked In Yet
                        {/if}
                    </p>

                    {#if item.isCheckedIn}
                        <p>
                            <span class={`font-bold`}>Location:</span> {item.warehouse?.location}
                        </p>
                    {:else}
                        {item.warehouse?.location}
                    {/if}
                </div>
            </li>
        {/each}
    </ul>
</main>

{#if qrCode.trim()}
    <button onclick={() => qrCode = ''} aria-label={`close menu`} class={`z-40 fixed top-0 left-0 h-dvh w-dvw bg-neutral-900/40 backdrop-blur-sm`}></button>

    <div class={`z-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-200 p-8 rounded-md`}>
        <svg
            class={`z-50 h-[200px] aspect-square text-neutral-950`}
            use:qr={{
                data: qrCode,
                correction: 'H'
            }}
        />
    </div>
{/if}

{#if isOpen}
    <ScreenBlur bind:isOpen/>

    <div class={`z-50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 bg-neutral-200/80 backdrop-blur-sm flex flex-col px-4 py-2 rounded-lg border-2 border-neutral-900`}>
        <form class={`z-50 flex flex-col gap-2`}
            onsubmit={handleSubmit}
        >
            <input
                class={`${inputStyle} z-50`}
                placeholder={`Description`}
                bind:value={description}
                required
            />

            <div class={`z-50 flex justify-center items-center gap-2`}>
                <button type="button" onclick={() => isLuggage = true} class={`z-50 w-1/2 transition-colors duration-200 border-2 px-2 py-2 rounded-md ${isLuggage ? 'border-green-400' : ''}`}>Luggage</button>
                <button type="button" onclick={() => isLuggage = false} class={`z-50 w-1/2 transition-colors duration-200 border-2 px-2 py-2 rounded-md ${!isLuggage ? 'border-green-400' : ''}`}>Mattress</button>
            </div>

            <button type="submit" class={`bg-green-400 border-2 border-neutral-400 rounded-lg px-4 py-2`}>
                Create
            </button>
        </form>
    </div>
{/if}