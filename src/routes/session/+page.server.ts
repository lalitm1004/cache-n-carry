import { db } from "$lib/server/database/database";
import { TOKEN_NAME as USER_TOKEN_NAME } from "$lib/stores/UserStore";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ cookies }) => {
    const user = JSON.parse(cookies.get(USER_TOKEN_NAME)!);
    
    if (user.type === 'student') {
        return redirect(303, '/');
    }

    const sessions = await db.session.findMany({
        where: {
            id: user.id
        },
        select: {
            id: true,
            remark: true,
            openTime: true,
            closeTime: true,
            terminated: true,
            student: {
                select: {
                    id: true,
                    rollNumber: true,
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                },
            }
        },
    })
    
    return {
        sessions
    };
}