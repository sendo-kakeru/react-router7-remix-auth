import { ActionFunctionArgs } from "react-router";
import { remixAuthenticator } from "./features/auth/instances/authenticator.server";

export async function action({ request }: ActionFunctionArgs) {
  return remixAuthenticator.logout(request, { redirectTo: "/" });
}
