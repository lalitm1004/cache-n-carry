import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { PrismaClient, Prisma } from "@prisma/client";
// Import crypto for UUID generation
import crypto from "crypto";

// Assuming db instance is initialized elsewhere if this isn't the only file
// If not, keep this:
const db = new PrismaClient();

// --- Input Type ---
interface CheckOutRequestBody {
    belongingId: string;
    staffEmail: string;
}

// --- Result Types for Raw Queries ---
interface StaffIdResult {
    id: string;
}
interface BelongingMattressResult {
    id: string;
    student_id: string;
    is_checked_in: boolean;
    checked_out_at: Date | null;
    mattress_id: string | null; // Joined from mattress table
}
interface ActiveSessionResult {
    id: string;
    student_id: string;
}
interface ExistingIncidentResult {
    id: string;
}
// For selecting the state of the belonging *after* update
interface UpdatedBelongingResult {
    id: string;
    is_checked_in: boolean;
    checked_out_at: Date | null;
    student_id: string;
}

// --- Expected Final Response Structure ---
// Matches the original CheckOutResponse but uses the structure returned by the transaction
interface CheckOutTransactionResult {
    message: string;
    checkedOutBelonging: UpdatedBelongingResult; // Use the raw result type first
    closedSessionId: string;
    createdIncidentId?: string;
}

// Final structure for the JSON response (mapping camelCase)
interface CheckOutResponse {
    message: string;
    checkedOutBelonging: {
        id: string;
        isCheckedIn: boolean;
        checkedOutAt: Date | null;
        studentId: string;
    };
    closedSessionId: string;
    createdIncidentId?: string;
}

