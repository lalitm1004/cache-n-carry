<script lang="ts">
    let { isOpen = $bindable(true) } = $props();
</script>

<button onclick={() => isOpen = false} aria-label={`close menu`} class={`z-40 absolute top-0 left-0 h-dvh w-dvw bg-neutral-900/40 backdrop-blur-sm`}></button>