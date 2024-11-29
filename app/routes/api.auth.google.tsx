import { LoaderFunctionArgs, redirect } from "react-router";
import { remixAuthenticator } from "./features/auth/instances/authenticator.server";
import { authSessionStorage } from "./features/auth/instances/auth.session-storage.server";

export async function action({ request }: LoaderFunctionArgs) {
  const user = await remixAuthenticator.authenticate("google", request);
  const session = await authSessionStorage.getSession(request.headers.get("cookie"));
  session.set("me", user);

  return redirect("/", {
    headers: { "Set-Cookie": await authSessionStorage.commitSession(session) },
  });
}
