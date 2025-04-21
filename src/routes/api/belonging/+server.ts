import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types"; // Adjusted import path assuming file structure
import { PrismaClient, Prisma } from "@prisma/client";
import crypto from "crypto"; // Import crypto for UUIDs

// Assuming a shared Prisma Client instance (e.g., from $lib/server/database)
// Replace this if you have a central instance:
const db = new PrismaClient();
// If using a central instance like `import { db } from '$lib/server/database/database';`, use that instead.

// --- Common Types ---
type BelongingType = "luggage" | "mattress";

// --- POST Types ---
interface BelongingRegistrationBody {
    rollNumber: string;
    type: BelongingType;
    description?: string;
}

interface StudentIdResult {
    id: string;
}

// Interface for the data selected *after* creation in POST
// Needs to match the columns selected in the final SELECT query
interface NewBelongingRawResult {
    id: string;
    description: string | null;
    is_checked_in: boolean;
    student_id: string;
    warehouse_id: string | null;
    checked_in_at: Date | null;
    checked_out_at: Date | null;
    luggage_id: string | null; // From LEFT JOIN luggage
    mattress_id: string | null; // From LEFT JOIN mattress
    warehouse_location: string | null; // From LEFT JOIN warehouse
}

// Structure for the final POST response (camelCase)
interface NewBelongingResponse {
    id: string;
    description: string | null;
    isCheckedIn: boolean;
    studentId: string;
    warehouseId: string | null;
    checkedInAt: Date | null;
    checkedOutAt: Date | null;
    // Replicate nested structure from original 'select'/'include'
    luggage: { id: string } | null;
    mattress: { id: string } | null;
    warehouse: { location: string } | null;
}

// --- GET Types ---
// Interface for the data selected in the GET request
interface FetchedBelongingRawResult {
    id: string;
    description: string | null;
    is_checked_in: boolean;
    student_id: string;
    warehouse_id: string | null;
    checked_in_at: Date | null;
    checked_out_at: Date | null;
    luggage_id: string | null; // From LEFT JOIN luggage
    mattress_id: string | null; // From LEFT JOIN mattress
    warehouse_location: string | null; // From LEFT JOIN warehouse
}

// Structure for the final GET response items (camelCase)
// This is identical to NewBelongingResponse for structure
type FetchedBelongingResponse = NewBelongingResponse;

