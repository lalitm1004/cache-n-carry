import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types"; // Assuming this file is in the correct directory structure for RequestHandler type inference
import { db } from "$lib/server/database/database";
import { Prisma } from "@prisma/client";

// --- Input Type ---
interface CheckInRequestBody {
    belongingId: string;
    warehouseName: string;
    staffEmail: string;
}

// --- Result Types for Raw Queries ---
// Use actual column names from your schema's @@map attributes
interface StaffIdResult {
    id: string; // staff.id maps to user.id
}
interface WarehouseIdResult {
    id: string;
}
interface BelongingInfoResult {
    id: string;
    student_id: string; // mapped from studentId
    is_checked_in: boolean; // mapped from isCheckedIn
    warehouse_id: string | null; // mapped from warehouseId
}
interface SessionIdResult {
    id: string;
}
// Type for the data selected after update
interface UpdatedBelongingResult {
    id: string;
    description: string | null;
    is_checked_in: boolean; // mapped from isCheckedIn
    student_id: string; // mapped from studentId
    warehouse_id: string | null; // mapped from warehouseId
    checked_in_at: Date | null; // mapped from checkedInAt
    checked_out_at: Date | null; // mapped from checkedOutAt
}

// Mapped type for the final JSON response (camelCase)
interface FinalResponseData {
    id: string;
    description: string | null;
    isCheckedIn: boolean;
    studentId: string;
    warehouseId: string | null;
    checkedInAt: Date | null;
    checkedOutAt: Date | null;
}

