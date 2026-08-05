import fs from 'fs';

// Helper for CSV parsing
function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let currentVal = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentVal += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentVal);
        currentVal = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \n
        }
        row.push(currentVal);
        rows.push(row);
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }
  if (row.length > 0 || currentVal !== '') {
    row.push(currentVal);
    rows.push(row);
  }
  return rows;
}

async function runAudit() {
  console.log('Iniciando auditoría dry-run de imágenes...');
  
  const args = process.argv.slice(2);
  const csvPath = args[0] || 'local-data/wc-images-audit/wc-products-original-20260805.csv';
  const b2bPath = 'local-data/wc-images-audit/output/current-web-products-20260805.json';

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: No se encontró el archivo CSV ${csvPath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(b2bPath)) {
    console.error(`Error: No se encontró el archivo de productos B2B ${b2bPath}`);
    process.exit(1);
  }

  const csvText = fs.readFileSync(csvPath, 'utf8');
  const csvData = parseCSV(csvText);
  const headers = csvData[0].map(h => h.trim());
  
  const idxId = headers.findIndex(h => h.toLowerCase() === 'id');
  const idxType = headers.findIndex(h => h.toLowerCase() === 'tipo');
  const idxSku = headers.findIndex(h => h.toLowerCase() === 'sku');
  const idxName = headers.findIndex(h => h.toLowerCase() === 'nombre');
  const idxParent = headers.findIndex(h => h.toLowerCase() === 'superior');
  const idxImages = headers.findIndex(h => h.toLowerCase() === 'imágenes' || h.toLowerCase() === 'imagenes');
  const idxCategories = headers.findIndex(h => h.toLowerCase() === 'categorías' || h.toLowerCase() === 'categorias');

  const wcProducts = [];
  const wcMapById = new Map();
  
  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    if (row.length < Math.max(idxId, idxSku, idxName)) continue;
    
    const id = row[idxId]?.trim() || '';
    const type = row[idxType]?.trim() || '';
    const sku = row[idxSku]?.trim() || '';
    const name = row[idxName]?.trim() || '';
    const parentRaw = row[idxParent]?.trim() || '';
    const images = row[idxImages]?.trim() || '';
    const categories = idxCategories !== -1 ? (row[idxCategories]?.trim() || '') : '';
    
    let parentId = null;
    if (parentRaw.startsWith('id:')) {
      parentId = parentRaw.split('id:')[1].trim();
    } else if (parentRaw) {
      parentId = parentRaw;
    }

    const firstImage = images.split(',')[0].trim() || null;

    const prod = { id, type, sku, name, parentId, firstImage, categories };
    wcProducts.push(prod);
    if (id) {
      wcMapById.set(id, prod);
    }
  }

  let metricsWc = {
    total: wcProducts.length,
    withSku: 0,
    withoutSku: 0,
    simple: 0,
    variable: 0,
    variation: 0,
    withDirectImage: 0,
    uniqueImages: new Set(),
    variationsWithInheritedImage: 0
  };

  wcProducts.forEach(p => {
    if (p.sku) metricsWc.withSku++;
    else metricsWc.withoutSku++;
    
    if (p.type === 'simple') metricsWc.simple++;
    else if (p.type === 'variable') metricsWc.variable++;
    else if (p.type === 'variation') metricsWc.variation++;
    
    let effectiveImage = p.firstImage;
    if (effectiveImage) {
      metricsWc.withDirectImage++;
      metricsWc.uniqueImages.add(effectiveImage);
    } else if (p.parentId && wcMapById.has(p.parentId)) {
      const parent = wcMapById.get(p.parentId);
      if (parent.firstImage) {
        effectiveImage = parent.firstImage;
        if (p.type === 'variation') {
          metricsWc.variationsWithInheritedImage++;
        }
      }
    }
  });

  const b2bRaw = JSON.parse(fs.readFileSync(b2bPath, 'utf8'));
  let metricsB2b = {
    total: b2bRaw.length,
    withImage: 0,
    withoutImage: 0,
    draft: 0,
    visible: 0,
    inactive: 0
  };

  b2bRaw.forEach(p => {
    if (p.primary_image_url) metricsB2b.withImage++;
    else metricsB2b.withoutImage++;
    
    if (p.review_status === 'draft') metricsB2b.draft++;
    if (p.is_visible) metricsB2b.visible++;
    if (!p.is_active) metricsB2b.inactive++;
  });

  let metricsMatch = {
    highDirect: 0,
    highInherited: 0,
    highNoImage: 0,
    alreadyHasImage: 0,
    noMatch: 0,
    mediumCandidates: 0,
    autoCandidates: 0,
    blockedExisting: 0
  };

  const results = [];

  for (const b2b of b2bRaw) {
    if (b2b.primary_image_url) {
      metricsMatch.alreadyHasImage++;
      metricsMatch.blockedExisting++;
      results.push({
        product_id: b2b.id,
        bsale_sku: b2b.sku,
        bsale_name: b2b.name,
        match_status: 'already_has_image',
        wc_id: '',
        wc_type: '',
        wc_name: '',
        wc_parent_id: '',
        image_source: '',
        effective_image_url: '',
        recommended_action: 'already_has_image',
        confidence: 'high',
        reason: 'B2B product already has primary_image_url'
      });
      continue;
    }

    const matchSku = wcProducts.find(w => w.sku && w.sku === b2b.sku);
    if (matchSku) {
      let effectiveImage = matchSku.firstImage;
      let source = 'direct';
      let parentObj = null;

      if (!effectiveImage && matchSku.parentId) {
        parentObj = wcMapById.get(matchSku.parentId);
        if (parentObj && parentObj.firstImage) {
          effectiveImage = parentObj.firstImage;
          source = 'inherited';
        }
      }

      if (effectiveImage) {
        if (source === 'direct') metricsMatch.highDirect++;
        else metricsMatch.highInherited++;
        
        metricsMatch.autoCandidates++;
        
        results.push({
          product_id: b2b.id,
          bsale_sku: b2b.sku,
          bsale_name: b2b.name,
          match_status: 'exact_sku',
          wc_id: matchSku.id,
          wc_type: matchSku.type,
          wc_name: matchSku.name,
          wc_parent_id: matchSku.parentId || '',
          image_source: source,
          effective_image_url: effectiveImage,
          recommended_action: 'import_auto_candidate',
          confidence: 'high',
          reason: `Exact SKU match with ${source} image`
        });
      } else {
        metricsMatch.highNoImage++;
        results.push({
          product_id: b2b.id,
          bsale_sku: b2b.sku,
          bsale_name: b2b.name,
          match_status: 'exact_sku_no_image',
          wc_id: matchSku.id,
          wc_type: matchSku.type,
          wc_name: matchSku.name,
          wc_parent_id: matchSku.parentId || '',
          image_source: 'none',
          effective_image_url: '',
          recommended_action: 'review_required',
          confidence: 'medium',
          reason: 'Exact SKU match but no image available in row or parent'
        });
      }
    } else {
      // name match candidate?
      const nameMatch = wcProducts.find(w => w.name && w.name.toLowerCase() === b2b.name.toLowerCase());
      if (nameMatch) {
        metricsMatch.mediumCandidates++;
        results.push({
          product_id: b2b.id,
          bsale_sku: b2b.sku,
          bsale_name: b2b.name,
          match_status: 'name_match',
          wc_id: nameMatch.id,
          wc_type: nameMatch.type,
          wc_name: nameMatch.name,
          wc_parent_id: nameMatch.parentId || '',
          image_source: 'direct',
          effective_image_url: nameMatch.firstImage || '',
          recommended_action: 'review_required',
          confidence: 'medium',
          reason: 'Name match only, missing or different SKU'
        });
      } else {
        metricsMatch.noMatch++;
        results.push({
          product_id: b2b.id,
          bsale_sku: b2b.sku,
          bsale_name: b2b.name,
          match_status: 'no_match',
          wc_id: '',
          wc_type: '',
          wc_name: '',
          wc_parent_id: '',
          image_source: '',
          effective_image_url: '',
          recommended_action: 'ignore',
          confidence: 'low',
          reason: 'No SKU or Name match found in export'
        });
      }
    }
  }

  const outSummary = {
    metricsWc: { ...metricsWc, uniqueImages: metricsWc.uniqueImages.size },
    metricsB2b,
    metricsMatch
  };

  fs.writeFileSync('local-data/wc-images-audit/output/wc-image-dry-run-summary-20260805.json', JSON.stringify(outSummary, null, 2));

  // Write Candidates CSV
  const csvHeaders = 'product_id,bsale_sku,bsale_name,match_status,wc_id,wc_type,wc_name,wc_parent_id,image_source,effective_image_url,recommended_action,confidence,reason\n';
  let csvOut = csvHeaders;
  let reviewOut = csvHeaders;
  
  results.forEach(r => {
    const rowStr = `${r.product_id},${r.bsale_sku},"${r.bsale_name}",${r.match_status},${r.wc_id},${r.wc_type},"${r.wc_name}",${r.wc_parent_id},${r.image_source},${r.effective_image_url},${r.recommended_action},${r.confidence},"${r.reason}"\n`;
    csvOut += rowStr;
    if (r.recommended_action === 'review_required' || r.recommended_action === 'ignore') {
      reviewOut += rowStr;
    }
  });

  fs.writeFileSync('local-data/wc-images-audit/output/wc-image-dry-run-candidates-20260805.csv', csvOut);
  fs.writeFileSync('local-data/wc-images-audit/output/wc-image-dry-run-review-20260805.csv', reviewOut);

  console.log(`Auditoría finalizada. Resultados guardados en local-data/wc-images-audit/output/`);
  console.log(JSON.stringify(outSummary, null, 2));
}

runAudit().catch(console.error);
