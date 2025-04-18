// src/routes/api/student/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { id } = params;

        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                user: true,
                currentRoom: true,
                nextRoom: true,
                belongings: true,
                session: true,
                foundIncident: true,
                lostIncident: true
            }
        });

        if (!student) {
            return json({ error: 'not found' }, { status: 404 });
        }

        return json(student);
    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
