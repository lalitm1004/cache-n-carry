// src/routes/api/session/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { id } = params;

        const session = await prisma.session.findUnique({
            where: { id },
            include: {
                student: {
                    include: {
                        currentRoom: true,
                        nextRoom: true,
                        belongings: {
                            include: {
                                luggage: true
                            }
                        }
                    }
                },
                staff: true
            }
        });

        if (!session) {
            return json({ error: 'not found' }, { status: 404 });
        }

        return json(session);
    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
