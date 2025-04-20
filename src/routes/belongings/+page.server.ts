import { db } from "$lib/server/database/database";
import { TOKEN_NAME as USER_TOKEN_NAME} from "$lib/stores/UserStore";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ cookies }) => {
    const user = JSON.parse(cookies.get(USER_TOKEN_NAME)!);
    
    if (user.type === 'staff') {
        return redirect(303, '/');
    }

    const belongings = await db.belonging.findMany({
        where: {
            studentId: user.id
        },
        include: {
            luggage: true,
            mattress: true,
            warehouse: {
                select: { 
                    location: true
                }
            }
        }
    });

    return {
        belongings
    }
}