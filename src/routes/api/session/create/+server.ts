// src/routes/api/session/create/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SessionCreateBody {
    staffId: string;
    studentId: string;
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { staffId, studentId }: SessionCreateBody = await request.json();

        const session = await prisma.session.create({
            data: {
                openTime: new Date(),
                closeTime: null,
                resolved: false,
                staffId,
                studentId
            }
        });

        return json({ session }, { status: 201 });

    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
