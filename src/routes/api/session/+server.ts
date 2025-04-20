import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "../student/$types";
import { db } from "$lib/server/database/database";
import { Prisma } from "@prisma/client";

export const GET: RequestHandler = async ({ url }) => {
    const studentRollNumber = url.searchParams.get("rollNumber");
    const staffEmail = url.searchParams.get("staffEmail");

    if (!studentRollNumber || !staffEmail) {
        throw error(400, {
            message: "rollNumber or staffEmail not provided in query params",
        });
    }

    try {
        const openSession = await db.session.findFirst({
            where: {
                student: {
                    rollNumber: studentRollNumber.trim().toUpperCase(),
                },
                staff: {
                    user: {
                        email: staffEmail.toLowerCase().trim(),
                    },
                },
                closeTime: null,
                terminated: false,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        rollNumber: true,
                        user: { select: { name: true, email: true } },
                    },
                },
                staff: {
                    select: {
                        id: true,
                        user: { select: { name: true, email: true } },
                    },
                },
            },
        });

        if (!openSession) {
            throw error(404, {
                message: "no open session found for these params",
            });
        }

        return json(openSession, { status: 200 });
    } catch (e: any) {
        if (e.status && e.status >= 400 && e.status < 600) {
            throw e;
        }

        console.error(
            `[API Error /api/session GET]: ${e instanceof Error ? e.message : String(e)}`,
            e,
        );

        throw error(500, {
            message:
                "An internal server error occurred while fetching the session.",
        });
    }
};
