import fs from 'fs';
import path from 'path';

const DEFAULT_CSV_PATH = 'local-data/wc-images-audit/wc-products-original-20260805.csv';
const DEFAULT_B2B_PATH = 'local-data/wc-images-audit/output/current-bsale-products-70-20260805.raw.json';
const OUTPUT_DIR = 'local-data/wc-images-audit/output';
const OUTPUT_CSV = path.join(OUTPUT_DIR, 'b2b70-wc-image-match-audit-20260805.csv');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'b2b70-wc-image-match-summary-20260805.json');

function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        value += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  if (row.length > 0 || value !== '') {
    row.push(value);
    rows.push(row);
  }

  return rows.filter(r => r.some(cell => String(cell).trim() !== ''));
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findHeader(headers, candidates) {
  const normalized = headers.map(normalizeHeader);
  return candidates
    .map(normalizeHeader)
    .map(candidate => normalized.indexOf(candidate))
    .find(index => index !== -1) ?? -1;
}

function normalizeSku(value) {
  return String(value || '').trim().toLowerCase();
}

function firstImageFromCell(value) {
  const images = String(value || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  return images[0] || '';
}

function isValidHttpUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function loadB2BProducts(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const rows = Array.isArray(raw) ? raw : raw.rows;
  if (!Array.isArray(rows)) {
    throw new Error(`Invalid B2B JSON: expected array or { rows } in ${filePath}`);
  }

  return rows.map(row => {
    const primaryImageUrl = row.primary_image_url || row.primaryImageUrl || null;
    return {
      product_id: row.product_id || row.id,
      sku: row.sku || '',
      bsale_variant_id: row.bsale_variant_id || row.bsaleVariantId || '',
      name: row.name || '',
      slug: row.slug || '',
      review_status: row.review_status || '',
      is_active: Boolean(row.is_active),
      is_visible: Boolean(row.is_visible),
      is_featured: Boolean(row.is_featured),
      bsale_sync_status: row.bsale_sync_status || '',
      primary_image_url: primaryImageUrl,
      has_primary_image: Boolean(row.has_primary_image || primaryImageUrl)
    };
  });
}

function parseWooCommerce(csvPath) {
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const csvData = parseCSV(csvText);
  const headers = csvData[0].map(h => h.trim());

  const idxId = findHeader(headers, ['ID', 'Id']);
  const idxType = findHeader(headers, ['Tipo', 'Type']);
  const idxSku = findHeader(headers, ['SKU']);
  const idxName = findHeader(headers, ['Nombre', 'Name']);
  const idxParent = findHeader(headers, ['Superior', 'Parent', 'Padre']);
  const idxImages = findHeader(headers, ['Imágenes', 'Imagenes', 'Images']);
  const idxCategories = findHeader(headers, ['Categorías', 'Categorias', 'Categories']);
  const idxShortDescription = findHeader(headers, ['Descripción corta', 'Descripcion corta', 'Short description']);
  const idxDescription = findHeader(headers, ['Descripción', 'Descripcion', 'Description']);

  const required = { idxId, idxType, idxSku, idxName, idxImages };
  const missing = Object.entries(required)
    .filter(([, index]) => index === -1)
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Missing required WooCommerce columns: ${missing.join(', ')}`);
  }

  const products = [];
  const byId = new Map();
  const bySku = new Map();
  const uniqueImages = new Set();

  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    const id = row[idxId]?.trim() || '';
    const type = row[idxType]?.trim() || '';
    const sku = row[idxSku]?.trim() || '';
    const name = row[idxName]?.trim() || '';
    const parentRaw = idxParent !== -1 ? (row[idxParent]?.trim() || '') : '';
    const image = firstImageFromCell(row[idxImages]);
    const categories = idxCategories !== -1 ? (row[idxCategories]?.trim() || '') : '';
    const shortDescription = idxShortDescription !== -1 ? (row[idxShortDescription]?.trim() || '') : '';
    const description = idxDescription !== -1 ? (row[idxDescription]?.trim() || '') : '';

    let parentId = '';
    if (parentRaw.startsWith('id:')) {
      parentId = parentRaw.split('id:')[1].trim();
    } else {
      parentId = parentRaw;
    }

    const wc = {
      id,
      type,
      sku,
      normalizedSku: normalizeSku(sku),
      name,
      parentId,
      directImageUrl: image,
      categories,
      shortDescription,
      description
    };

    products.push(wc);
    if (id) byId.set(id, wc);
    if (sku) {
      const key = normalizeSku(sku);
      if (!bySku.has(key)) bySku.set(key, []);
      bySku.get(key).push(wc);
    }
    if (image) uniqueImages.add(image);
  }

  let variationsWithInheritedImage = 0;
  for (const product of products) {
    if (!product.directImageUrl && product.type === 'variation' && product.parentId) {
      const parent = byId.get(product.parentId);
      if (parent?.directImageUrl) variationsWithInheritedImage++;
    }
  }

  return {
    products,
    byId,
    bySku,
    headers,
    metrics: {
      totalRows: products.length,
      rowsWithSku: products.filter(p => p.sku).length,
      rowsWithoutSku: products.filter(p => !p.sku).length,
      simpleProducts: products.filter(p => p.type === 'simple').length,
      variableProducts: products.filter(p => p.type === 'variable').length,
      variations: products.filter(p => p.type === 'variation').length,
      rowsWithDirectImage: products.filter(p => p.directImageUrl).length,
      uniqueImages: uniqueImages.size,
      variationsWithInheritedImage,
      duplicateSkuCount: [...bySku.values()].filter(items => items.length > 1).length,
      columns: {
        sku: headers[idxSku],
        name: headers[idxName],
        type: headers[idxType],
        parent: idxParent !== -1 ? headers[idxParent] : null,
        images: headers[idxImages],
        categories: idxCategories !== -1 ? headers[idxCategories] : null,
        shortDescription: idxShortDescription !== -1 ? headers[idxShortDescription] : null,
        description: idxDescription !== -1 ? headers[idxDescription] : null
      }
    }
  };
}

function getEffectiveImage(wc, byId) {
  if (wc.directImageUrl) {
    return {
      imageSourceType: 'direct',
      sourceImageUrl: wc.directImageUrl,
      parent: null
    };
  }

  if (wc.parentId) {
    const parent = byId.get(wc.parentId);
    if (parent?.directImageUrl) {
      return {
        imageSourceType: 'inherited',
        sourceImageUrl: parent.directImageUrl,
        parent
      };
    }
  }

  return {
    imageSourceType: 'none',
    sourceImageUrl: '',
    parent: wc.parentId ? byId.get(wc.parentId) || null : null
  };
}

function hasDuplicateConflict(matches, byId) {
  if (matches.length <= 1) return false;

  const signatures = new Set(matches.map(match => {
    const effective = getEffectiveImage(match, byId);
    return [
      match.type,
      match.name,
      effective.imageSourceType,
      effective.sourceImageUrl
    ].join('::');
  }));

  return signatures.size > 1;
}

function classifyProduct(product, wcIndex) {
  if (product.has_primary_image) {
    return {
      product_id: product.product_id,
      sku: product.sku,
      bsale_variant_id: product.bsale_variant_id,
      b2b_name: product.name,
      has_primary_image: true,
      current_primary_image_url: product.primary_image_url || '',
      wc_match_status: 'already_has_primary_image',
      wc_product_name: '',
      wc_product_type: '',
      wc_parent_name: '',
      image_source_type: 'none',
      source_image_url: '',
      confidence: 'high',
      recommended_action: 'skip_no_replace',
      reason: 'Producto B2B ya tiene imagen primaria; no se reemplaza.'
    };
  }

  const matches = wcIndex.bySku.get(normalizeSku(product.sku)) || [];
  if (hasDuplicateConflict(matches, wcIndex.byId)) {
    return {
      product_id: product.product_id,
      sku: product.sku,
      bsale_variant_id: product.bsale_variant_id,
      b2b_name: product.name,
      has_primary_image: false,
      current_primary_image_url: '',
      wc_match_status: 'duplicate_sku_or_conflict',
      wc_product_name: matches.map(m => m.name).join(' | '),
      wc_product_type: [...new Set(matches.map(m => m.type))].join(' | '),
      wc_parent_name: '',
      image_source_type: 'none',
      source_image_url: '',
      confidence: 'low',
      recommended_action: 'blocked_conflict',
      reason: 'SKU duplicado en WooCommerce con datos o imagenes efectivas distintas.'
    };
  }

  const match = matches[0];
  if (!match) {
    return {
      product_id: product.product_id,
      sku: product.sku,
      bsale_variant_id: product.bsale_variant_id,
      b2b_name: product.name,
      has_primary_image: false,
      current_primary_image_url: '',
      wc_match_status: 'no_image_match',
      wc_product_name: '',
      wc_product_type: '',
      wc_parent_name: '',
      image_source_type: 'none',
      source_image_url: '',
      confidence: 'none',
      recommended_action: 'no_import',
      reason: 'SKU B2B no encontrado en CSV WooCommerce.'
    };
  }

  const effective = getEffectiveImage(match, wcIndex.byId);
  const parentName = effective.parent?.name || '';

  if (!effective.sourceImageUrl) {
    return {
      product_id: product.product_id,
      sku: product.sku,
      bsale_variant_id: product.bsale_variant_id,
      b2b_name: product.name,
      has_primary_image: false,
      current_primary_image_url: '',
      wc_match_status: 'no_image_match',
      wc_product_name: match.name,
      wc_product_type: match.type,
      wc_parent_name: parentName,
      image_source_type: 'none',
      source_image_url: '',
      confidence: 'none',
      recommended_action: 'no_import',
      reason: 'SKU encontrado en WooCommerce, pero no hay imagen directa ni heredada desde padre.'
    };
  }

  if (!isValidHttpUrl(effective.sourceImageUrl)) {
    return {
      product_id: product.product_id,
      sku: product.sku,
      bsale_variant_id: product.bsale_variant_id,
      b2b_name: product.name,
      has_primary_image: false,
      current_primary_image_url: '',
      wc_match_status: 'invalid_url',
      wc_product_name: match.name,
      wc_product_type: match.type,
      wc_parent_name: parentName,
      image_source_type: effective.imageSourceType,
      source_image_url: effective.sourceImageUrl,
      confidence: 'low',
      recommended_action: 'blocked_invalid_url',
      reason: 'La URL de imagen efectiva no es http/https valida.'
    };
  }

  if (effective.imageSourceType === 'direct') {
    return {
      product_id: product.product_id,
      sku: product.sku,
      bsale_variant_id: product.bsale_variant_id,
      b2b_name: product.name,
      has_primary_image: false,
      current_primary_image_url: '',
      wc_match_status: 'direct_sku_image',
      wc_product_name: match.name,
      wc_product_type: match.type,
      wc_parent_name: parentName,
      image_source_type: 'direct',
      source_image_url: effective.sourceImageUrl,
      confidence: 'high',
      recommended_action: 'candidate_auto_import',
      reason: 'SKU exacto y misma fila WooCommerce tiene imagen directa valida.'
    };
  }

  return {
    product_id: product.product_id,
    sku: product.sku,
    bsale_variant_id: product.bsale_variant_id,
    b2b_name: product.name,
    has_primary_image: false,
    current_primary_image_url: '',
    wc_match_status: 'inherited_parent_image',
    wc_product_name: match.name,
    wc_product_type: match.type,
    wc_parent_name: parentName,
    image_source_type: 'inherited',
    source_image_url: effective.sourceImageUrl,
    confidence: 'medium',
    recommended_action: 'candidate_review_required',
    reason: 'SKU exacto de variacion sin imagen propia; usa imagen heredada desde padre y requiere revision visual.'
  };
}

function summarize(results) {
  return {
    totalB2bEvaluated: results.length,
    b2bWithPrimaryImage: results.filter(r => r.wc_match_status === 'already_has_primary_image').length,
    b2bWithoutPrimaryImage: results.filter(r => r.wc_match_status !== 'already_has_primary_image').length,
    directHighMatches: results.filter(r => r.wc_match_status === 'direct_sku_image').length,
    inheritedMediumMatches: results.filter(r => r.wc_match_status === 'inherited_parent_image').length,
    duplicateConflicts: results.filter(r => r.wc_match_status === 'duplicate_sku_or_conflict').length,
    invalidUrls: results.filter(r => r.wc_match_status === 'invalid_url').length,
    noMatchOrNoImage: results.filter(r => r.wc_match_status === 'no_image_match').length,
    autoImportCandidates: results.filter(r => r.recommended_action === 'candidate_auto_import').length,
    reviewRequiredCandidates: results.filter(r => r.recommended_action === 'candidate_review_required').length,
    blockedByExistingImage: results.filter(r => r.recommended_action === 'skip_no_replace').length,
    blockedByConflict: results.filter(r => r.recommended_action === 'blocked_conflict').length,
    estimatedAutoImportImages6D7E: results.filter(r => r.recommended_action === 'candidate_auto_import').length
  };
}

function writeOutputs(results, summary) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const headers = [
    'product_id',
    'sku',
    'bsale_variant_id',
    'b2b_name',
    'has_primary_image',
    'current_primary_image_url',
    'wc_match_status',
    'wc_product_name',
    'wc_product_type',
    'wc_parent_name',
    'image_source_type',
    'source_image_url',
    'confidence',
    'recommended_action',
    'reason'
  ];

  const rows = [
    headers.join(','),
    ...results.map(result => headers.map(header => csvEscape(result[header])).join(','))
  ];

  fs.writeFileSync(OUTPUT_CSV, `${rows.join('\n')}\n`);
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(summary, null, 2));
}

async function runAudit() {
  console.log('Iniciando cruce dry-run de imágenes B2B/WooCommerce...');

  const args = process.argv.slice(2);
  const csvPath = args[0] || DEFAULT_CSV_PATH;
  const b2bPath = args[1] || DEFAULT_B2B_PATH;

  if (!fs.existsSync(csvPath)) {
    throw new Error(`No se encontró el archivo CSV ${csvPath}`);
  }
  if (!fs.existsSync(b2bPath)) {
    throw new Error(`No se encontró el archivo de productos B2B ${b2bPath}`);
  }

  const wcIndex = parseWooCommerce(csvPath);
  const b2bProducts = loadB2BProducts(b2bPath);
  const results = b2bProducts.map(product => classifyProduct(product, wcIndex));
  const summary = {
    generatedAt: new Date().toISOString(),
    csvPath,
    b2bPath,
    outputs: {
      csv: OUTPUT_CSV,
      json: OUTPUT_JSON
    },
    metricsWooCommerce: wcIndex.metrics,
    metricsMatch: summarize(results),
    candidatesHigh: results.filter(r => r.recommended_action === 'candidate_auto_import'),
    candidatesMedium: results.filter(r => r.recommended_action === 'candidate_review_required'),
    blockedExisting: results.filter(r => r.recommended_action === 'skip_no_replace'),
    conflicts: results.filter(r => r.recommended_action === 'blocked_conflict'),
    invalidUrls: results.filter(r => r.recommended_action === 'blocked_invalid_url')
  };

  writeOutputs(results, summary);

  console.log(`Cruce finalizado. Resultados guardados en ${OUTPUT_DIR}`);
  console.log(JSON.stringify({
    metricsWooCommerce: summary.metricsWooCommerce,
    metricsMatch: summary.metricsMatch,
    outputCsv: OUTPUT_CSV,
    outputJson: OUTPUT_JSON
  }, null, 2));
}

runAudit().catch(error => {
  console.error(error);
  process.exit(1);
});
