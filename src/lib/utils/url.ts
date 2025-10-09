export const mergeInstanceUrl = ({ pathname, searchParams }: URL, instanceUrl: string) => {
  const targetUrl = new URL(instanceUrl);

  if (targetUrl.pathname.endsWith('/')) {
    targetUrl.pathname += pathname.slice(1);
  } else {
    targetUrl.pathname += pathname;
  }

  searchParams.forEach((v, k) => targetUrl.searchParams.append(k, v));

  return targetUrl;
};

export const shouldRedirect = (url: URL) => url.pathname !== '' && url.pathname !== '/';
