/** Landing/drawer menu stubs: title click never renders a body, only a redirect. */
export function isRedirectStub(data: {
  redirectTo?: string;
  redirectToBlog?: string;
}): boolean {
  return Boolean(data.redirectTo || data.redirectToBlog);
}
