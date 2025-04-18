// src/routes/api/mattress/create/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MattressCreateBody {
    isCheckedIn: boolean;
    studentId: string;
    warehouseId: string;
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { isCheckedIn, studentId, warehouseId }: MattressCreateBody = await request.json();

        const belonging = await prisma.belonging.create({
            data: {
                isCheckedIn,
                studentId,
                warehouseId
            }
        });

        const mattress = await prisma.mattress.create({
            data: {
                id: belonging.id,
            }
        });

        return json({
            mattress,
            belonging
        }, { status: 201 });

    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
