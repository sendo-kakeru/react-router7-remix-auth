import { Form, LoaderFunctionArgs } from "react-router";
import { remixAuthenticator } from "./features/auth/instances/authenticator.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const me = await remixAuthenticator.isAuthenticated(request);
  return { me };
}

export default function Page({ loaderData }: { loaderData: Awaited<ReturnType<typeof loader>> }) {
  return (
    <div>
      <p>Home</p>
      {loaderData.me ? (
        <>
          <p>Hello {loaderData.me.email}</p>
          <Form action="/api/auth/logout" method="POST">
            <button type="submit">logout</button>
          </Form>
        </>
      ) : (
        <p>
          <a href="/login">Login</a>
        </p>
      )}
    </div>
  );
}
