import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { PrismaClient, Prisma } from "@prisma/client";
import type { Prisma as PrismaType } from "@prisma/client";

const db = new PrismaClient();

interface CheckOutRequestBody {
    belongingId: string;
    staffEmail: string;
}

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
        throw error(400, { message: "Invalid JSON payload provided." });
    }

    const { belongingId, staffEmail } = requestData;

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

    try {
        const result = await db.$transaction(
            async (tx: PrismaType.TransactionClient) => {
                const staffUser = await tx.user.findUnique({
                    where: { email: staffEmail.toLowerCase().trim() },
                    select: { staffUser: { select: { id: true } } },
                });

                if (!staffUser?.staffUser?.id) {
                    const staffNotFoundError = new Error(
                        `Staff user with email '${staffEmail}' not found.`,
                    );
                    staffNotFoundError.name = "NotFoundError";
                    throw staffNotFoundError;
                }
                const staffId = staffUser.staffUser.id;

                const belonging = await tx.belonging.findUnique({
                    where: { id: belongingId },
                    select: {
                        id: true,
                        studentId: true,
                        isCheckedIn: true,
                        checkedOutAt: true,
                        mattress: { select: { id: true } },
                    },
                });

                if (!belonging) {
                    const belongingNotFoundError = new Error(
                        `Belonging with ID '${belongingId}' not found.`,
                    );
                    belongingNotFoundError.name = "NotFoundError";
                    throw belongingNotFoundError;
                }

                if (!belonging.isCheckedIn) {
                    const notCheckedInError = new Error(
                        `Belonging with ID '${belongingId}' is not currently checked in.`,
                    );
                    notCheckedInError.name = "ConflictError";
                    throw notCheckedInError;
                }

                const currentStaffSession = await tx.session.findFirst({
                    where: {
                        staffId,
                        closeTime: null,
                        terminated: false,
                    },
                    select: { id: true, studentId: true },
                });

                if (!currentStaffSession) {
                    const noStaffSessionError = new Error(
                        `Staff member '${staffEmail}' does not have an active, non-terminated session.`,
                    );
                    noStaffSessionError.name = "ForbiddenError";
                    throw noStaffSessionError;
                }

                const actualOwnerStudentId = belonging.studentId;
                const sessionStudentId = currentStaffSession.studentId;
                const isMattress = !!belonging.mattress;
                const mattressId = belonging.mattress?.id;
                let createdIncidentId: string | undefined = undefined;

                if (
                    isMattress &&
                    mattressId &&
                    sessionStudentId !== actualOwnerStudentId
                ) {
                    console.log(
                        `Incident Check: Mattress ID=${mattressId}, Session Student=${sessionStudentId}, Owner Student=${actualOwnerStudentId}. Condition met.`,
                    );

                    const existingUnresolvedIncident =
                        await tx.incident.findFirst({
                            where: {
                                mattressId,
                                resolved: false,
                            },
                            select: { id: true },
                        });

                    if (existingUnresolvedIncident) {
                        const existingIncidentError = new Error(
                            `An unresolved incident (ID: ${existingUnresolvedIncident.id}) already exists for mattress ID '${mattressId}'. Cannot create another.`,
                        );
                        existingIncidentError.name = "ConflictError";
                        throw existingIncidentError;
                    }

                    const newIncident = await tx.incident.create({
                        data: {
                            foundBy: sessionStudentId,
                            belongsTo: actualOwnerStudentId,
                            mattressId,
                        },
                        select: { id: true },
                    });

                    console.log(`Incident created with ID: ${newIncident.id}`);
                    createdIncidentId = newIncident.id;
                } else if (isMattress) {
                    console.log(
                        `Incident Check: Mattress ID=${mattressId}, Session Student=${sessionStudentId}, Owner Student=${actualOwnerStudentId}. Condition NOT met (students match).`,
                    );
                } else {
                    console.log(`Incident Check: Item is not a mattress.`);
                }

                console.log(
                    `Updating belonging ${belongingId} to checked out...`,
                );
                const updatedBelonging = await tx.belonging.update({
                    where: { id: belongingId },
                    data: {
                        isCheckedIn: false,
                        checkedOutAt: new Date(),
                        warehouseId: null,
                    },
                    select: {
                        id: true,
                        isCheckedIn: true,
                        checkedOutAt: true,
                        studentId: true,
                    },
                });
                console.log(`Belonging ${belongingId} updated.`);

                console.log(`Closing session ${currentStaffSession.id}...`);
                await tx.session.update({
                    where: { id: currentStaffSession.id },
                    data: {
                        closeTime: new Date(),
                        remark: `Checked out belonging ${belongingId}.`,
                    },
                    select: { id: true },
                });
                console.log(`Session ${currentStaffSession.id} closed.`);

                return {
                    message: createdIncidentId
                        ? `Belonging checked out. Incident ${createdIncidentId} created.`
                        : "Belonging checked out successfully.",
                    checkedOutBelonging: updatedBelonging,
                    closedSessionId: currentStaffSession.id,
                    createdIncidentId,
                };
            },
        );

        return json(result as CheckOutResponse, { status: 200 });
    } catch (e: any) {
        if (e.name === "NotFoundError") {
            throw error(404, { message: e.message });
        }
        if (e.name === "ConflictError") {
            throw error(409, { message: e.message });
        }
        if (e.name === "ForbiddenError") {
            throw error(403, { message: e.message });
        }
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2025") {
                throw error(404, {
                    message: `Related record not found: ${e.meta?.cause || "Underlying cause unavailable."}`,
                });
            }
            if (e.code === "P2002") {
                const target = e.meta?.target as string[] | string | undefined;
                const targetDesc = Array.isArray(target)
                    ? target.join(", ")
                    : typeof target === "string"
                      ? target
                      : "unique field";
                throw error(409, {
                    message: `Conflict: A record with this value for '${targetDesc}' already exists.`,
                });
            }
        }
        console.error(`[CheckoutError]`, e);
        throw error(500, {
            message: "An unexpected error occurred during checkout.",
        });
    }
};
