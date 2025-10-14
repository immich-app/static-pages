import { PUBLIC_IMMICH_PAY_HOST } from '$env/static/public';

export enum ImmichLicense {
  Server = 'immich-server',
  Individual = 'immich-client',
}

export enum PurchaseStatus {
  Pending = -1,
  Failed = 0,
  Succeeded = 1,
  Unknown = 2,
}

export type PaymentStatusResponseDto = {
  status: PurchaseStatus;
  purchaseId?: string; // License key
};

export const getPaymentStatus = async (orderId: string) => {
  const response = await fetch(new URL(`/api/v1/payment/status/${orderId}`, PUBLIC_IMMICH_PAY_HOST));
  return response.ok ? ((await response.json()) as PaymentStatusResponseDto) : undefined;
};

export const getCallbackUrl = (licenseType: ImmichLicense, instanceUrl?: string): string => {
  const successUrl = new URL('/success', window.origin);

  if (instanceUrl) {
    successUrl.searchParams.append('instanceUrl', instanceUrl);
  }

  const redirectUrl = new URL('/api/PaymentPortal/', PUBLIC_IMMICH_PAY_HOST);
  redirectUrl.searchParams.append('product', licenseType);
  redirectUrl.searchParams.append('success', successUrl.href);

  return redirectUrl.href;
};

export const getRedirectUrl = (licenseKey: string, instanceUrl: string) => {
  const redirectUrl = new URL('/link?target=activate_license', instanceUrl);
  redirectUrl.searchParams.append('licenseKey', licenseKey);

  return redirectUrl.href;
};
