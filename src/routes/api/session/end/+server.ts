import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { db } from "$lib/server/database/database";
import { Prisma } from "@prisma/client";

interface TerminateSessionRequestBody {
    rollNumber: string;
    staffEmail: string;
}

export const POST: RequestHandler = async ({ request }) => {
    let requestData: TerminateSessionRequestBody;

    try {
        requestData = (await request.json()) as TerminateSessionRequestBody;
    } catch (e) {
        throw error(400, { message: "invalid json body" });
    }

    const { rollNumber, staffEmail } = requestData;

    if (!rollNumber || !staffEmail) {
        console.log(rollNumber);
        console.log(staffEmail);
        throw error(400, {
            message: "rollNumber or staffEmail not provided",
        });
    }

    try {
        const updateResult = await db.session.updateMany({
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
            data: {
                terminated: true,
            },
        });

        if (updateResult.count === 0) {
            throw error(404, {
                message:
                    "no active non terminated session found for the user and staff to terminate",
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
            `API Error @ /api/session/terminate POST: ${e instanceof Error ? e.message : String(e)}`,
            e,
        );

        throw error(500, { message: "internal server error" });
    }
};