// ==================
// === POST Handler ===
// ==================
export const POST: RequestHandler = async ({ request }) => {
    let requestData: BelongingRegistrationBody;

    try {
        requestData = (await request.json()) as BelongingRegistrationBody;
    } catch (e) {
        // Keep original error message style
        throw error(400, { message: "invalid json payload" });
    }

    const { rollNumber, type, description } = requestData;
    const trimmedRollNumber = rollNumber.trim();
    const trimmedDescription = description?.trim() || null; // Handle optional description

    // Basic input validation
    if (!trimmedRollNumber || !type) {
        throw error(400, { message: "rollNumber and type are required" });
    }
    if (type !== "luggage" && type !== "mattress") {
        throw error(400, { message: "type must be 'luggage' or 'mattress'" });
    }

    try {
        // Use interactive transaction
        const newBelongingRaw = await db.$transaction(async (tx) => {
            // 1. Find Student ID using rollNumber
            const studentResult = await tx.$queryRaw<StudentIdResult[]>`
                SELECT id FROM student WHERE roll_number = ${trimmedRollNumber} LIMIT 1`;

            if (studentResult.length === 0) {
                // Throw P2025 for student not found, matching original behavior
                throw new Prisma.PrismaClientKnownRequestError(
                    `student with roll no. ${trimmedRollNumber} not found`,
                    {
                        code: "P2025",
                        clientVersion: Prisma.prismaVersion.client,
                    },
                );
            }
            const studentId = studentResult[0].id;

            // 2. Generate ID for the new belonging
            const newBelongingId = Math.floor(Math.random() * 1000000).toString(); 

            // 3. Insert into belonging table
            // Note: is_checked_in defaults to false in schema, warehouse_id defaults null
            await tx.$executeRaw`
                INSERT INTO belonging (id, description, student_id)
                VALUES (${newBelongingId}, ${trimmedDescription}, ${studentId})`;

            // 4. Conditionally insert into luggage or mattress table
            if (type === "luggage") {
                await tx.$executeRaw`
                    INSERT INTO luggage (id) VALUES (${newBelongingId})`;
            } else if (type === "mattress") {
                await tx.$executeRaw`
                    INSERT INTO mattress (id) VALUES (${newBelongingId})`;
            }

            // 5. Select the newly created belonging with related data (matching original 'select')
            const finalResult = await tx.$queryRaw<NewBelongingRawResult[]>`
                SELECT
                    b.id, b.description, b.is_checked_in, b.student_id, b.warehouse_id,
                    b.checked_in_at, b.checked_out_at,
                    l.id as luggage_id,
                    m.id as mattress_id,
                    w.location as warehouse_location
                FROM belonging b
                LEFT JOIN luggage l ON b.id = l.id
                LEFT JOIN mattress m ON b.id = m.id
                LEFT JOIN warehouse w ON b.warehouse_id = w.id
                WHERE b.id = ${newBelongingId}
                LIMIT 1`;

            if (finalResult.length === 0) {
                // Should not happen after successful insert, but good practice
                console.error(
                    `Transaction Error @ /api/belonging POST: Could not retrieve belonging ${newBelongingId} after creation.`,
                );
                throw new Error("Failed to retrieve created belonging data.");
            }

            return finalResult[0]; // Return the raw result from the transaction
        }); // End $transaction

        // Map the raw result (snake_case) to the desired response structure (camelCase)
        const responseData: NewBelongingResponse = {
            id: newBelongingRaw.id,
            description: newBelongingRaw.description,
            isCheckedIn: newBelongingRaw.is_checked_in,
            studentId: newBelongingRaw.student_id,
            warehouseId: newBelongingRaw.warehouse_id,
            checkedInAt: newBelongingRaw.checked_in_at,
            checkedOutAt: newBelongingRaw.checked_out_at,
            luggage: newBelongingRaw.luggage_id
                ? { id: newBelongingRaw.luggage_id }
                : null,
            mattress: newBelongingRaw.mattress_id
                ? { id: newBelongingRaw.mattress_id }
                : null,
            warehouse: newBelongingRaw.warehouse_location
                ? { location: newBelongingRaw.warehouse_location }
                : null,
        };

        return json(responseData, { status: 201 }); // Return 201 Created status
    } catch (e: any) {
        // Handle errors thrown from transaction or validation
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            // Student not found (P2025 thrown manually) -> 400 Bad Request
            if (e.code === "P2025") {
                throw error(400, { message: e.message });
            }
            // Foreign Key constraint (e.g., invalid student_id if logic changed) -> 400 Bad Request
            if (e.code === "P2003") {
                console.error(
                    `API Error @ /api/belonging POST: Foreign key constraint failed. Meta: ${JSON.stringify(e.meta)}`,
                    e,
                );
                throw error(400, {
                    message: `Invalid input: a foreign key constraint failed (${e.meta?.field_name || "unknown field"})`,
                });
            }
            // Unique constraint violation (e.g., duplicate belonging ID if UUID generation failed) -> 409 Conflict
            if (e.code === "P2002") {
                const target = e.meta?.target as string[] | string | undefined;
                let targetDesc = "a unique field";
                if (typeof target === "string") targetDesc = target;
                else if (Array.isArray(target)) targetDesc = target.join(", ");
                console.error(
                    `API Error @ /api/belonging POST: Unique constraint failed on ${targetDesc}.`,
                    e,
                );
                throw error(409, {
                    // Keep original message style
                    message: `belonging with this value for ${targetDesc} already exists`,
                });
            }
            // Raw query failed (syntax error, etc.)
            if (e.code === "P2010") {
                const dbErrorMessage =
                    (e.meta?.message as string) ||
                    "Raw query failed within transaction";
                const dbErrorCode = (e.meta?.code as string) || "UNKNOWN";
                console.error(
                    `API Error @ /api/belonging POST: Raw query failed. DB Code: ${dbErrorCode}. DB Message: ${dbErrorMessage}`,
                    e,
                );
                throw error(500, {
                    message: `Database query error (${dbErrorCode})`,
                });
            }
        }

        // Generic error handling
        console.error(
            `api error @ /api/belonging POST: ${e instanceof Error ? e.message : String(e)}`,
            e,
        );
        throw error(500, { message: "internal server error" });
    }
    // Removed finally { await db.$disconnect(); }
};

