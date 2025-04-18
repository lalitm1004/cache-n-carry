// src/routes/api/luggage/update/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LuggageUpdateBody {
    id: string;
    isCheckedIn: boolean;
    warehouseId: string;
}

export const PUT: RequestHandler = async ({ request }) => {
    try {
        const { id, isCheckedIn, warehouseId }: LuggageUpdateBody = await request.json();

        const luggageExists = await prisma.belonging.findUnique({
            where: { id },
        });

        if (!luggageExists) {
            return json({ error: 'not found' }, { status: 404 });
        }

        const updatedLuggage = await prisma.belonging.update({
            where: { id },
            data: {
                isCheckedIn,
                warehouseId
            }
        });

        return json({
            belonging: updatedLuggage
        }, { status: 200 });

    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
