<script lang="ts">
    let { data } = $props();
    let { incidents } = $derived(data);
</script>

<main class={`h-screen w-screen flex flex-col justify-center items-center`}>
    {#if incidents}
        <ul>
            {#each incidents as incident (incident.id)}
                <li class={`flex flex-col border-2 px-4 py-2 rounded-md`}>
                    <p class={``}>
                        <span class={`font-bold`}>Belongs To:</span>
                        {incident.belongsToStudent.user.name} | {incident.belongsToStudent.user.email}
                    </p>
                    <p class={``}>
                        <span class={`font-bold`}>Found By:</span>
                        {incident.foundByStudent.user.name} | {incident.foundByStudent.user.email}
                    </p>
                    <p>
                        <span class={`font-bold`}>Mattress Involved:</span>
                        {incident.mattressInvolved.belonging.description}
                    </p>
                </li>
            {/each}
        </ul>
    {:else}
        <p>No Incidents Yet :D</p>
    {/if}
</main>