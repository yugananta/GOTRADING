/**
 * Formats a currency string or number to use the 'K' suffix for thousands.
 * Example: "$12,420" -> "$12.4K", "1830" -> "1.8K"
 */
export const formatToK = (value: any): string => {
  if (value === undefined || value === null) return '0';
  if (typeof value === 'number') {
    if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return value.toString();
  }

  if (typeof value !== 'string') {
    value = String(value);
  }

  // Handle strings like "$12,420" or "+$248"
  const prefix = value.match(/^([+$]+)/)?.[0] || '';
  const numPart = value.replace(/[^0-9.-]/g, '');
  const num = parseFloat(numPart);

  if (isNaN(num)) return value;

  if (Math.abs(num) >= 1000) {
    const formattedNum = (Math.abs(num) / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    const sign = num < 0 ? '-' : (value.startsWith('+') ? '+' : '');
    const currency = value.includes('$') ? '$' : '';
    
    // Construct properly: -$1.2K, +$1.2K or $12.4K
    if (num < 0) return `-$${formattedNum}`;
    if (prefix.includes('+') && currency) return `+$${formattedNum}`;
    if (currency) return `$${formattedNum}`;
    if (sign) return `${sign}${formattedNum}`;
    return formattedNum;
  }

  return value;
};

export const getCountryFlag = (country?: string): string => {
  if (!country) return '🇮🇩';
  const c = country.toLowerCase().trim();
  if (c.includes('indonesia') || c === 'id') return '🇮🇩';
  if (c.includes('vietnam') || c === 'vi') return '🇻🇳';
  if (c.includes('thailand') || c === 'th') return '🇹🇭';
  if (c.includes('singapore') || c === 'sg') return '🇸🇬';
  if (c.includes('malaysia') || c === 'my') return '🇲🇾';
  if (c.includes('united kingdom') || c.includes('uk') || c.includes('england') || c === 'gb' || c === 'en') return '🇬🇧';
  if (c.includes('united states') || c.includes('usa') || c === 'us') return '🇺🇸';
  if (c.includes('japan') || c === 'jp') return '🇯🇵';
  return '🇮🇩';
};
