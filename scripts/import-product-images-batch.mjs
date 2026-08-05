import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const COMPANY_ID = 'd1000000-0000-0000-0000-000000000001';
const BUCKET = 'product-images';
const AUDIT_CSV = 'local-data/wc-images-audit/output/b2b70-wc-image-match-audit-20260805.csv';
const OUTPUT_DIR = 'local-data/wc-images-audit/output';
const DRY_RUN_JSON = path.join(OUTPUT_DIR, 'batch-image-import-dry-run-6D7E-20260805.json');
const DRY_RUN_CSV = path.join(OUTPUT_DIR, 'batch-image-import-dry-run-6D7E-20260805.csv');
const APPLY_JSON = path.join(OUTPUT_DIR, 'batch-image-import-apply-6D7E-20260805.json');
const APPLY_CSV = path.join(OUTPUT_DIR, 'batch-image-import-apply-6D7E-20260805.csv');
const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const EXPECTED_HOST = 'amimascota.cl';

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');
  const apply = args.has('--apply');
  const confirm = args.has('--confirm');

  if (dryRun === apply) {
    throw new Error('Debes usar exactamente un modo: --dry-run o --apply.');
  }

  if (apply && !confirm) {
    throw new Error('Modo --apply requiere confirmación explícita con --confirm.');
  }

  return { dryRun, apply, confirm };
}

function loadEnvLocal() {
  if (!fs.existsSync('.env.local')) return;

  const lines = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

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

function loadCandidatesFromAudit() {
  if (!fs.existsSync(AUDIT_CSV)) {
    throw new Error(`No existe el CSV de auditoría requerido: ${AUDIT_CSV}`);
  }

  const rows = parseCSV(fs.readFileSync(AUDIT_CSV, 'utf8'));
  const headers = rows[0];

  return rows.slice(1)
    .map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ''])))
    .filter(row =>
      row.recommended_action === 'candidate_auto_import' &&
      row.confidence === 'high' &&
      row.has_primary_image === 'false'
    )
    .map(row => ({
      productId: row.product_id,
      sku: row.sku,
      bsaleVariantId: row.bsale_variant_id,
      productName: row.b2b_name,
      sourceUrl: row.source_image_url
    }));
}

function parseSupabaseJson(stdout) {
  const text = String(stdout);
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`No se pudo parsear salida JSON de Supabase CLI: ${text.slice(0, 200)}`);
  }
  return JSON.parse(text.slice(start, end + 1));
}

function runReadQuery(sql) {
  const stdout = execFileSync('npx', ['supabase', 'db', 'query', '--linked', '--output', 'json', sql], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return parseSupabaseJson(stdout).rows || [];
}

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function validateSourceUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'URL inválida.' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, reason: 'URL debe usar http/https.' };
  }

  if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(parsed.hostname.toLowerCase()) || parsed.hostname.endsWith('.local')) {
    return { ok: false, reason: 'URL local o privada no permitida.' };
  }

  if (parsed.hostname.toLowerCase() !== EXPECTED_HOST) {
    return { ok: false, reason: `Host inesperado: ${parsed.hostname}.` };
  }

  return { ok: true, parsed };
}

function normalizeContentType(contentType) {
  return contentType?.split(';')[0]?.trim().toLowerCase() || '';
}

function extensionForMime(mimeType) {
  switch (mimeType) {
    case 'image/jpg':
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return '';
  }
}

async function probeImage(url) {
  const response = await fetch(url, {
    method: 'HEAD',
    redirect: 'follow',
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`HEAD HTTP ${response.status}`);
  }

  const finalUrlValidation = validateSourceUrl(response.url);
  if (!finalUrlValidation.ok) {
    throw new Error(`URL final rechazada: ${finalUrlValidation.reason}`);
  }

  const mime = normalizeContentType(response.headers.get('content-type'));
  const sizeHeader = response.headers.get('content-length');
  const size = sizeHeader ? Number(sizeHeader) : null;

  if (!ALLOWED_MIME_TYPES.has(mime)) {
    throw new Error(`MIME no permitido: ${mime || 'sin content-type'}`);
  }

  if (!Number.isFinite(size)) {
    throw new Error('No se pudo determinar content-length con HEAD.');
  }

  if (size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new Error(`Imagen excede 5 MB: ${size} bytes.`);
  }

  return { mime, size, finalUrl: response.url };
}

