/**
 * Global Banks Configuration
 * Email domains and parsing patterns for banks worldwide
 */

export interface Bank {
  id: string;
  name: string;
  shortName: string;
  country: string;
  logo?: string;
  emailDomains: string[];
  transactionPatterns: {
    amountRegex: RegExp;
    merchantRegex: RegExp;
    dateRegex: RegExp;
    cardRegex: RegExp;
  };
  sampleSubjects: string[];
}

export const GLOBAL_BANKS: Bank[] = [
  // United States
  {
    id: 'chase',
    name: 'Chase',
    shortName: 'Chase',
    country: 'US',
    emailDomains: ['chase.com', 'jpmchase.com'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\s+on|\s+for|\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /ending\s*in\s*(\d{4})/i,
    },
    sampleSubjects: [
      'Chase Alert: Transaction',
      'Your Chase card was used',
    ],
  },
  {
    id: 'bofa',
    name: 'Bank of America',
    shortName: 'BofA',
    country: 'US',
    emailDomains: ['bankofamerica.com', 'bofa.com', 'edd.ca.gov'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\s+on|\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})$/i,
    },
    sampleSubjects: [
      'Bank of America Alert',
      'BofA Transaction Notification',
    ],
  },
  {
    id: 'wellsfargo',
    name: 'Wells Fargo',
    shortName: 'WF',
    country: 'US',
    emailDomains: ['wellsfargo.com', 'wf.com'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\s+on|\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /ending\s*in\s*(\d{4})/i,
    },
    sampleSubjects: [
      'Wells Fargo Alert',
      'WF Card Transaction',
    ],
  },
  {
    id: 'citi',
    name: 'Citibank',
    shortName: 'Citi',
    country: 'US',
    emailDomains: ['citi.com', 'citibank.com', 'citigroup.com'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\s+on|\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /ending\s*in\s*(\d{4})/i,
    },
    sampleSubjects: [
      'Citi Transaction Alert',
      'Your Citi Card Transaction',
    ],
  },
  {
    id: 'usbank',
    name: 'U.S. Bank',
    shortName: 'USB',
    country: 'US',
    emailDomains: ['usbank.com'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'U.S. Bank Alert',
    ],
  },
  {
    id: 'capitalone',
    name: 'Capital One',
    shortName: 'CapOne',
    country: 'US',
    emailDomains: ['capitalone.com'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\s+on|\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /ending\s*in\s*(\d{4})/i,
    },
    sampleSubjects: [
      'Capital One Purchase',
      'Transaction Alert',
    ],
  },
  {
    id: 'amex',
    name: 'American Express',
    shortName: 'Amex',
    country: 'US',
    emailDomains: ['americanexpress.com', 'aexp.com'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\s+on|\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /\*(\d{5})/i,
    },
    sampleSubjects: [
      'American Express Card Alert',
      'Amex Transaction',
    ],
  },
  {
    id: 'discover',
    name: 'Discover',
    shortName: 'Discover',
    country: 'US',
    emailDomains: ['discover.com', 'discovercard.com'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'Discover Card Alert',
    ],
  },
  // United Kingdom
  {
    id: 'barclays',
    name: 'Barclays',
    shortName: 'Barclays',
    country: 'UK',
    emailDomains: ['barclays.com', 'barclays.co.uk', 'barclaycard.co.uk'],
    transactionPatterns: {
      amountRegex: /£\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\s+on|\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'Barclays Transaction Alert',
    ],
  },
  {
    id: 'hsbc',
    name: 'HSBC',
    shortName: 'HSBC',
    country: 'UK',
    emailDomains: ['hsbc.com', 'hsbc.co.uk', 'uk.hsbc.com'],
    transactionPatterns: {
      amountRegex: /[£$€]\s*([\d,]+\.?\d*)/i,
      merchantRegex: /Merchant:\s*(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /\*{3}(\d{4})/i,
    },
    sampleSubjects: [
      'HSBC Transaction Alert',
      'HSBC Card Activity',
    ],
  },
  {
    id: 'lloyds',
    name: 'Lloyds Bank',
    shortName: 'Lloyds',
    country: 'UK',
    emailDomains: ['lloydsbank.com', 'lloydsbank.co.uk'],
    transactionPatterns: {
      amountRegex: /£\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'Lloyds Transaction Alert',
    ],
  },
  {
    id: 'natwest',
    name: 'NatWest',
    shortName: 'NatWest',
    country: 'UK',
    emailDomains: ['natwest.com'],
    transactionPatterns: {
      amountRegex: /£\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'NatWest Alert',
    ],
  },
  {
    id: 'santander_uk',
    name: 'Santander UK',
    shortName: 'Santander',
    country: 'UK',
    emailDomains: ['santander.co.uk'],
    transactionPatterns: {
      amountRegex: /£\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'Santander Transaction Alert',
    ],
  },
  // Europe
  {
    id: 'deutsche',
    name: 'Deutsche Bank',
    shortName: 'Deutsche',
    country: 'DE',
    emailDomains: ['deutsche-bank.de', 'db.com'],
    transactionPatterns: {
      amountRegex: /€\s*([\d,]+\.?\d*)/i,
      merchantRegex: /bei\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\.\d{2}\.\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'Deutsche Bank Transaktion',
    ],
  },
  {
    id: 'ing',
    name: 'ING',
    shortName: 'ING',
    country: 'NL',
    emailDomains: ['ing.com', 'ing.nl', 'ing.de'],
    transactionPatterns: {
      amountRegex: /€\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}-\d{2}-\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'ING Transaction Alert',
    ],
  },
  {
    id: 'bnp',
    name: 'BNP Paribas',
    shortName: 'BNP',
    country: 'FR',
    emailDomains: ['bnpparibas.com', 'bnpparibas.fr'],
    transactionPatterns: {
      amountRegex: /€\s*([\d,]+\.?\d*)/i,
      merchantRegex: /chez\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'BNP Paribas Transaction',
    ],
  },
  // India
  {
    id: 'icici',
    name: 'ICICI Bank',
    shortName: 'ICICI',
    country: 'IN',
    emailDomains: ['icicibank.com'],
    transactionPatterns: {
      amountRegex: /(?:INR|Rs\.?)\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\s+on|\n|$)/i,
      dateRegex: /(\d{2}-\d{2}-\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'ICICI Bank Alert',
    ],
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    shortName: 'HDFC',
    country: 'IN',
    emailDomains: ['hdfcbank.com', 'hdfc.com'],
    transactionPatterns: {
      amountRegex: /(?:INR|Rs\.?)\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\s+on|\n|$)/i,
      dateRegex: /(\d{2}-\d{2}-\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'HDFC Bank Alert',
    ],
  },
  {
    id: 'sbi',
    name: 'State Bank of India',
    shortName: 'SBI',
    country: 'IN',
    emailDomains: ['sbi.co.in', 'onlinesbi.com'],
    transactionPatterns: {
      amountRegex: /(?:INR|Rs\.?)\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}-\d{2}-\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'SBI Transaction Alert',
    ],
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    shortName: 'Axis',
    country: 'IN',
    emailDomains: ['axisbank.com'],
    transactionPatterns: {
      amountRegex: /(?:INR|Rs\.?)\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}-\d{2}-\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'Axis Bank Alert',
    ],
  },
  // Australia
  {
    id: 'commbank',
    name: 'Commonwealth Bank',
    shortName: 'CBA',
    country: 'AU',
    emailDomains: ['commbank.com.au', 'cba.com.au'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'CommBank Alert',
    ],
  },
  {
    id: 'anz',
    name: 'ANZ',
    shortName: 'ANZ',
    country: 'AU',
    emailDomains: ['anz.com', 'anz.com.au'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'ANZ Alert',
    ],
  },
  {
    id: 'westpac',
    name: 'Westpac',
    shortName: 'Westpac',
    country: 'AU',
    emailDomains: ['westpac.com.au'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'Westpac Alert',
    ],
  },
  {
    id: 'nab',
    name: 'NAB',
    shortName: 'NAB',
    country: 'AU',
    emailDomains: ['nab.com.au'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'NAB Alert',
    ],
  },
  // Canada
  {
    id: 'rbc',
    name: 'RBC Royal Bank',
    shortName: 'RBC',
    country: 'CA',
    emailDomains: ['rbc.com', 'royalbank.com'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'RBC Alert',
    ],
  },
  {
    id: 'td',
    name: 'TD Bank',
    shortName: 'TD',
    country: 'CA',
    emailDomains: ['td.com', 'tdbank.com'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'TD Bank Alert',
    ],
  },
  {
    id: 'scotiabank',
    name: 'Scotiabank',
    shortName: 'Scotia',
    country: 'CA',
    emailDomains: ['scotiabank.com'],
    transactionPatterns: {
      amountRegex: /\$\s*([\d,]+\.?\d*)/i,
      merchantRegex: /at\s+(.+?)(?:\n|$)/i,
      dateRegex: /(\d{2}\/\d{2}\/\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'Scotiabank Alert',
    ],
  },
  // Generic patterns for other banks
  {
    id: 'generic',
    name: 'Other Bank',
    shortName: 'Bank',
    country: 'GLOBAL',
    emailDomains: ['bank', 'banking', 'financial'],
    transactionPatterns: {
      amountRegex: /[£$€¥₹]\s*([\d,]+\.?\d*)/i,
      merchantRegex: /(?:at|from|to)\s+(.+?)(?:\s+on|\s+for|\n|$)/i,
      dateRegex: /(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
      cardRegex: /(\d{4})/i,
    },
    sampleSubjects: [
      'Transaction Alert',
      'Card Transaction',
      'Purchase Alert',
    ],
  },
];

/**
 * Get bank by email domain
 */
export function getBankByEmailDomain(email: string): Bank | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  return GLOBAL_BANKS.find((bank) =>
    bank.emailDomains.some((d) => domain.includes(d))
  ) || null;
}

