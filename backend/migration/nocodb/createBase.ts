export async function createBase(
  config: {
    baseUrl: string;
    token: string;
  },
  options: {
    title: string;
    description?: string;
  },
) {
  const baseURL = config.baseUrl;
  const token = config.token;

  if (!baseURL || !token) {
    throw new Error(
      'NOCODB_URL and NOCODB_TOKEN environment variables must be set or provided',
    );
  }

  const url = `${baseURL}/api/v2/meta/bases`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xc-token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: options.title,
      description: options.description,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`,
    );
  }

  const data = await response.json();
  // deno-lint-ignore no-explicit-any
  return data as { id: string; [key: string]: any };
}
