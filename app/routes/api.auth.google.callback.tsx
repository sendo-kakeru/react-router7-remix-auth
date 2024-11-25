import { LoaderFunctionArgs } from "react-router";
import { remixAuthenticator } from "./features/auth/instances/authenticator.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return await remixAuthenticator.authenticate("google", request, {
    successRedirect: "/",
  });
}
