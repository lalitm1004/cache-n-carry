<script lang="ts">
    import { UserStore } from "$lib/stores/UserStore";
</script>

<main
    class="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-gradient-to-br from-gray-50 to-gray-100"
>
    <h1
        class="text-5xl font-extrabold text-gray-800 mb-4 tracking-tight font-bespoke font-bold"
    >
        CacheNCarry
    </h1>

    <p
        class="text-gray-600 text-base max-w-xs mb-10 leading-relaxed font-quattro"
    >
        Where <span class="italic">"left behind"</span> meets
        <code class="bg-gray-200 px-1 rounded text-sm font-mono text-green-800"
            >LEFT JOIN</code
        >
    </p>

    {#if $UserStore?.type === "student"}
        <div class="flex flex-col gap-4 w-full max-w-xs">
            <a
                href="/belongings"
                class="w-full py-2 px-4 bg-green-400 text-white rounded-lg border-2 border-green-800 hover:bg-green-500 active:bg-green-600 transition-all font-supreme"
            >
                View My Belongings
            </a>
            <a
                href="/session"
                class="w-full py-2 px-4 bg-green-400 text-white rounded-lg border-2 border-green-800 hover:bg-green-500 active:bg-green-600 transition-all font-supreme"
            >
                View My Sessions
            </a>
            <a
                href="/incidents"
                class="w-full py-2 px-4 bg-green-400 text-white rounded-lg border-2 border-green-800 hover:bg-green-500 active:bg-green-600 transition-all font-supreme"
            >
                View My Incidents
            </a>
        </div>
    {:else}
        <div class="flex flex-col gap-4 w-full max-w-xs">
            <a
                href="/session"
                class="w-full py-2 px-4 bg-green-400 text-white rounded-lg border-2 border-green-800 hover:bg-green-500 active:bg-green-600 transition-all font-supreme"
            >
                View My Sessions
            </a>
        </div>
    {/if}
</main>
