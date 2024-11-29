import { Form, LoaderFunctionArgs } from "react-router";
import { authSessionStorage } from "./features/auth/instances/auth.session-storage.server";

export async function loader({ request }: LoaderFunctionArgs) {
  let session = await authSessionStorage.getSession(request.headers.get("cookie"));
  let me = session.get("me");
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