async function downloadImage(url) {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    throw new Error(`GET HTTP ${response.status}`);
  }

  const mime = normalizeContentType(response.headers.get('content-type'));
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    throw new Error(`MIME no permitido: ${mime || 'sin content-type'}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > PRODUCT_IMAGE_MAX_BYTES) {
    throw new Error(`Imagen excede 5 MB: ${bytes.byteLength} bytes.`);
  }

  return { bytes, mime, size: bytes.byteLength, finalUrl: response.url };
}

function fetchCurrentProducts(candidates) {
  const skuList = candidates.map(c => sqlLiteral(c.sku)).join(',');
  const sql = `
    select p.id as product_id, p.sku, p.bsale_variant_id, p.name,
           p.review_status, p.is_active, p.is_visible, p.is_featured,
           p.bsale_sync_status, pi.url as primary_image_url,
           (pi.id is not null) as has_primary_image,
           (p.review_status='published' and p.is_active=true and p.is_visible=true) as public_exposed
    from web_b2b.products p
    left join web_b2b.product_images pi on pi.product_id=p.id and pi.is_primary=true
    where p.company_id=${sqlLiteral(COMPANY_ID)}::uuid
      and p.sku in (${skuList})
    order by p.sku asc;
  `;
  return runReadQuery(sql);
}

function fetchSafetyCounts() {
  const sql = `
    select jsonb_build_object(
      'products', (select count(*) from web_b2b.products where company_id=${sqlLiteral(COMPANY_ID)}::uuid),
      'product_images', (select count(*) from web_b2b.product_images pi join web_b2b.products p on p.id=pi.product_id where p.company_id=${sqlLiteral(COMPANY_ID)}::uuid),
      'storage_objects', (select count(*) from storage.objects where bucket_id=${sqlLiteral(BUCKET)}),
      'product_prices', (select count(*) from web_b2b.product_prices where company_id=${sqlLiteral(COMPANY_ID)}::uuid),
      'product_stock', (select count(*) from web_b2b.product_stock where company_id=${sqlLiteral(COMPANY_ID)}::uuid)
    ) as counts;
  `;
  return runReadQuery(sql)[0]?.counts || {};
}

async function buildPlan(candidates) {
  const currentRows = fetchCurrentProducts(candidates);
  const rowsBySku = new Map();
  for (const row of currentRows) {
    if (!rowsBySku.has(row.sku)) rowsBySku.set(row.sku, []);
    rowsBySku.get(row.sku).push(row);
  }

  const results = [];
  for (const candidate of candidates) {
    const matches = rowsBySku.get(candidate.sku) || [];
    const base = {
      sku: candidate.sku,
      product_id: candidate.productId,
      product_name: candidate.productName,
      source_url: candidate.sourceUrl,
      detected_mime: '',
      detected_size: '',
      planned_storage_path: '',
      planned_public_url: '',
      action: 'blocked',
      reason: ''
    };

    const block = reason => ({ ...base, action: 'blocked', reason });

    if (matches.length !== 1) {
      results.push(block(`SKU debe existir una sola vez en B2B; encontrados=${matches.length}.`));
      continue;
    }

    const current = matches[0];
    if (current.product_id !== candidate.productId) {
      results.push(block('product_id del CSV de auditoría no coincide con B2B actual.'));
      continue;
    }

    if (current.has_primary_image) {
      results.push(block('Producto ya tiene imagen primaria; no se reemplaza.'));
      continue;
    }

    if (current.review_status !== 'draft' || current.is_active || current.is_visible || current.is_featured) {
      results.push(block('Producto no está en estado seguro draft/inactivo/no visible/no destacado.'));
      continue;
    }

    if (current.bsale_sync_status !== 'pending') {
      results.push(block(`bsale_sync_status inesperado: ${current.bsale_sync_status}.`));
      continue;
    }

    if (current.public_exposed) {
      results.push(block('Producto aparece expuesto públicamente.'));
      continue;
    }

    const urlValidation = validateSourceUrl(candidate.sourceUrl);
    if (!urlValidation.ok) {
      results.push(block(urlValidation.reason));
      continue;
    }

    try {
      const probe = await probeImage(candidate.sourceUrl);
      const extension = extensionForMime(probe.mime);
      if (!extension) {
        results.push(block(`No se pudo determinar extensión para MIME ${probe.mime}.`));
        continue;
      }

      const plannedStoragePath = `${COMPANY_ID}/${candidate.productId}/${crypto.randomUUID()}.${extension}`;
      const publicBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
      const plannedPublicUrl = `${publicBaseUrl}/storage/v1/object/public/${BUCKET}/${plannedStoragePath}`;

      results.push({
        ...base,
        detected_mime: probe.mime,
        detected_size: probe.size,
        planned_storage_path: plannedStoragePath,
        planned_public_url: plannedPublicUrl,
        action: 'would_import',
        reason: 'Validación dry-run OK; importaría en modo --apply --confirm.'
      });
    } catch (error) {
      results.push(block(error instanceof Error ? error.message : 'Error al validar URL de imagen.'));
    }
  }

  return results;
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function writeResultFiles(results, summary, mode) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const jsonPath = mode === 'dry-run' ? DRY_RUN_JSON : APPLY_JSON;
  const csvPath = mode === 'dry-run' ? DRY_RUN_CSV : APPLY_CSV;

  const headers = [
    'sku',
    'product_id',
    'product_name',
    'source_url',
    'detected_mime',
    'detected_size',
    'planned_storage_path',
    'planned_public_url',
    'action',
    'reason'
  ];

  fs.writeFileSync(jsonPath, JSON.stringify({ summary, results }, null, 2));
  fs.writeFileSync(csvPath, [
    headers.join(','),
    ...results.map(result => headers.map(header => csvEscape(result[header])).join(','))
  ].join('\n') + '\n');

  return { jsonPath, csvPath };
}

function createStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

function insertProductImage(productId, publicUrl) {
  const sql = `
    insert into web_b2b.product_images (product_id, url, is_primary, order_index)
    select ${sqlLiteral(productId)}::uuid, ${sqlLiteral(publicUrl)}, true, 0
    where not exists (
      select 1 from web_b2b.product_images
      where product_id=${sqlLiteral(productId)}::uuid and is_primary=true
    );
  `;

  execFileSync('npx', ['supabase', 'db', 'query', '--linked', sql], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

async function applyImports(plan) {
  const supabase = createStorageClient();
  const results = [];

  for (const item of plan) {
    if (item.action !== 'would_import') {
      results.push(item);
      continue;
    }

    const currentRows = fetchCurrentProducts([{ sku: item.sku }]);
    const current = currentRows[0];
    if (!current || current.has_primary_image) {
      results.push({ ...item, action: 'blocked', reason: 'Producto ya no es elegible al momento de aplicar.' });
      continue;
    }

    const downloaded = await downloadImage(item.source_url);
    const extension = extensionForMime(downloaded.mime);
    const objectPath = `${COMPANY_ID}/${item.product_id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, downloaded.bytes, {
        contentType: downloaded.mime,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      results.push({ ...item, action: 'blocked', reason: `Storage upload falló: ${uploadError.message}` });
      continue;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    const publicUrl = data.publicUrl;

    try {
      insertProductImage(item.product_id, publicUrl);
      results.push({
        ...item,
        detected_mime: downloaded.mime,
        detected_size: downloaded.size,
        planned_storage_path: objectPath,
        planned_public_url: publicUrl,
        action: 'imported',
        reason: 'Imagen subida e insertada como primaria.'
      });
    } catch (error) {
      await supabase.storage.from(BUCKET).remove([objectPath]);
      results.push({
        ...item,
        action: 'blocked',
        reason: error instanceof Error ? `Insert product_images falló; Storage compensado: ${error.message}` : 'Insert product_images falló; Storage compensado.'
      });
    }
  }

  return results;
}

async function main() {
  const args = parseArgs();
  loadEnvLocal();

  const candidates = loadCandidatesFromAudit();
  const beforeCounts = fetchSafetyCounts();
  const plan = await buildPlan(candidates);

  let results = plan;
  const mode = args.dryRun ? 'dry-run' : 'apply';
  if (args.apply) {
    results = await applyImports(plan);
  }
  const afterCounts = fetchSafetyCounts();

  const summary = {
    mode,
    generated_at: new Date().toISOString(),
    source_audit_csv: AUDIT_CSV,
    total_candidates: candidates.length,
    would_import: results.filter(r => r.action === 'would_import').length,
    imported: results.filter(r => r.action === 'imported').length,
    blocked: results.filter(r => r.action === 'blocked').length,
    before_counts: beforeCounts,
    after_counts: afterCounts
  };

  const output = writeResultFiles(results, summary, mode);
  console.log(JSON.stringify({ summary, output, results }, null, 2));
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
