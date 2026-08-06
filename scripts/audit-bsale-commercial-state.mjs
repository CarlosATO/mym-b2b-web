#!/usr/bin/env node
import process from 'node:process';

const baseUrl = process.env.BSALE_API_BASE_URL || 'https://api.bsale.io/v1';
const token = process.env.BSALE_ACCESS_TOKEN;

async function fetchJson(endpoint) {
  if (!token) {
    throw new Error('BSALE_ACCESS_TOKEN is not defined');
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      Accept: 'application/json',
      access_token: token,
    },
  });

  if (!response.ok) {
    throw new Error(`Bsale API error: ${response.status}`);
  }

  return response.json();
}

async function main() {
  const variantIds = process.argv.slice(2);
  const variantsToAudit = variantIds.length > 0 ? variantIds : ['6216', '1494'];

  for (const variantId of variantsToAudit) {
    const [priceResponse, stockResponse] = await Promise.all([
      fetchJson(`/price_lists/4/details.json?variantid=${encodeURIComponent(variantId)}`),
      fetchJson(`/stocks.json?variantid=${encodeURIComponent(variantId)}`),
    ]);

    const priceItems = Array.isArray(priceResponse.items) ? priceResponse.items : [];
    const matchedPrice = priceItems.find((item) => String(item?.variant?.id ?? '') === String(variantId));
    const stockItems = Array.isArray(stockResponse.items) ? stockResponse.items : [];
    const quantityAvailableInternal = stockItems.reduce((sum, item) => sum + Number(item?.quantityAvailable ?? 0), 0);

    console.log(JSON.stringify({
      variantId,
      priceFound: Boolean(matchedPrice),
      priceWithTaxes: matchedPrice?.variantValueWithTaxes ?? null,
      priceStatus: matchedPrice ? 'ok' : 'not_found',
      stockFound: stockItems.length > 0,
      quantityAvailableInternal,
      availabilityStatus: quantityAvailableInternal > 0 ? 'available' : stockItems.length > 0 ? 'out_of_stock' : 'consult',
      stockStatus: stockItems.length > 0 ? 'ok' : 'not_found',
    }, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
