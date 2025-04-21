import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit"; // Use correct import path
import { db } from "$lib/server/database/database"; // Assuming central DB instance
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
        // Keep original error message style
        throw error(400, { message: "invalid json body" });
    }

    const { rollNumber, staffEmail } = requestData;

    // Basic validation
    if (!rollNumber || !staffEmail) {
        throw error(400, { message: "rollNumber and staffEmail are required" });
    }

    // Prepare parameters
    const trimmedRollNumber = rollNumber.trim();
    const trimmedStaffEmail = staffEmail.toLowerCase().trim();

    try {
        // Use $executeRaw for DELETE operations
        // Use subqueries to find the student_id and staff_id
        const affectedRows = await db.$executeRaw`
            DELETE FROM session
            WHERE
                close_time IS NULL
                AND \`terminated\` = false -- Quote 'terminated'
                AND student_id = (
                    SELECT id
                    FROM student
                    WHERE roll_number = ${trimmedRollNumber}
                    LIMIT 1 -- Ensure subquery returns at most one row
                )
                AND staff_id = (
                    SELECT s.id
                    FROM user u
                    JOIN staff s ON u.id = s.id
                    WHERE u.email = ${trimmedStaffEmail}
                    LIMIT 1 -- Ensure subquery returns at most one row
                )`;

        // $executeRaw returns the number of rows affected by the DELETE statement
        if (affectedRows === 0) {
            // Throw the specific 404 error if no matching active session was found and deleted
            throw error(404, {
                message:
                    "no active non terminated session found for this user and staff",
            });
        }

        // If affectedRows > 0, the deletion was successful
        return json(
            {
                message: `Successfully terminated ${affectedRows} session(s).`, // More informative message
            },
            { status: 200 },
        );
    } catch (e: any) {
        // Re-throw explicit SvelteKit errors (like the 404 we threw)
        if (
            e &&
            typeof e === "object" &&
            "status" in e &&
            e.status >= 400 &&
            e.status < 600
        ) {
            throw e;
        }

        // Handle potential raw query errors (e.g., syntax error)
        if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2010"
        ) {
            const dbErrorMessage =
                (e.meta?.message as string) || "Raw query failed";
            const dbErrorCode = (e.meta?.code as string) || "UNKNOWN";
            console.error(
                `API Error @ /api/session/end POST: Raw query failed. DB Code: ${dbErrorCode}. DB Message: ${dbErrorMessage}`,
                e,
            );
            throw error(500, {
                message: `Database query error (${dbErrorCode})`,
            });
        }

        // Log any other unexpected errors
        console.error(
            `API Error @ /api/session/end POST (delete action): ${e instanceof Error ? e.message : String(e)}`,
            e,
        );

        // Generic fallback error
        throw error(500, {
            message: "internal server error",
        });
    }
    // Removed finally { await db.$disconnect(); }
};
