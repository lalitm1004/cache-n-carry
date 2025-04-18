// src/routes/api/mattress/update/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MattressUpdateBody {
    id: string;
    isCheckedIn: boolean;
    warehouseId: string;
}

export const PUT: RequestHandler = async ({ request }) => {
    try {
        const { id, isCheckedIn, warehouseId }: MattressUpdateBody = await request.json();

        const mattressExists = await prisma.belonging.findUnique({
            where: { id },
        });

        if (!mattressExists) {
            return json({ error: 'not found' }, { status: 404 });
        }

        const updatedMattress = await prisma.belonging.update({
            where: { id },
            data: {
                isCheckedIn,
                warehouseId
            }
        });

        return json({
            belonging: updatedMattress
        }, { status: 200 });

    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
