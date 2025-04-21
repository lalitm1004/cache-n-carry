<script lang="ts">
    import { goto } from "$app/navigation";
import { setUser } from "$lib/stores/UserStore";
</script>

<main class={`h-screen w-screen grid place-items-center`}>
    <button class={`bg-red-800 text-white px-4 py-2`}
        onclick={() => {
            setUser(null);
            goto('/auth/register')
        }}>
        Log Out
    </button>
    <a href="/">Home</a>
</main>