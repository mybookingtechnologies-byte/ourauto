import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminUserFromRequest } from "@/lib/adminAuth";

export async function requireAdminPage() {
  const cookieStore = await cookies();
  const request = new Request("http://localhost/internal-admin-check", {
    headers: {
      cookie: cookieStore.toString(),
    },
  });

  const adminUser = await getAdminUserFromRequest(request);

  if (!adminUser) {
    redirect("/login");
  }

  return adminUser;
}
