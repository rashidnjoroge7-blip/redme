import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/account?next=/admin");
  }

  const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin_user");

  if (roleError || !isAdmin) {
    redirect("/");
  }

  return { user, admin: createAdminClient() };
}
