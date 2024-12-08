import { LoaderFunctionArgs, redirect } from "react-router";
import { authSessionStorage } from "~/features/auth/instances/auth.session-storage.server";
import { remixAuthenticator } from "~/features/auth/instances/authenticator.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await remixAuthenticator.authenticate("email-link", request);
    const session = await authSessionStorage.getSession(request.headers.get("cookie"));
    session.unset("auth:magiclink");
    session.unset("auth:email");
    session.set("me", user);
    return redirect("/", {
      headers: { "Set-Cookie": await authSessionStorage.commitSession(session) },
    });
  } catch (error) {
    console.error("ログインに失敗しました。", "app/routes/api.auth.email-link.callback.tsx", error);
    throw redirect("/login");
  }
}
