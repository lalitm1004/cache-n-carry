import { json, error } from "@sveltejs/kit";
// Adjust the import path based on your actual file structure
import type { RequestHandler } from "./$types";
import { PrismaClient, Prisma } from "@prisma/client";
import crypto from "crypto"; // Import crypto for UUID generation

// Assuming a shared Prisma Client instance (e.g., from $lib/server/database)
// Replace this if you have a central instance:
const db = new PrismaClient();
// If using a central instance like `import { db } from '$lib/server/database/database';`, use that instead.

// --- Input Type ---
interface SessionRequestBody {
    staffEmail: string;
    rollNumber: string;
}

// --- Result Types for Raw Queries ---
interface StudentIdResult {
    id: string;
}
interface UserIdResult {
    id: string;
}
interface StaffIdResult {
    id: string;
}
// Type for selecting the created session data
interface CreatedSessionRawResult {
    id: string;
    remark: string | null;
    open_time: Date;
    close_time: Date | null;
    terminated: boolean; // DB column name is `terminated`
    staff_id: string;
    student_id: string;
}

// Structure for the final response
type NewSessionResponse = CreatedSessionRawResult;

export const POST: RequestHandler = async ({ request }) => {
    let requestData: SessionRequestBody;

    try {
        requestData = (await request.json()) as SessionRequestBody;
    } catch (e) {
        throw error(400, { message: "invalid json payload" });
    }

    const { staffEmail, rollNumber } = requestData;

    if (!staffEmail || !rollNumber) {
        throw error(400, {
            message:
                "missing required fields, make sure staffEmail and rollNumber are provided",
        });
    }

    const trimmedRollNumber = rollNumber.trim();
    const trimmedStaffEmail = staffEmail.toLowerCase().trim();

    try {
        const newSessionRaw = await db.$transaction(async (tx) => {
            // 1. Find Student ID using rollNumber
            const studentResult = await tx.$queryRaw<StudentIdResult[]>`
                SELECT id FROM student WHERE roll_number = ${trimmedRollNumber} LIMIT 1`;

            if (studentResult.length === 0) {
                throw new Prisma.PrismaClientKnownRequestError(
                    `student with roll number '${trimmedRollNumber}' not found`,
                    {
                        code: "P2025",
                        clientVersion: Prisma.prismaVersion.client,
                    },
                );
            }
            const studentId = studentResult[0].id;

            // 2. Find User ID using staffEmail
            const userResult = await tx.$queryRaw<UserIdResult[]>`
                SELECT id FROM user WHERE email = ${trimmedStaffEmail} LIMIT 1`;

            if (userResult.length === 0) {
                throw new Prisma.PrismaClientKnownRequestError(
                    `user with email ${trimmedStaffEmail} not found`,
                    {
                        code: "P2025",
                        clientVersion: Prisma.prismaVersion.client,
                    },
                );
            }
            const userId = userResult[0].id;

            // 3. Verify the User is a Staff member using the User ID
            const staffResult = await tx.$queryRaw<StaffIdResult[]>`
                SELECT id FROM staff WHERE id = ${userId} LIMIT 1`;

            if (staffResult.length === 0) {
                throw new Prisma.PrismaClientKnownRequestError(
                    `user with email ${trimmedStaffEmail} exists but is not registered as staff`,
                    {
                        code: "P2025",
                        clientVersion: Prisma.prismaVersion.client,
                    },
                );
            }
            const staffId = staffResult[0].id;

            // 4. Generate ID for the new session
            const newSessionId = crypto.randomUUID();

            // 5. Insert the new session record
            await tx.$executeRaw`
                INSERT INTO session (id, staff_id, student_id)
                VALUES (${newSessionId}, ${staffId}, ${studentId})`;

            // 6. Select the newly created session data to return - CORRECTED QUERY
            const createdSessionResult = await tx.$queryRaw<
                CreatedSessionRawResult[]
            >`
                SELECT id, remark, open_time, close_time, \`terminated\`, staff_id, student_id
                FROM session
                WHERE id = ${newSessionId}
                LIMIT 1`; // Added backticks around terminated

            if (createdSessionResult.length === 0) {
                console.error(
                    `Transaction Error @ /api/session POST: Could not retrieve session ${newSessionId} after creation.`,
                );
                throw new Error("Failed to retrieve created session data.");
            }

            return createdSessionResult[0];
        }); // End $transaction

        // Return the raw result structure
        return json(newSessionRaw as NewSessionResponse, { status: 201 });
    } catch (e: any) {
        // Handle errors from transaction or validation
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            // Unique constraint violation
            if (e.code === "P2002") {
                const targetFields = e.meta?.target as string[] | undefined;
                if (
                    targetFields?.includes("staff_id") &&
                    targetFields?.includes("student_id")
                ) {
                    throw error(409, {
                        message: `Conflict: An active session already exists between this staff member and student.`,
                    });
                } else {
                    throw error(409, {
                        message: `Conflict: A unique constraint violation occurred.`,
                    });
                }
            }
            // Record not found
            if (e.code === "P2025") {
                throw error(404, { message: e.message });
            }
            // Foreign key constraint failed
            if (e.code === "P2003") {
                console.error(
                    `API Error @ /api/session POST: Foreign key constraint failed. Meta: ${JSON.stringify(e.meta)}`,
                    e,
                );
                throw error(400, {
                    message: `Invalid Input: A data integrity constraint failed.`,
                });
            }
            // Raw query failed (syntax error, etc.)
            if (e.code === "P2010") {
                const dbErrorMessage =
                    (e.meta?.message as string) ||
                    "Raw query failed within transaction";
                const dbErrorCode = (e.meta?.code as string) || "UNKNOWN";
                console.error(
                    `API Error @ /api/session POST: Raw query failed. DB Code: ${dbErrorCode}. DB Message: ${dbErrorMessage}`,
                    e,
                );
                throw error(500, {
                    message: `Database query error (${dbErrorCode})`,
                });
            }
        }

        // Generic error handling
        console.error(
            `API Error @ /api/session POST: ${e instanceof Error ? e.message : String(e)}`,
            e,
        );
        throw error(500, { message: "internal server error" });
    }
    // Removed finally { await db.$disconnect(); }
};
