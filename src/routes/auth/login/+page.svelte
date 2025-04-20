<script lang="ts">
    import { goto } from "$app/navigation";
    import { addToast } from "$lib/stores/ToastStore";
    import { setUser } from "$lib/stores/UserStore";

    type PageState = 'student' | 'staff';

    let pageState: PageState = $state('student');

    let email = $state('');
    let password = $state('');

    const handleStudentSubmit = async () => {
        try {
            const params = new URLSearchParams({ email, password });
            const response = await fetch(`/api/student?${params.toString()}`, {
                method: 'GET',
            });

            if (response.ok) {
            	const data = await response.json();

                if (data.success) {
                    setUser({
                        type: 'student',
                        id: data.student.id,
                        name: data.student.name,
                        email: data.student.email,
                        rollNumber: data.student.rollNumber,
                        currentRoomId: data.student.currentRoomId,
                        nextRoomId: data.student.nextRoomId,
                    });

                    goto('/')
                } else {
                    addToast({
                        message: 'Invalid credentials',
                        type: 'warning'
                    });
                }
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
        try {
            const params = new URLSearchParams({ email, password })
            const response = await fetch(`/api/staff?${params.toString()}`, {
                method: 'GET',
            });

            if (response.ok) {
                const data = await response.json();

                if (data.success) {
                    setUser({
                        type: 'staff',
                        id: data.staff.id,
                        name: data.staff.name,
                        email: data.staff.email,
                    });
                    goto('/')
                } else {
                    addToast({
                        message: 'Invalid credentials',
                        type: 'warning'
                    });
                }
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
    }

    const inputStyle = 'border-2 border-neutral-400 rounded-md px-2 py-2 bg-neutral-200';
</script>

<main class={`h-dvh w-dvw overflow-hidden flex flex-col items-center gap-4 px-4 py-16`}>
    <h1 class={`font-neue-machina font-bold text-4xl w-full`}>
        Login
    </h1>

    <div class="w-[70%] flex flex-row justify-center gap-2 px-1 py-1 bg-neutral-200 rounded-lg text-lg">
        <button
            class={`w-1/2 px-4 py-2 rounded-lg transition-colors duration-300 ${pageState === 'student' ? 'bg-neutral-400' : 'bg-transparent'}`}
            onclick={() => (pageState = 'student')}
        >
            Student
        </button>

        <button
            class={`w-1/2 px-4 py-2 rounded-lg transition-colors duration-300 ${pageState === 'staff' ? 'bg-neutral-400' : 'bg-transparent'}`}
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
                type="email"
                placeholder="Email"
                bind:value={email}
                class={`${inputStyle}`}
                required
            />

            <input
                type="password"
                placeholder="Password"
                bind:value={password}
                class={`${inputStyle}`}
                required
            />

            <button type="submit" class={`bg-green-400 text-white px-4 py-2 rounded-lg active:bg-green-800`}>
                Login
            </button>
        </form>
    {:else}
        <form
            class={`flex flex-col gap-2 w-[90%]`}
            onsubmit={handleStaffSubmit}
        >
            <input
                type="email"
                placeholder="Email"
                bind:value={email}
                class={`${inputStyle}`}
                required
            />

            <input
                type="password"
                placeholder="Password"
                bind:value={password}
                class={`${inputStyle}`}
                required
            />

            <button type="submit" class={`bg-green-400 text-white px-4 py-2 rounded-lg active:bg-green-800`}>
                Register
            </button>
        </form>
    {/if}

    <div class={`w-full flex flex-col justify-center items-center`}>
        <a href="/auth/register" class={`underline`}>Goto Register</a>
    </div>
</main>

<svelte:head>
    <title>CacheNCarry | Login</title>
</svelte:head>