import { TOKEN_NAME as USER_TOKEN_NAME } from "$lib/stores/UserStore";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ cookies }) => {

    const userCookie = cookies.get(USER_TOKEN_NAME);
    if (userCookie) {
        return redirect(303, '/');
    }
    
    return {};
}