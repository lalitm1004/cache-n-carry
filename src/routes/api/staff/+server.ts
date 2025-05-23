import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { PrismaClient, Prisma } from "@prisma/client";
import type { Prisma as PrismaType } from "@prisma/client";
import bcrypt from "bcrypt";

export interface IUser {
	id: string;
	name: string;
	email: string;
	password?: string;
}

export interface IStaff extends Omit<IUser, "password"> {
	type: "staff";
}

type StaffRegistrationRequestBody = Pick<IUser, "name" | "email" | "password">;

const prisma = new PrismaClient();
const SALT_ROUNDS: number = 10;

export const POST: RequestHandler = async ({ request }) => {
	let requestData: StaffRegistrationRequestBody;
	
	try {
		requestData = (await request.json()) as StaffRegistrationRequestBody;
	} catch (e) {
		throw error(400, { message: "invalid json body" });
	}
	
	const { name, email, password } = requestData;
	
	try {
		const hashedPassword = await bcrypt.hash(password as string, SALT_ROUNDS);
		
		const result: IStaff = await prisma.$transaction(
			async (tx: PrismaType.TransactionClient) => {
				const newUser = await tx.user.create({
					data: {
						name: name.trim(),
						email: email.toLowerCase().trim(),
						password: hashedPassword,
					},
					select: {
						id: true,
						name: true,
						email: true,
					},
				});
				
				await tx.staff.create({
					data: {
						user: {
							connect: {
								id: newUser.id,
							},
						},
					},
				});
				
				const responseData: IStaff = {
					id: newUser.id,
					name: newUser.name,
					email: newUser.email,
					type: "staff",
				};
				
				return responseData;
			},
		);
		
		return json(result, { status: 201 });
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			if (e.code === "P2002") {
				let targetDescription = "a unique field";
				const targetValue = e.meta?.target;
				
				if (targetValue) {
					if (Array.isArray(targetValue)) {
						targetDescription = targetValue.join(", ");
					} else if (typeof targetValue === "string") {
						targetDescription = targetValue;
					}
				}
				
				let message = `Conflict: A record with this value for '${targetDescription}' already exists.`;
				if (targetDescription.includes("email")) {
					message = "an account with this email id already exists";
				}
				throw error(409, { message });
			}
		}
		
		console.error(
			`api error @ api/staff POST: ${e instanceof Error ? e.message : String(e)}`,
			e,
		);
		throw error(500, {
			message: "internal server error during staff registration",
		});
	} finally {
		await prisma.$disconnect();
	}
};

export const GET: RequestHandler = async ({ url }) => {
    const email = url.searchParams.get("email");
    const password = url.searchParams.get("password");

    if (!email || !password) {
        throw error(400, { message: "Missing required query parameters: email and password" });
    }

    try {
        // Find the staff user by email
        const staff = await prisma.staff.findFirst({
            where: {
                user: {
                    email: email.toLowerCase().trim(),
                },
            },
            select: {
                id: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        password: true, // Needed for password validation
                    },
                },
            },
        });

        if (!staff || !staff.user) {
            return json({ success: false, message: "Invalid email or password" });
        }

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, staff.user.password);

        if (!isPasswordValid) {
            return json({ success: false, message: "Invalid email or password" });
        }

        // Remove the password field before sending the response
        const { password: _, ...userWithoutPassword } = staff.user;

        return json({
            success: true,
            staff: {
                id: staff.id,
				name: userWithoutPassword.name,
                email: userWithoutPassword.email,
            },
        });
    } catch (e) {
        console.error(`Error during staff login validation: ${e instanceof Error ? e.message : String(e)}`);
        throw error(500, { message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};
