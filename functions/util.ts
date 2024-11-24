export type JsonFunction = <Data>(
  data: Data,
  init?: number | ResponseInit
) => Response;

// React Routerではapi専用routeのみ使用、他はそのままオブジェクトを返すがよさそう
// jsxを返すrouteではloaderの返り値の型補完を効かせたいため（以下の関数では返り値がResponseにしかならない）
export const json: JsonFunction = (data, init = {}) => {
  const responseInit = typeof init === "number" ? { status: init } : init;

  const headers = new Headers(responseInit.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  return new Response(JSON.stringify(data), {
    ...responseInit,
    headers,
  });
};