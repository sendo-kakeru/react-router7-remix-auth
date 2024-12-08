import { LoaderFunctionArgs, redirect } from "react-router";
import * as v from "valibot";
import { authSessionStorage } from "~/features/auth/instances/auth.session-storage.server";
import { sendToken } from "~/features/auth/instances/email-link-strategy.server";

export async function action({ request }: LoaderFunctionArgs) {
  try {
    return sendToken.send(request, authSessionStorage, {
      successRedirect: "/login",
    });
  } catch (error) {
    if (error instanceof v.ValiError) {
      console.error(
        "メールアドレスの形式が正しくありません",
        "apps/app/routes/api.auth.email-link.tsx",
        error,
      );
      throw redirect("/login");
    }
    throw error;
  }
}