export const POST: RequestHandler = async ({ request }) => {
    let requestData: CheckOutRequestBody;

    try {
        requestData = (await request.json()) as CheckOutRequestBody;
    } catch {
        // Keep original error message style
        throw error(400, { message: "Invalid JSON payload provided." });
    }

    const { belongingId, staffEmail } = requestData;

    // Input validation (matches original)
    if (!belongingId || !staffEmail) {
        throw error(400, {
            message:
                "Missing required field: belongingId and staffEmail are required.",
        });
    }
    if (typeof belongingId !== "string" || typeof staffEmail !== "string") {
        throw error(400, {
            message:
                "Invalid field type: belongingId and staffEmail must be strings.",
        });
    }

    // Prepare parameters
    const trimmedStaffEmail = staffEmail.toLowerCase().trim();

    try {
        // Use Prisma's interactive transaction
        const result: CheckOutTransactionResult = await db.$transaction(
            async (tx) => {
                // 1. Find Staff ID
                const staffResult = await tx.$queryRaw<StaffIdResult[]>`
                SELECT s.id
                FROM user u
                JOIN staff s ON u.id = s.id
                WHERE LOWER(TRIM(u.email)) = ${trimmedStaffEmail}
                LIMIT 1`;

                if (staffResult.length === 0) {
                    const staffNotFoundError = new Error(
                        `Staff user with email '${staffEmail}' not found.`,
                    );
                    staffNotFoundError.name = "NotFoundError";
                    throw staffNotFoundError; // Causes rollback
                }
                const staffId = staffResult[0].id;

                // 2. Find Belonging, Student ID, and check if it's a Mattress
                const belongingResult = await tx.$queryRaw<
                    BelongingMattressResult[]
                >`
                SELECT
                    b.id,
                    b.student_id,
                    b.is_checked_in,
                    b.checked_out_at,
                    m.id as mattress_id
                FROM belonging b
                LEFT JOIN mattress m ON b.id = m.id
                WHERE b.id = ${belongingId}
                LIMIT 1`;

                if (belongingResult.length === 0) {
                    const belongingNotFoundError = new Error(
                        `Belonging with ID '${belongingId}' not found.`,
                    );
                    belongingNotFoundError.name = "NotFoundError";
                    throw belongingNotFoundError;
                }
                const belonging = belongingResult[0];
                const actualOwnerStudentId = belonging.student_id;
                const mattressId = belonging.mattress_id; // Will be null if not a mattress
                const isMattress = !!mattressId;

                // 3. Check if belonging is checked in
                if (!belonging.is_checked_in) {
                    const notCheckedInError = new Error(
                        `Belonging with ID '${belongingId}' is not currently checked in.`,
                    );
                    notCheckedInError.name = "ConflictError";
                    throw notCheckedInError;
                }

                // 4. Find active session for the staff member
                const sessionResult = await tx.$queryRaw<ActiveSessionResult[]>`
                SELECT id, student_id
                FROM session
                WHERE staff_id = ${staffId}
                  AND close_time IS NULL
                  AND \`terminated\` = false -- Use backticks
                LIMIT 1`;

                if (sessionResult.length === 0) {
                    const noStaffSessionError = new Error(
                        `Staff member '${staffEmail}' does not have an active, non-terminated session.`,
                    );
                    noStaffSessionError.name = "ForbiddenError";
                    throw noStaffSessionError;
                }
                const currentStaffSession = sessionResult[0];
                const sessionStudentId = currentStaffSession.student_id;
                const closedSessionId = currentStaffSession.id; // Store for return value

                // --- Incident Logic ---
                let createdIncidentId: string | undefined = undefined;

                if (
                    isMattress &&
                    mattressId && // Ensure mattressId is not null
                    sessionStudentId !== actualOwnerStudentId
                ) {
                    console.log(
                        `Incident Check: Mattress ID=${mattressId}, Session Student=${sessionStudentId}, Owner Student=${actualOwnerStudentId}. Condition met.`,
                    );

                    // Check for existing *unresolved* incident for this mattress
                    const existingIncident = await tx.$queryRaw<
                        ExistingIncidentResult[]
                    >`
                    SELECT id FROM incident
                    WHERE mattress_id = ${mattressId} AND resolved = false
                    LIMIT 1`;

                    if (existingIncident.length > 0) {
                        const existingIncidentError = new Error(
                            `An unresolved incident (ID: ${existingIncident[0].id}) already exists for mattress ID '${mattressId}'. Cannot create another.`,
                        );
                        existingIncidentError.name = "ConflictError";
                        throw existingIncidentError;
                    }

                    // Create new Incident
                    const newIncidentId = crypto.randomUUID(); // Generate UUID here
                    console.log(`Generated Incident ID: ${newIncidentId}`);

                    // Note: Schema defaults open_time, resolved
                    const incidentInsertResult = await tx.$executeRaw`
                    INSERT INTO incident (id, found_by, belongs_to, mattress_id)
                    VALUES (${newIncidentId}, ${sessionStudentId}, ${actualOwnerStudentId}, ${mattressId})`;

                    if (incidentInsertResult === 0) {
                        // Should not happen if constraints are met, but check defensively
                        console.error(
                            `Transaction Error @ /api/belongings/checkout POST: Failed to insert incident for mattress ${mattressId}.`,
                        );
                        throw new Error(
                            "Failed to create incident record during transaction.",
                        );
                    }

                    console.log(`Incident created with ID: ${newIncidentId}`);
                    createdIncidentId = newIncidentId;
                } else if (isMattress) {
                    console.log(
                        `Incident Check: Mattress ID=${mattressId}, Session Student=${sessionStudentId}, Owner Student=${actualOwnerStudentId}. Condition NOT met (students match).`,
                    );
                } else {
                    console.log(`Incident Check: Item is not a mattress.`);
                }
                // --- End Incident Logic ---

                // 5. Update Belonging: Set is_checked_in=false, checked_out_at=NOW(), warehouse_id=NULL
                console.log(
                    `Updating belonging ${belongingId} to checked out...`,
                );
                const updateBelongingResult = await tx.$executeRaw`
                UPDATE belonging
                SET is_checked_in = false,
                    checked_out_at = NOW(),
                    warehouse_id = NULL
                WHERE id = ${belongingId}`;

                if (updateBelongingResult === 0) {
                    console.error(
                        `Transaction Error @ /api/belongings/checkout POST: Failed to update belonging ${belongingId} within transaction.`,
                    );
                    throw new Error(
                        "Failed to update belonging record during transaction.",
                    );
                }
                console.log(`Belonging ${belongingId} updated.`);

                // 6. Select the *updated* state of the belonging to return
                const finalBelongingState = await tx.$queryRaw<
                    UpdatedBelongingResult[]
                >`
                 SELECT id, is_checked_in, checked_out_at, student_id
                 FROM belonging
                 WHERE id = ${belongingId}
                 LIMIT 1`;

                if (finalBelongingState.length === 0) {
                    console.error(
                        `Transaction Error @ /api/belongings/checkout POST: Could not retrieve belonging ${belongingId} after update.`,
                    );
                    throw new Error(
                        "Failed to retrieve updated belonging data.",
                    );
                }
                const checkedOutBelongingData = finalBelongingState[0];

                // 7. Update Session: Set close_time=NOW(), add remark
                console.log(`Closing session ${closedSessionId}...`);
                const remark = `Checked out belonging ${belongingId}.`;
                const updateSessionResult = await tx.$executeRaw`
                UPDATE session
                SET close_time = NOW(),
                    remark = ${remark}
                WHERE id = ${closedSessionId}`;

                // Check not strictly necessary as session was confirmed earlier, but good practice
                if (updateSessionResult === 0) {
                    console.error(
                        `Transaction Error @ /api/belongings/checkout POST: Failed to close session ${closedSessionId} within transaction.`,
                    );
                    throw new Error(
                        "Failed to close session record during transaction.",
                    );
                }
                console.log(`Session ${closedSessionId} closed.`);

                // 8. Return the result object from the transaction
                return {
                    message: createdIncidentId
                        ? `Belonging checked out. Incident ${createdIncidentId} created.`
                        : "Belonging checked out successfully.",
                    checkedOutBelonging: checkedOutBelongingData, // Use data selected after update
                    closedSessionId: closedSessionId,
                    createdIncidentId,
                };
            },
        ); // End db.$transaction

        // Map the transaction result (using DB names) to the final response structure (camelCase)
        const responseData: CheckOutResponse = {
            message: result.message,
            checkedOutBelonging: {
                id: result.checkedOutBelonging.id,
                isCheckedIn: result.checkedOutBelonging.is_checked_in,
                checkedOutAt: result.checkedOutBelonging.checked_out_at,
                studentId: result.checkedOutBelonging.student_id,
            },
            closedSessionId: result.closedSessionId,
            createdIncidentId: result.createdIncidentId,
        };

        return json(responseData, { status: 200 });
    } catch (e: any) {
        // --- Handle errors thrown from the transaction or initial validation ---

        // Custom errors thrown inside transaction
        if (e.name === "NotFoundError") {
            throw error(404, { message: e.message });
        }
        if (e.name === "ConflictError") {
            throw error(409, { message: e.message });
        }
        if (e.name === "ForbiddenError") {
            throw error(403, { message: e.message });
        }

        // Handle potential raw query syntax or other DB errors from within transaction
        if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2010" // Raw query failed
        ) {
            const dbErrorMessage =
                (e.meta?.message as string) ||
                "Raw query failed within transaction";
            const dbErrorCode = (e.meta?.code as string) || "UNKNOWN";
            console.error(
                `[CheckoutError] Raw query failed within transaction. DB Code: ${dbErrorCode}. DB Message: ${dbErrorMessage}`,
                e,
            );
            throw error(500, {
                message: `Database query error (${dbErrorCode})`,
            });
        }

        // Handle potential unique constraint violations (e.g., incident insert)
        if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2002" // Unique constraint failed
        ) {
            const target = e.meta?.target as string[] | string | undefined;
            const targetDesc = Array.isArray(target)
                ? target.join(", ")
                : typeof target === "string"
                  ? target
                  : "unique field";
            console.error(
                `[CheckoutError] Unique constraint violation on ${targetDesc}.`,
                e,
            );
            throw error(409, {
                message: `Conflict: A record affecting '${targetDesc}' failed a uniqueness constraint.`,
            });
        }

        // Catch-all for other Prisma errors or unexpected errors from transaction
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            // Use the original P2025 message style if it somehow occurs
            if (e.code === "P2025") {
                console.error(
                    `[CheckoutError] Prisma P2025 Error: ${e.message}`,
                    e.meta,
                );
                throw error(404, {
                    message: `Related record not found: ${e.meta?.cause || e.message}`,
                });
            }
            // Log other Prisma codes we didn't explicitly handle
            console.error(
                `[CheckoutError] Unhandled Prisma Error Code: ${e.code}`,
                e,
            );
        }

        // Generic error handling
        console.error(`[CheckoutError]`, e); // Keep original logging format
        throw error(500, {
            message: "An unexpected error occurred during checkout.", // Keep original message
        });
    }
};
