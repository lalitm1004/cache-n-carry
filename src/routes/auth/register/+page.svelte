<script lang="ts">
    import { goto } from "$app/navigation";
    import { addToast } from "$lib/stores/ToastStore";
    import { setUser } from "$lib/stores/UserStore";

    type PageState = 'student' | 'staff';

    let pageState: PageState = $state('student');

    // user + staff
    let name = $state('')
    let email = $state('');
    let password = $state('');

    // student specific
    let rollNumber = $state('');
    let hostelName = $state('');
    let roomNumber = $state('');

    const handleStudentSubmit = async () => {
        try {
            const response = await fetch('/api/student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, rollNumber, hostelName, roomNumber })
            });

            if (response.ok) {
            	const data = await response.json();
                setUser({
                    type: 'student',
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    rollNumber: data.rollNumber,
                    currentRoomId: data.currentRoomId,
                    nextRoomId: null,
                });
                goto('/')
            } else {
                const error = await response.json();
                addToast({
                    message: error.message || 'Login failed. Please try again.',
                    type: 'danger'
                });
            }
        } catch (error) {
            addToast({
                message: 'An error occured. Please try again.',
                type: 'danger'
            });
        }
    };

    const handleStaffSubmit = async () => {
        
    }
</script>

<main class={`h-dvh w-dvw overflow-hidden flex flex-col items-center gap-4 px-4 py-16`}>
    <h1 class={`font-neue-machina font-bold text-4xl w-full`}>
        Register
    </h1>

    <div class="w-[90%] flex flex-row justify-center gap-2 px-1 py-1 bg-neutral-700 rounded-lg text-lg">
        <button
            class={`w-1/2 px-4 py-2 rounded-lg ${pageState === 'student' ? 'bg-neutral-200 text-neutral-950' : 'bg-transparent text-white'}`}
            onclick={() => (pageState = 'student')}
        >
            Student
        </button>

        <button
            class={`w-1/2 px-4 py-2 rounded-lg ${pageState === 'staff' ? 'bg-neutral-200 text-neutral-950' : 'bg-transparent text-white'}`}
            onclick={() => (pageState = 'staff')}
        >
            Staff
        </button>
    </div>

    {#if pageState === 'student'}
        <form
            class={`flex flex-col gap-2 w-[90%]`}
            onsubmit={handleStudentSubmit}
        >
            <input
                type="text"
                placeholder="Name"
                bind:value={name}
                class={`border p-2 font-quattro rounded-lg bg-neutral-800`}
                required
            />

            <input
                type="email"
                placeholder="Email"
                bind:value={email}
                class={`border p-2 rounded-lg bg-neutral-800`}
                required
            />

            <input
                type="password"
                placeholder="Password"
                bind:value={password}
                class={`border p-2 rounded-lg bg-neutral-800`}
                required
            />

            <input
                type="text"
                placeholder="Roll Number"
                bind:value={rollNumber}
                class={`border p-2 rounded-lg bg-neutral-800`}
                required
            />

            <input
                type="text"
                placeholder="Hostel Name"
                bind:value={hostelName}
                class={`border p-2 rounded-lg bg-neutral-800`}
                required
            />

            <input
                type="text"
                placeholder="Room Number"
                bind:value={roomNumber}
                class={`border p-2 rounded-lg bg-neutral-800`}
                required
            />

            <button type="submit" class={`bg-tranparent border-2 border-green-400 text-white px-4 py-2 rounded-lg active:bg-green-200/20`}>
                Register
            </button>
        </form>
    {:else}
        <form
            class={`flex flex-col gap-2 w-[90%]`}
            onsubmit={handleStaffSubmit}
        >
            <input
                type="text"
                placeholder="Name"
                bind:value={name}
                class={`border p-2 font-quattro rounded-lg bg-neutral-800`}
                required
            />

            <input
                type="email"
                placeholder="Email"
                bind:value={email}
                class={`border p-2 rounded-lg bg-neutral-800`}
                required
            />

            <input
                type="password"
                placeholder="Password"
                bind:value={password}
                class={`border p-2 rounded-lg bg-neutral-800`}
                required
            />

            <button type="submit" class={`bg-tranparent border-2 border-green-400 text-white px-4 py-2 rounded-lg active:bg-green-200/20`}>
                Register
            </button>
        </form>
    {/if}
</main>

<svelte:head>
    <title>CacheNCarry | SignIn</title>
</svelte:head>