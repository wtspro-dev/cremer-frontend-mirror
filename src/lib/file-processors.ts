// Processadores de arquivos client-side
import type { SKUCommission, DeliveryDate } from "@/types/commission";

/**
 * Interface para item de pedido parseado (equivalente ao DataFrame do Python)
 */
export interface ParsedOrderItem {
  n_order: string;
  dt_order: Date;
  customer: string;
  cnpj: string;
  address: string;
  n_item: string;
  code: string; // SKU no formato "123-456"
  description: string;
  package: string;
  dt_in: Date;
  qty: number;
  unit_value: number;
  ipi: number;
  icmsubs: number;
  bcsubs: number;
  disc_com: number;
  disc_adi: number;
  other: number;
  weight: number;
}

/**
 * Processa arquivo Excel de configuração de comissão SKU
 * NOTA: Atualmente carrega do arquivo JSON mock em vez de processar Excel
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function processSKUConfigFile(_file: File): Promise<SKUCommission[]> {
  // Ignora o arquivo e carrega o JSON mock
  try {
    const response = await fetch("/sku-config.json");
    if (!response.ok) {
      throw new Error(`Erro ao carregar dados: ${response.statusText}`);
    }

    const jsonData = (await response.json()) as SKUCommission[];
    return jsonData;
  } catch (error) {
    throw new Error(
      `Erro ao carregar dados de configuração SKU: ${error instanceof Error ? error.message : "Erro desconhecido"}`
    );
  }

  /* CÓDIGO EXCEL COMENTADO - MANTIDO PARA REFERÊNCIA FUTURA
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[];

        const skuCommissions: SKUCommission[] = jsonData
          .map((row) => {
            // Tenta encontrar colunas com diferentes possíveis nomes
            const sku = (row["SKU"] ||
              row["sku"] ||
              row["Código"] ||
              row["código"] ||
              row["Código SKU"] ||
              Object.values(row)[0]) as string;
            const commission =
              row["Comissão"] ||
              row["comissão"] ||
              row["Comissão %"] ||
              row["%"] ||
              Object.values(row)[1];

            // Converte porcentagem para decimal
            let commissionPercentage = 0;
            if (typeof commission === "number") {
              commissionPercentage = commission;
            } else if (typeof commission === "string") {
              // Remove % e converte
              const cleaned = commission.replace("%", "").replace(",", ".").trim();
              commissionPercentage = parseFloat(cleaned);
            }

            return {
              sku: String(sku).trim(),
              commissionPercentage: isNaN(commissionPercentage) ? 0 : commissionPercentage,
            };
          })
          .filter((item: SKUCommission) => item.sku && !isNaN(item.commissionPercentage));

        resolve(skuCommissions);
      } catch (error) {
        reject(
          new Error(
            `Erro ao processar arquivo Excel: ${error instanceof Error ? error.message : "Erro desconhecido"}`
          )
        );
      }
    };

    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsArrayBuffer(file);
  });
  */
}

/**
 * Processa arquivo Excel de datas de entrega
 * NOTA: Atualmente carrega do arquivo JSON mock em vez de processar Excel
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function processDeliveryDatesFile(_file: File): Promise<DeliveryDate[]> {
  // Ignora o arquivo e carrega o JSON mock
  try {
    const response = await fetch("/delivery-dates.json");
    if (!response.ok) {
      throw new Error(`Erro ao carregar dados: ${response.statusText}`);
    }

    const jsonData = (await response.json()) as Array<{
      orderId: string;
      sku: string;
      expectedDeliveryDate: string;
    }>;

    // Transforma o JSON para o formato DeliveryDate com Date objects
    const deliveryDates: DeliveryDate[] = jsonData.map((item) => ({
      orderId: item.orderId,
      sku: item.sku,
      expectedDeliveryDate: new Date(item.expectedDeliveryDate),
    }));

    return deliveryDates;
  } catch (error) {
    throw new Error(
      `Erro ao carregar dados de datas de entrega: ${error instanceof Error ? error.message : "Erro desconhecido"}`
    );
  }

  /* CÓDIGO EXCEL COMENTADO - MANTIDO PARA REFERÊNCIA FUTURA
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[];

        const deliveryDates: DeliveryDate[] = jsonData
          .map((row) => {
            const orderId = (row["Pedido"] ||
              row["pedido"] ||
              row["Order ID"] ||
              row["ID Pedido"] ||
              Object.values(row)[0]) as string;
            const sku = (row["SKU"] ||
              row["sku"] ||
              row["Código"] ||
              row["código"] ||
              Object.values(row)[1]) as string;
            const dateStr = (row["Data Entrega"] ||
              row["Data"] ||
              row["Delivery Date"] ||
              row["Entrega"] ||
              Object.values(row)[2]) as string | Date;

            let deliveryDate: Date;
            if (dateStr instanceof Date) {
              deliveryDate = dateStr;
            } else if (typeof dateStr === "string") {
              deliveryDate = parseDate(dateStr);
            } else {
              deliveryDate = new Date();
            }

            return {
              orderId: String(orderId).trim(),
              sku: String(sku).trim(),
              expectedDeliveryDate: deliveryDate,
            };
          })
          .filter(
            (item: DeliveryDate) =>
              item.orderId && item.sku && !isNaN(item.expectedDeliveryDate.getTime())
          );

        resolve(deliveryDates);
      } catch (error) {
        reject(
          new Error(
            `Erro ao processar arquivo Excel: ${error instanceof Error ? error.message : "Erro desconhecido"}`
          )
        );
      }
    };

    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsArrayBuffer(file);
  });
  */
}

/**
 * Parse string de data em vários formatos
 * NOTA: Função mantida para uso no código Excel comentado
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseDate(dateStr: string): Date {
  // Tenta diferentes formatos
  const formats = [
    /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/, // DD/MM/YYYY ou DD-MM-YYYY
    /(\d{2})[\/\-](\d{2})[\/\-](\d{2})/, // DD/MM/YY
    /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/, // YYYY/MM/DD
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (match[3].length === 4) {
        // YYYY-MM-DD
        if (match[1].length === 4) {
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        }
        // DD/MM/YYYY
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      } else {
        // DD/MM/YY
        const year = parseInt(match[3]) + 2000;
        return new Date(year, parseInt(match[2]) - 1, parseInt(match[1]));
      }
    }
  }

  // Fallback: tenta parse direto
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}
