import { TOKEN_NAME as USER_TOKEN_NAME } from "$lib/stores/UserStore";
import { redirect, type Handle } from "@sveltejs/kit";

const authGuard: Handle = async ({ event, resolve }) => {
    const currentPath = event.url.pathname;
    if (currentPath.startsWith("/api")) {
        // console.log('hahah')
        return resolve(event);
    }
    
    const userCookie = event.cookies.get(USER_TOKEN_NAME);
    
    if (!userCookie) {
        event.cookies.delete(USER_TOKEN_NAME, { path: "/" });
        if (!currentPath.startsWith("/auth")) return redirect(303, "/auth/register");
    } else {
        try {
            JSON.parse(userCookie);
        } catch (e) {
            console.error(`[ERROR] Malformed UserCookie: ${e}`);
            event.cookies.delete(USER_TOKEN_NAME, { path: "/" });
            return redirect(303, "/auth");
        }
    }
    
    return resolve(event);
};

export default authGuard;