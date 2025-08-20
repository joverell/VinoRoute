import { Winery } from '@/types';

export const formatAddress = (address: Winery['address']): string => {
  if (!address) {
    return 'Address not available';
  }

  if (typeof address === 'string') {
    return address;
  }

  const parts = [
    address.street_number,
    address.street,
    address.suburb,
    address.state,
    address.postcode,
    address.country,
  ];

  return parts.filter(Boolean).join(', ');
};
