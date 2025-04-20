import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "../../session/create/$types";
import { db } from "$lib/server/database/database";
import { Prisma } from "@prisma/client";
import type { Prisma as PrismaType } from "@prisma/client";

interface CheckInRequestBody {
    belongingId: string;
    warehouseName: string;
    staffEmail: string;
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

    try {
        const updatedBelonging = await db.$transaction(
            async (tx: PrismaType.TransactionClient) => {
                const staffUser = await tx.user.findUnique({
                    where: { email: staffEmail.toLowerCase().trim() },
                    select: { staffUser: { select: { id: true } } },
                });

                if (!staffUser?.staffUser?.id) {
                    throw new Prisma.PrismaClientKnownRequestError(
                        "staff member with the email not found",
                        {
                            code: "P2025",
                            clientVersion: Prisma.prismaVersion.client,
                        },
                    );
                }

                const staffId = staffUser.staffUser.id;

                const warehouse = await tx.warehouse.findFirst({
                    where: { location: warehouseName.trim() },
                    select: { id: true },
                });

                if (!warehouse) {
                    throw new Prisma.PrismaClientKnownRequestError(
                        "warehouse with name not found",
                        {
                            code: "P2025",
                            clientVersion: Prisma.prismaVersion.client,
                        },
                    );
                }

                const warehouseId = warehouse.id;

                const belonging = await tx.belonging.findUnique({
                    where: { id: belongingId },
                    select: {
                        id: true,
                        studentId: true,
                        isCheckedIn: true,
                        warehouseId: true,
                    },
                });

                if (!belonging) {
                    throw new Prisma.PrismaClientKnownRequestError(
                        "belonging with the ID not found",
                        {
                            code: "P2025",
                            clientVersion: Prisma.prismaVersion.client,
                        },
                    );
                }

                const studentId = belonging.studentId;

                if (belonging.isCheckedIn) {
                    const alreadyCheckInError = new Error(
                        "belonging with ID is already checkied in",
                    );
                    alreadyCheckInError.name = "ConflictError";
                    throw alreadyCheckInError;
                }

                const openSession = await tx.session.findFirst({
                    where: {
                        staffId,
                        studentId,
                        closeTime: null,
                        terminated: false,
                    },
                    select: { id: true },
                });

                if (!openSession) {
                    const noSessionError = new Error(
                        "no active seession found between staff and student. check in requires an active session.",
                    );
                    noSessionError.name = "ForbiddenError";
                    throw noSessionError;
                }

                const checkedInBelonging = await tx.belonging.update({
                    where: { id: belongingId },
                    data: {
                        isCheckedIn: true,
                        warehouseId,
                    },
                    select: {
                        id: true,
                        description: true,
                        isCheckedIn: true,
                        studentId: true,
                        warehouseId: true,
                        checkedInAt: true,
                        checkedOutAt: true,
                    },
                });

                return checkedInBelonging;
            },
        );

        return json(updatedBelonging, { status: 200 });
    } catch (e: any) {
        if (e.name === "ConflictError") {
            throw error(409, { message: e.message });
        }
        if (e.name === "ForbiddenError") {
            throw error(403, { message: e.message });
        }
        if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2025"
        ) {
            throw error(404, { message: e.message });
        }

        console.error(
            `API Error @ /api/belongings/checkin POST: ${e instanceof Error ? e.message : String(e)}`,
            e,
        );

        throw error(500, { message: "interal server error" });
    }
};
