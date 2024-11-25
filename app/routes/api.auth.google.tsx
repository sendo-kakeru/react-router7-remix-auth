import { LoaderFunctionArgs } from "react-router";
import { remixAuthenticator } from "./features/auth/instances/authenticator.server";

export async function action({ request }: LoaderFunctionArgs) {
  return remixAuthenticator.authenticate("google", request, {
    successRedirect: "/",
  });
}
