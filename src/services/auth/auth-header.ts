export default function authHeader(): Record<string, string> {
  const token = localStorage.getItem('accessToken')

  if (token) {
    return { Authorization: `Bearer ${token}` };
  } else {
    return {};
  }
}
