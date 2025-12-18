
export interface ParsedUPI {
  vpa: string;
  name: string;
  amount?: string;
  note?: string;
  isValid: boolean;
}

export const parseUPIUrl = (url: string): ParsedUPI => {
  if (!url.startsWith('upi://pay')) {
    return { vpa: '', name: '', isValid: false };
  }

  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    return {
      vpa: params.get('pa') || '',
      name: params.get('pn') || 'Unknown Merchant',
      amount: params.get('am') || undefined,
      note: params.get('tn') || '',
      isValid: !!params.get('pa')
    };
  } catch (e) {
    return { vpa: '', name: '', isValid: false };
  }
};
