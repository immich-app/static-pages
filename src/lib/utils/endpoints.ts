// const FUTO_BASE_URL = 'https://futopay-test.azurewebsites.net';
const FUTO_BASE_URL = 'https://pay.futo.org';

export const FUTO_ROUTES = {
  paymentPortal: new URL('/api/PaymentPortal/', FUTO_BASE_URL),
  getPaymentStatus: new URL('/api/v1/payment/status/', FUTO_BASE_URL),
  getActivationKey: new URL('/api/v1/activate/', FUTO_BASE_URL),
};

export const getRedirectUrl = (productId: string, instanceUrl?: string): string => {
  const successUrl = new URL('/success', window.origin);

  if (instanceUrl) {
    successUrl.searchParams.append('instanceUrl', instanceUrl);
  }

  const redirectUrl = new URL(FUTO_ROUTES.paymentPortal);
  redirectUrl.searchParams.append('product', productId);
  redirectUrl.searchParams.append('success', successUrl.href);

  return redirectUrl.href;
};
