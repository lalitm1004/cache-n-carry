import { db } from "$lib/server/database/database";
import { TOKEN_NAME as USER_TOKEN_NAME } from "$lib/stores/UserStore";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ cookies }) => {
    const user = JSON.parse(cookies.get(USER_TOKEN_NAME)!);
    
    if (user.type === 'staff') {
        return {};
    }

    const incidents = await db.incident.findMany({
        where: {
            OR: [
                { foundBy: user.id },
                { belongsTo: user.id },
            ]
        },
        select: {
            id: true,
            foundByStudent: {
                select: {
                    rollNumber: true,
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            },
            belongsToStudent: {
                select: {
                    rollNumber: true,
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            },
            mattressInvolved: {
                select: {
                    id: true,
                    belonging: {
                        select: {
                            description: true
                        }
                    }
                }
            }
        }
    });

    return {
        incidents
    };
}