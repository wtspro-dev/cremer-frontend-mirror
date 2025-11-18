/**
 * Format a date string to Brazilian format (dd/mm/yyyy)
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

/**
 * Format a Unix timestamp to Brazilian date-time format
 */
export const formatDateTime = (timestamp: number): string => {
  try {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString("pt-BR");
  } catch {
    return String(timestamp);
  }
};

/**
 * Format a currency value from cents to Brazilian Real (BRL)
 */
export const formatCurrency = (valueInCents: number): string => {
  const valueInReais = valueInCents / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInReais);
};

/**
 * Format weight in kg to Brazilian format (comma as decimal separator)
 */
export const formatWeight = (weightKg: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(weightKg);
};

/**
 * Format CNPJ in format dd.ddd.ddd/dddd-dd
 * @param cnpj - CNPJ string (can be with or without formatting)
 * @returns Formatted CNPJ string
 */
export const formatCNPJ = (cnpj: string): string => {
  // Remove all non-digit characters
  const digits = cnpj.replace(/\D/g, "");

  // Check if we have exactly 14 digits
  if (digits.length !== 14) {
    return cnpj; // Return original if invalid
  }

  // Format: dd.ddd.ddd/dddd-dd
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

/**
 * Format a percentage value to Brazilian format (%)
 */
export const formatPercentage = (percentage: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(percentage / 100);
};
