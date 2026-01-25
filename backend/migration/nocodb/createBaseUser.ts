export async function createBaseUser(
  config: {
    baseUrl: string;
    token: string;
    baseId: string;
  },
  user: {
    email: string;
    roles:
      | 'no-access'
      | 'commenter'
      | 'editor'
      | 'guest'
      | 'owner'
      | 'viewer'
      | 'creator'
      | 'inherit';
  },
) {
  const baseURL = config.baseUrl;
  const token = config.token;
  const baseId = config.baseId;

  if (!baseURL || !token || !baseId) {
    throw new Error('baseUrl, token, and baseId must be provided');
  }

  const url = `${baseURL}/api/v2/meta/bases/${baseId}/users`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xc-token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      roles: user.roles,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`,
    );
  }

  return await response.json();
}
