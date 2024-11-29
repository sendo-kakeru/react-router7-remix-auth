import { ActionFunctionArgs, redirect } from "react-router";
import { authSessionStorage } from "./features/auth/instances/auth.session-storage.server";

export async function action({ request }: ActionFunctionArgs) {
  let session = await authSessionStorage.getSession(request.headers.get("cookie"));
  return redirect("/", {
    headers: { "Set-Cookie": await authSessionStorage.destroySession(session) },
  });
}
