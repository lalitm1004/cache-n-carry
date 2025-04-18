// src/routes/api/hostel/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { id } = params;

        const hostel = await prisma.hostel.findUnique({
            where: { id },
            include: {
                rooms: {
                    include: {
                        currentResident: true,
                        nextResident: true
                    }
                }
            }
        });

        if (!hostel) {
            return json({ error: 'not found' }, { status: 404 });
        }

        return json(hostel);
    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