export const POST: RequestHandler = async ({ request }) => {
    let requestData: CheckInRequestBody;

    try {
        requestData = (await request.json()) as CheckInRequestBody;
    } catch (e) {
        throw error(400, { message: "invalid json body" });
    }

    const { belongingId, warehouseName, staffEmail } = requestData;

    if (!belongingId || !warehouseName || !staffEmail) {
        throw error(400, {
            message: "missing belongingId, warehouseName or staffEmail",
        });
    }

    // Prepare parameters outside transaction
    const trimmedStaffEmail = staffEmail.toLowerCase().trim();
    const trimmedWarehouseName = warehouseName.trim();

    try {
        // Use Prisma's interactive transaction
        const updatedBelonging = await db.$transaction(async (tx) => {
            // tx object has $queryRaw, $executeRaw etc.

            // 1. Find Staff ID (Use parameterized query - SAFE)
            const staffResult = await tx.$queryRaw<StaffIdResult[]>`
                SELECT s.id
                FROM user u
                JOIN staff s ON u.id = s.id
                WHERE LOWER(TRIM(u.email)) = ${trimmedStaffEmail}
                LIMIT 1`;

            if (staffResult.length === 0) {
                // Throwing inside transaction causes automatic rollback
                throw new Prisma.PrismaClientKnownRequestError(
                    "staff member with the email not found",
                    {
                        code: "P2025",
                        clientVersion: Prisma.prismaVersion.client,
                    },
                );
            }
            const staffId = staffResult[0].id;

            // 2. Find Warehouse ID (Use parameterized query - SAFE)
            const warehouseResult = await tx.$queryRaw<WarehouseIdResult[]>`
                SELECT id
                FROM warehouse
                WHERE location = ${trimmedWarehouseName}
                LIMIT 1`;

            if (warehouseResult.length === 0) {
                throw new Prisma.PrismaClientKnownRequestError(
                    "warehouse with name not found",
                    {
                        code: "P2025",
                        clientVersion: Prisma.prismaVersion.client,
                    },
                );
            }
            const warehouseId = warehouseResult[0].id;

            // 3. Find Belonging and Student ID (Use parameterized query - SAFE)
            const belongingResult = await tx.$queryRaw<BelongingInfoResult[]>`
                SELECT id, student_id, is_checked_in, warehouse_id
                FROM belonging
                WHERE id = ${belongingId}
                LIMIT 1`;

            if (belongingResult.length === 0) {
                throw new Prisma.PrismaClientKnownRequestError(
                    "belonging with the ID not found",
                    {
                        code: "P2025",
                        clientVersion: Prisma.prismaVersion.client,
                    },
                );
            }
            const belonging = belongingResult[0];
            const studentId = belonging.student_id;

            // 4. Check if already checked in
            if (belonging.is_checked_in) {
                const alreadyCheckInError = new Error(
                    "belonging with ID is already checked in",
                );
                alreadyCheckInError.name = "ConflictError"; // Custom name for specific handling
                throw alreadyCheckInError;
            }

            // 5. Find Open Session (Use parameterized query - SAFE) - CORRECTED QUERY
            const sessionResult = await tx.$queryRaw<SessionIdResult[]>`
                SELECT id
                FROM session
                WHERE staff_id = ${staffId}
                  AND student_id = ${studentId}
                  AND close_time IS NULL
                  AND \`terminated\` = false -- Use backticks around the column name
                LIMIT 1`;

            if (sessionResult.length === 0) {
                const noSessionError = new Error(
                    "no active seession found between staff and student. check in requires an active session.",
                );
                noSessionError.name = "ForbiddenError"; // Custom name
                throw noSessionError;
            }
            // const openSessionId = sessionResult[0].id; // We don't actually use the ID here

            // 6. Update Belonging (Use parameterized query - SAFE)
            // Note: If you want the DB to set the check-in time automatically,
            // ensure your DB schema has a default/trigger or add ', checked_in_at = NOW()' here.
            const updateResult = await tx.$executeRaw`
                UPDATE belonging
                SET is_checked_in = true,
                    warehouse_id = ${warehouseId}
                WHERE id = ${belongingId}`;

            // Optional check: Prisma's $executeRaw returns the number of affected rows
            if (updateResult === 0) {
                // This case should ideally not happen if the SELECT worked, but good practice
                console.error(
                    `Transaction Error @ /api/belongings/checkin POST: Failed to update belonging ${belongingId} within transaction after finding it.`,
                );
                // Throwing a generic error here will cause rollback
                throw new Error(
                    "Failed to update belonging record during transaction.",
                );
            }

            // 7. Select the updated belonging data to return (Use parameterized query - SAFE)
            // This fetches the state *after* the update within the same transaction
            const finalBelongingResult = await tx.$queryRaw<
                UpdatedBelongingResult[]
            >`
                SELECT
                    id,
                    description,
                    is_checked_in,
                    student_id,
                    warehouse_id,
                    checked_in_at,
                    checked_out_at
                FROM belonging
                WHERE id = ${belongingId}
                LIMIT 1`;

            if (finalBelongingResult.length === 0) {
                // Should be impossible if update succeeded, but handle defensively
                console.error(
                    `Transaction Error @ /api/belongings/checkin POST: Could not retrieve belonging ${belongingId} after update within transaction.`,
                );
                throw new Error(
                    "Failed to retrieve updated belonging data after update.",
                );
            }

            // Return the raw result (with DB column names) from the transaction callback
            return finalBelongingResult[0];
        }); // End of db.$transaction

        // Map DB column names from the transaction result back to JS object keys (camelCase)
        const responseData: FinalResponseData = {
            id: updatedBelonging.id,
            description: updatedBelonging.description,
            isCheckedIn: updatedBelonging.is_checked_in,
            studentId: updatedBelonging.student_id,
            warehouseId: updatedBelonging.warehouse_id,
            checkedInAt: updatedBelonging.checked_in_at,
            checkedOutAt: updatedBelonging.checked_out_at,
        };

        return json(responseData, { status: 200 });
    } catch (e: any) {
        // --- Handle errors thrown from the transaction block ---

        // Custom errors
        if (e.name === "ConflictError") {
            throw error(409, { message: e.message });
        }
        if (e.name === "ForbiddenError") {
            throw error(403, { message: e.message });
        }

        // Prisma 'Record Not Found' errors (thrown manually in the transaction)
        if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2025"
        ) {
            // Use the specific message we provided when throwing
            throw error(404, { message: e.message });
        }

        // Handle potential raw query syntax or other DB errors
        if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2010" // Code for raw query failure
        ) {
            const dbErrorMessage =
                (e.meta?.message as string) ||
                "Raw query failed within transaction";
            const dbErrorCode = (e.meta?.code as string) || "UNKNOWN";
            console.error(
                `API Error @ /api/belongings/checkin POST: Raw query failed within transaction. DB Code: ${dbErrorCode}. DB Message: ${dbErrorMessage}`,
                e, // Log the full error object
            );
            // Expose a slightly more informative error message
            throw error(500, {
                message: `Database query error (${dbErrorCode})`,
            });
        }

        // Generic error handling for anything else thrown from the transaction
        // or errors during initial request parsing.
        console.error(
            `API Error @ /api/belongings/checkin POST: ${e instanceof Error ? e.message : String(e)}`,
            e, // Log the original error
        );
        // Use lowercase 'i' as in original example if desired
        throw error(500, { message: "internal server error" });
    }
};
