import { db } from "$lib/server/database/database";
import { TOKEN_NAME as USER_TOKEN_NAME } from "$lib/stores/UserStore";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ cookies }) => {
    const user = JSON.parse(cookies.get(USER_TOKEN_NAME)!);
    
    if (user.type === 'student') {
        return {};
    }

    const sessions = await db.session.findMany({
        where: {
            staffId: user.id
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

    console.log(user.id)
    console.log(sessions);
    
    return {
        sessions
    };
}