// =================
// === GET Handler ===
// =================
export const GET: RequestHandler = async ({ url }) => {
    const rollNumber = url.searchParams.get("rollNumber");

    if (!rollNumber) {
        throw error(400, {
            message: "missing required query param rollNumber",
        });
    }
    const trimmedRollNumber = rollNumber.trim();

    try {
        // 1. Find Student ID first
        const studentResult = await db.$queryRaw<StudentIdResult[]>`
            SELECT id FROM student WHERE roll_number = ${trimmedRollNumber} LIMIT 1`;

        if (studentResult.length === 0) {
            // Throw 404 directly, matching original behavior
            throw error(404, {
                message: `student with roll number ${trimmedRollNumber} not found`,
            });
        }
        const studentId = studentResult[0].id;

        // 2. Fetch belongings for the student using raw SQL with JOINs
        const belongingsRaw = await db.$queryRaw<FetchedBelongingRawResult[]>`
            SELECT
                b.id, b.description, b.is_checked_in, b.student_id, b.warehouse_id,
                b.checked_in_at, b.checked_out_at,
                l.id as luggage_id,
                m.id as mattress_id,
                w.location as warehouse_location
            FROM belonging b
            LEFT JOIN luggage l ON b.id = l.id
            LEFT JOIN mattress m ON b.id = m.id
            LEFT JOIN warehouse w ON b.warehouse_id = w.id
            WHERE b.student_id = ${studentId}
            ORDER BY b.checked_in_at ASC`; // Ensure ordering matches original

        // 3. Map the raw results to the desired response structure (camelCase)
        const belongingsResponse: FetchedBelongingResponse[] =
            belongingsRaw.map((raw) => ({
                id: raw.id,
                description: raw.description,
                isCheckedIn: raw.is_checked_in,
                studentId: raw.student_id,
                warehouseId: raw.warehouse_id,
                checkedInAt: raw.checked_in_at,
                checkedOutAt: raw.checked_out_at,
                luggage: raw.luggage_id ? { id: raw.luggage_id } : null,
                mattress: raw.mattress_id ? { id: raw.mattress_id } : null,
                warehouse: raw.warehouse_location
                    ? { location: raw.warehouse_location }
                    : null,
            }));

        return json(belongingsResponse);
    } catch (e: any) {
        // Re-throw the 404 error if it was thrown explicitly above
        if (e && typeof e === "object" && "status" in e && e.status === 404) {
            throw e;
        }

        // Handle raw query errors specifically
        if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2010"
        ) {
            const dbErrorMessage =
                (e.meta?.message as string) || "Raw query failed";
            const dbErrorCode = (e.meta?.code as string) || "UNKNOWN";
            console.error(
                `API Error @ /api/belonging GET: Raw query failed. DB Code: ${dbErrorCode}. DB Message: ${dbErrorMessage}`,
                e,
            );
            // Keep original error message style for generic DB errors in GET
            throw error(500, {
                message: `database error occurred while fetching belongings`,
            });
        }
        // Handle other potential Prisma errors during student lookup if needed
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(
                `API Error @ /api/belonging GET: Prisma Error ${e.code}. Meta: ${JSON.stringify(e.meta)}`,
                e,
            );
            throw error(500, {
                message: `database error occurred while fetching belongings`,
            });
        }

        // Generic catch-all
        console.error(
            `API Error @ /api/belonging GET: ${e instanceof Error ? e.message : String(e)}`,
            e,
        );
        throw error(500, { message: "internal server error" });
    }
    // Removed finally { await db.$disconnect(); }
};