/**
 * Check if email is from a known bank
 */
export function isBankEmail(senderEmail: string): boolean {
  return getBankByEmailDomain(senderEmail) !== null;
}

/**
 * Parse transaction from bank email
 */
export function parseTransactionFromEmail(
  bank: Bank,
  emailBody: string
): {
  amount: number | null;
  merchant: string | null;
  date: string | null;
  cardLastFour: string | null;
} {
  const amountMatch = emailBody.match(bank.transactionPatterns.amountRegex);
  const merchantMatch = emailBody.match(bank.transactionPatterns.merchantRegex);
  const dateMatch = emailBody.match(bank.transactionPatterns.dateRegex);
  const cardMatch = emailBody.match(bank.transactionPatterns.cardRegex);

  return {
    amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null,
    merchant: merchantMatch ? merchantMatch[1].trim() : null,
    date: dateMatch ? dateMatch[1] : null,
    cardLastFour: cardMatch ? cardMatch[1] : null,
  };
}

/**
 * Get all bank names
 */
export function getAllBankNames(): string[] {
  return GLOBAL_BANKS.map((bank) => bank.name);
}

/**
 * Get bank by ID
 */
export function getBankById(id: string): Bank | undefined {
  return GLOBAL_BANKS.find((bank) => bank.id === id);
}

/**
 * Get banks by country
 */
export function getBanksByCountry(country: string): Bank[] {
  return GLOBAL_BANKS.filter((bank) => bank.country === country);
}

/**
 * Get bank options for dropdown/picker
 */
export function getBankOptions(): { label: string; value: string }[] {
  return GLOBAL_BANKS
    .filter((bank) => bank.id !== 'generic')
    .map((bank) => ({
      label: bank.name,
      value: bank.id,
    }));
}

/**
 * Get available countries
 */
export function getAvailableCountries(): string[] {
  const countries = new Set(GLOBAL_BANKS.map((bank) => bank.country));
  countries.delete('GLOBAL');
  return Array.from(countries);
}

export default GLOBAL_BANKS;
