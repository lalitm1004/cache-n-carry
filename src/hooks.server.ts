import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

import authGuard from "$lib/server/middleware/authGuard";

export const handle: Handle = sequence(authGuard);
