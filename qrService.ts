export interface ParsedUPI {
  vpa: string;
  name: string;
  amount?: string;
  currency: string;
  note?: string;
  merchantCode?: string;
  transactionRef?: string;
  isMerchant: boolean;
  pspName: string;
  isValid: boolean;
  error?: string;
}

const PSP_MAP: Record<string, string> = {
  'okaxis': 'Google Pay',
  'okicici': 'Google Pay',
  'oksbi': 'Google Pay',
  'okhdfcbank': 'Google Pay',
  'paytm': 'Paytm',
  'ybl': 'PhonePe',
  'ibl': 'PhonePe',
  'axl': 'PhonePe',
  'waaxis': 'WhatsApp Pay',
  'wahdfc': 'WhatsApp Pay',
  'waicici': 'WhatsApp Pay',
  'wasbi': 'WhatsApp Pay',
  'upi': 'BHIM',
  'postbank': 'IPPB',
  'fbl': 'Federal Bank',
  'idfcbank': 'IDFC First',
  'icici': 'ICICI iMobile',
  'hdfcbank': 'HDFC Bank',
  'barodampay': 'Bank of Baroda',
  'axisbank': 'Axis Pay',
  'sbi': 'SBI Yono',
};

export const parseUPIUrl = (url: string): ParsedUPI => {
  const defaultState: ParsedUPI = {
    vpa: '',
    name: '',
    currency: 'INR',
    isMerchant: false,
    pspName: 'UPI',
    isValid: false
  };

  if (!url) return { ...defaultState, error: 'Empty QR code' };
  
  // Standardize URL
  if (!url.toLowerCase().startsWith('upi://pay')) {
    return { ...defaultState, error: 'This QR code is not a valid UPI QR.' };
  }

  try {
    const urlObj = new URL(url.replace('upi://pay', 'http://pay'));
    const params = new URLSearchParams(urlObj.search);
    
    const pa = params.get('pa') || '';
    const pn = params.get('pn') || '';
    const cu = params.get('cu') || 'INR';
    const mc = params.get('mc') || '';
    
    if (!pa || !pn) {
      return { ...defaultState, error: 'Invalid UPI QR code: Missing payee details.' };
    }

    if (cu.toUpperCase() !== 'INR') {
      return { ...defaultState, error: 'Only INR transactions are supported.' };
    }

    // Detect PSP
    let pspName = 'UPI';
    const domain = pa.split('@')[1]?.toLowerCase();
    if (domain) {
      for (const key in PSP_MAP) {
        if (domain.includes(key)) {
          pspName = PSP_MAP[key];
          break;
        }
      }
    }

    return {
      vpa: pa,
      name: decodeURIComponent(pn),
      amount: params.get('am') || undefined,
      currency: cu,
      note: params.get('tn') ? decodeURIComponent(params.get('tn')!) : '',
      merchantCode: mc,
      transactionRef: params.get('tr') || '',
      isMerchant: !!mc,
      pspName,
      isValid: true
    };
  } catch (e) {
    return { ...defaultState, error: 'Unable to read QR code. Please try again.' };
  }
};