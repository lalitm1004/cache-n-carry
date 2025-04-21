<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import ScreenBlur from "$lib/components/ScreenBlur.svelte";
    import { setWarehouse } from "$lib/stores/CloakroomStore.js";
    import { UserStore } from "$lib/stores/UserStore";
    import { qr } from "@svelte-put/qr/svg";
    import { onMount } from "svelte";

    let { data } = $props();
    let { sessions } = $derived(data);

    onMount(() => {
        console.log(sessions);
    })

    let isOpen: boolean = $state(false);
    let cloakroom: string = $state('');
    let rollNumber: string = $state('');

    const handleSubmit = async () => {
        const response = await fetch('/api/session/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffEmail: $UserStore!.email, rollNumber }),
        });
        setWarehouse({
            name: cloakroom
        });
        isOpen = false;
        invalidateAll();
    }

    const endSession = async (sessionId: string, rollNumber:string) => {
        const response = await fetch('/api/session/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffEmail: $UserStore!.email, rollNumber }),
        })

        invalidateAll();
    }

    const inputStyle = 'border-2 border-neutral-400 rounded-md px-2 py-2 bg-neutral-200';
</script>

<main class={`h-screen w-screen grid place-items-center`}>
    {#if $UserStore?.type === 'student'}
        <div class={`flex flex-col justify-center items-center`}>
            <p class={`font-bold text-3xl`}>
                {$UserStore.rollNumber}
            </p>
            <p class={`text-center`}>Have a staff member enter your RollNumber to begin a session!</p>
        </div>
    {:else}
        <div class={`w-full px-4 flex flex-col gap-4`}>
            <div class={`flex flex-col justify-center items-center`}>
                <button onclick={() => isOpen = true} class={`bg-green-400 border-2 border-neutral-400 rounded-full px-4 py-2`}>
                    Create Session +
                </button>
            </div>
            <ul class={`flex flex-col w-full`}>
                {#each sessions! as session (session.id)}
                    <a class={`relative flex flex-col border-2 px-2 rounded-lg justify-center items-center p-2`} href={`/session/${session.id}`}>
                        <p class={`font-bold text-2xl`}>Session</p>
                        <p>{session.student.user.name}</p>
                        <p>{session.student.user.email}</p>
                        <p>{session.student.rollNumber}</p>

                        <button onclick={() => endSession(session.id, session.student.rollNumber)} class={`bg-red-600 rounded-md text-white w-fit px-4 py-2`}>End Session</button>
                    </a>
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

            <input
                class={`${inputStyle} z-50`}
                placeholder={`Student Roll Number`}
                bind:value={rollNumber}
                required
            />

            <button type="submit" class={`bg-green-400 border-2 border-neutral-400 rounded-lg px-4 py-2`}>
                Create Session
            </button>
        </form>
    </div>
{/if}