export enum StorageKey {
  INSTANCE_URL = 'immich-instance-url',
}

export const mergeInstanceUrl = ({ pathname, searchParams }: URL, instanceUrl: string) => {
  const targetUrl = new URL(instanceUrl);

  targetUrl.pathname += targetUrl.pathname.endsWith('/') ? pathname.slice(1) : pathname;

  for (const [key, value] of searchParams.entries()) {
    targetUrl.searchParams.append(key, value);
  }

  return targetUrl;
};

export const shouldRedirect = (url: URL) => url.pathname !== '' && url.pathname !== '/';
