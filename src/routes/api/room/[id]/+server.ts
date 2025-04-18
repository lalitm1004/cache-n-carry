// src/routes/api/room/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { id } = params;

        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                currentResident: true,
                nextResident: true,
                hostel: true
            }
        });

        if (!room) {
            return json({ error: 'not found' }, { status: 404 });
        }

        return json(room);
    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
