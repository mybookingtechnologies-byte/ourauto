import prisma from "@/lib/prisma";
import { fail } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";

export async function getAdminUserFromRequest(request: Request) {
  const sessionUser = await getUserFromRequest(request);
  if (!sessionUser) {
    return null;
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      dealerName: true,
      role: true,
    },
  });

  if (!adminUser || adminUser.role !== "ADMIN") {
    return null;
  }

  return adminUser;
}

export async function requireAdminApi(request: Request) {
  const adminUser = await getAdminUserFromRequest(request);
  if (!adminUser) {
    return { user: null, response: fail("Forbidden", 403) };
  }

  return { user: adminUser, response: null };
}
