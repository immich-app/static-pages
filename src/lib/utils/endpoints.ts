const FUTO_BASE_URL = 'https://futopay-test.azurewebsites.net';

export const FUTO_ROUTES = {
  paymentPortal: new URL('/api/PaymentPortal/', FUTO_BASE_URL),
  getPaymentStatus: new URL('/api/v1/payment/status/', FUTO_BASE_URL),
  getActivationKey: new URL('/api/v1/activate/', FUTO_BASE_URL),
};
