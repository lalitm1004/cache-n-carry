import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$lib/server/database/database";
import { Prisma } from "@prisma/client";

interface DeleteSessionRequestBody {
    rollNumber: string;
    staffEmail: string;
}

export const POST: RequestHandler = async ({ request }) => {
    let requestData: DeleteSessionRequestBody;

    try {
        requestData = (await request.json()) as DeleteSessionRequestBody;
    } catch {
        throw error(400, { message: "invalid json body" });
    }

    const { rollNumber, staffEmail } = requestData;

    try {
        const deleteResult = await db.session.deleteMany({
            where: {
                student: {
                    rollNumber: rollNumber.trim(),
                },
                staff: {
                    user: {
                        email: staffEmail.toLowerCase().trim(),
                    },
                },
                closeTime: null,
                terminated: false,
            },
        });

        if (deleteResult.count === 0) {
            throw error(404, {
                message:
                    "no active non terminated session found for this user and staff",
            });
        }

        return json(
            {
                message: "successfully terminated session",
            },
            { status: 200 },
        );
    } catch (e: any) {
        if (e.status && e.status >= 400 && e.status < 600) {
            throw e;
        }

        console.error(
            `API Error @ /api/session/end POST (delete action): ${e instanceof Error ? e.message : String(e)}`,
            e,
        );

        throw error(500, {
            message: "internal server error",
        });
    }
};
