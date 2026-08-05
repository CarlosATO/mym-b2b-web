# Reporte Apply Real Bsale Batch v2 (Fase 6D.7C)

## Objetivo

Aplicar de forma real y controlada la migracion v2 de apply Bsale batch y ejecutar una unica llamada RPC v2 sobre el run limpio aprobado, creando 50 productos Bsale en estado seguro.

## Estado Previo

Validado con SELECTs de solo lectura antes de aplicar estructura:

| Metrica | Valor |
|---------|------:|
| Total productos `web_b2b.products` | 24 |
| Productos Bsale reales | 20 |
| DEMO | 3 |
| TEST | 1 |
| `product_prices` | 0 |
| `product_stock` | 0 |
| `product_images` | 9 |
| Productos con imagen primaria | 8 |
| Objetos Storage `product-images` | 5 |
| Productos publicos activos/visibles | 3 |
| Productos Bsale publicos activos/visibles | 0 |

Run aprobado:

| Campo | Valor |
|-------|-------|
| `import_run_id` | `734968e6-c1f2-44bd-8812-8d4b32576d58` |
| Existe | `true` |
| Modo/status | `dry_run` / `success` |
| Candidatos `create` | 50 |
| Skipped | 0 |
| Conflicts | 0 |
| Errors | 0 |
| Apply previo para el run | `false` |

## Migracion v2 Aplicada

Comando ejecutado:

```bash
npx supabase db query --linked --file supabase/migrations/20260805130000_web_b2b_bsale_product_apply_batch_v2.sql
```

Resultado:

- Migracion aplicada sin errores.
- Funcion `public.web_b2b_system_apply_bsale_product_import_run_v2` existe.
- Constraint `chk_apply_run_max_items`: `CHECK (((max_items >= 1) AND (max_items <= 100)))`.
- Permisos de ejecucion visibles: `postgres` y `service_role`.
- `public`, `anon` y `authenticated` no tienen grant directo de execute.
- Aplicar estructura no creo productos.

Validacion posterior a la migracion, antes del apply:

| Metrica | Valor |
|---------|------:|
| Total productos | 24 |
| `product_prices` | 0 |
| `product_stock` | 0 |
| `product_images` | 9 |
| Productos con imagen primaria | 8 |
| Storage `product-images` | 5 |

## Apply Real v2

Llamada ejecutada una sola vez:

```sql
select public.web_b2b_system_apply_bsale_product_import_run_v2(
  'd1000000-0000-0000-0000-000000000001'::uuid,
  '734968e6-c1f2-44bd-8812-8d4b32576d58'::uuid,
  50
);
```

Respuesta JSON:

```json
{
  "apply_run_id": "514e8124-46aa-45e1-9c09-260eb981a84f",
  "import_run_id": "734968e6-c1f2-44bd-8812-8d4b32576d58",
  "no_images": true,
  "no_prices": true,
  "no_publication": true,
  "no_stock": true,
  "safe_state": "draft/inactive/not_visible/not_featured",
  "status": "success",
  "total_candidates": 50,
  "total_conflicts": 0,
  "total_created": 50,
  "total_errors": 0,
  "total_skipped": 0
}
```

## Validacion Posterior

| Metrica | Antes | Despues |
|---------|------:|--------:|
| Total productos | 24 | 74 |
| Productos Bsale reales | 20 | 70 |
| DEMO | 3 | 3 |
| TEST | 1 | 1 |
| Nuevos creados desde run | 0 | 50 |
| Nuevos seguros | 0 | 50 |
| `product_prices` | 0 | 0 |
| `product_stock` | 0 | 0 |
| `product_images` | 9 | 9 |
| Productos con imagen primaria | 8 | 8 |
| Storage `product-images` | 5 | 5 |
| Public count nuevos | 0 | 0 |
| Public slug count nuevos | 0 | 0 |

Estado de los 50 nuevos:

- `review_status = draft`: 50.
- `is_active = false`: 50.
- `is_visible = false`: 50.
- `is_featured = false`: 50.
- `bsale_sync_status = pending`: 50.
- `bsale_variant_id` no null: 50.
- `sku` no null: 50.
- Candidatos publicables inseguros: 0.

Trazabilidad:

- `apply_run_id`: `514e8124-46aa-45e1-9c09-260eb981a84f`.
- `apply_run.status`: `success`.
- `apply_run.max_items`: 50.
- `apply_run.total_candidates`: 50.
- `apply_run.total_created`: 50.
- `apply_run.total_skipped`: 0.
- `apply_run.total_conflicts`: 0.
- `apply_run.total_errors`: 0.
- `apply_items`: 50 `success`.
- `bsale_product_import_runs` conserva el dry-run original en `status = success`; la marca de aplicado queda representada por `web_b2b.bsale_product_apply_runs` mediante la unicidad `(company_id, import_run_id)`, segun el modelo existente.

## Productos Creados

| SKU | bsale_variant_id | Nombre | review_status | Activo | Visible | Destacado | Bsale sync |
|-----|------------------|--------|---------------|--------|---------|-----------|------------|
| `19482` | `1591` | COLLAR ISABELINO 12.5CM | `draft` | `false` | `false` | `false` | `pending` |
| `101188` | `1556` | BRIT CARE LETS BITE SNACKS DUCK FILLETS 80GR | `draft` | `false` | `false` | `false` | `pending` |
| `1G120000012` | `1588` | ISIS BANDEJA GATO 42CM GRIS | `draft` | `false` | `false` | `false` | `pending` |
| `1881-L` | `1579` | WONDER DOG ARNES PECHO SPACE TRAVELL T.L | `draft` | `false` | `false` | `false` | `pending` |
| `65148` | `1568` | BOTIN GAMUSA PARA PERROS ROSA/CAFE N2 | `draft` | `false` | `false` | `false` | `pending` |
| `1NP0309000GR` | `1615` | CHALECO HOLLYVET DISENOS SURTIDOS GRANDE | `draft` | `false` | `false` | `false` | `pending` |
| `1231035` | `1563` | ROYAL CANIN YOUNG MALE 3.5KG | `draft` | `false` | `false` | `false` | `pending` |
| `5426150` | `1561` | ROYAL CANIN MEDIUM PUPPY 15KG | `draft` | `false` | `false` | `false` | `pending` |
| `1IP100101015` | `1608` | INSTINCT PERRO SALMON 9KG | `draft` | `false` | `false` | `false` | `pending` |
| `1IG100101013` | `1600` | INSTINCT PERRO PATO 9KG | `draft` | `false` | `false` | `false` | `pending` |
| `10200019` | `1560` | ROYAL CANIN MEDIUM PUPPY 2.5KG | `draft` | `false` | `false` | `false` | `pending` |
| `100596` | `1554` | BRIT PREMIUM BY NATURE JUNIOR SMALL 3KG | `draft` | `false` | `false` | `false` | `pending` |
| `100524` | `1586` | BRIT CARE MINI LIGHT Y STERILISED 2KG | `draft` | `false` | `false` | `false` | `pending` |
| `65147` | `1567` | BOTIN GAMUSA PARA PERROS ROSA/CAFE N1 | `draft` | `false` | `false` | `false` | `pending` |
| `1006556` | `1557` | TRAPER REPELENTE AEROSOL PERRO Y GATO 440CC | `draft` | `false` | `false` | `false` | `pending` |
| `1IP020860101` | `1606` | MR CHEF MAGIC SMOKY MINI 2.5 7UND | `draft` | `false` | `false` | `false` | `pending` |
| `100901` | `1559` | BRIT CARE CAT GR. FREE KITTEN HEALTHY GROWTH Y DEVELOMENT 2KG | `draft` | `false` | `false` | `false` | `pending` |
| `1G120000018` | `1594` | ISIS BANDEJA GATO 50CM GRIS | `draft` | `false` | `false` | `false` | `pending` |
| `1NP061400012` | `1619` | BRAVECTO (20-40KG) 1000MG | `draft` | `false` | `false` | `false` | `pending` |
| `19480` | `1587` | COLLAR ISABELINO 7.5CM | `draft` | `false` | `false` | `false` | `pending` |
| `161618` | `1566` | CORRAL PEQUENOS ANIMALES | `draft` | `false` | `false` | `false` | `pending` |
| `1NP0309000CH` | `1614` | CHALECO HOLLYVET DISENOS SURTIDOS PEQUEÑO | `draft` | `false` | `false` | `false` | `pending` |
| `100597` | `1555` | BRIT PREMIUM BY NATURE ADULT SMALL 3KG | `draft` | `false` | `false` | `false` | `pending` |
| `1IP010801001` | `1603` | MR CHEF HUESO 4X3 | `draft` | `false` | `false` | `false` | `pending` |
| `1IG100104008` | `1604` | INSTINCT GATO CONEJO 2KG | `draft` | `false` | `false` | `false` | `pending` |
| `100583` | `1552` | BRIT LATA PATE Y MEAT DUCK 400GR | `draft` | `false` | `false` | `false` | `pending` |
| `1IG100101010` | `1599` | INSTINCT PERRO PATO 1.8KG | `draft` | `false` | `false` | `false` | `pending` |
| `1IP100101012` | `1609` | INSTINCT PERRO POLLO 10.2KG | `draft` | `false` | `false` | `false` | `pending` |
| `1881-M` | `1580` | WONDER DOG ARNES PECHO SPACE TRAVELL T.M | `draft` | `false` | `false` | `false` | `pending` |
| `1881-XXS` | `1584` | WONDER DOG ARNES PECHO SPACE TRAVELL T.XXS | `draft` | `false` | `false` | `false` | `pending` |
| `1881-S` | `1582` | WONDER DOG ARNES PECHO SPACE TRAVELL T.S | `draft` | `false` | `false` | `false` | `pending` |
| `1881-XS` | `1571` | WONDER DOG ARNES PECHO SPACE TRAVELLER T.XS | `draft` | `false` | `false` | `false` | `pending` |
| `100783` | `1558` | BRIT CARE LETS BITE MEAT SNACKS PURE SALMON SLICES 80GR | `draft` | `false` | `false` | `false` | `pending` |
| `100588` | `1550` | BRIT LATA MONO PROTEIN TURKEY 400GR | `draft` | `false` | `false` | `false` | `pending` |
| `19483` | `1592` | COLLAR ISABELINO 15CM | `draft` | `false` | `false` | `false` | `pending` |
| `100584` | `1551` | BRIT LATA PATE Y MEAT PUPPY 400GR | `draft` | `false` | `false` | `false` | `pending` |
| `1G120000013` | `1589` | ISIS BANDEJA GATO 42CM VERDE | `draft` | `false` | `false` | `false` | `pending` |
| `100600` | `1553` | BRIT PREMIUM BY NATURE ADULT MEDIUM 3KG | `draft` | `false` | `false` | `false` | `pending` |
| `1G120000017` | `1593` | ISIS BANDEJA GATO 50CM VERDE | `draft` | `false` | `false` | `false` | `pending` |
| `1NP061400010` | `1618` | BRAVECTO (4.5-10KG) 250MG | `draft` | `false` | `false` | `false` | `pending` |
| `1NP0309000OM` | `1616` | CHALECO HOLLYVET DISENOS SURTIDOS MEDIANO | `draft` | `false` | `false` | `false` | `pending` |
| `1IP100101014` | `1607` | INSTINCT PERRO SALMON 1.8KG | `draft` | `false` | `false` | `false` | `pending` |
| `1232015` | `1564` | ROYAL CANIN YOUNG FEMALE 1.5KG | `draft` | `false` | `false` | `false` | `pending` |
| `19481` | `1590` | COLLAR ISABELINO 10CM | `draft` | `false` | `false` | `false` | `pending` |
| `1IP010801002` | `1605` | MR CHEF HUESO 4X5 | `draft` | `false` | `false` | `false` | `pending` |
| `1NP061400009` | `1617` | BRAVECTO (2-4,5KG) 112.5MG | `draft` | `false` | `false` | `false` | `pending` |
| `19484` | `1595` | COLLAR ISABELINO 20CM | `draft` | `false` | `false` | `false` | `pending` |
| `1231015` | `1562` | ROYAL CANIN YOUNG MALE 1.5KG | `draft` | `false` | `false` | `false` | `pending` |
| `1232035` | `1565` | ROYAL CANIN YOUNG FEMALE 3.5KG | `draft` | `false` | `false` | `false` | `pending` |
| `1GA0391` | `1596` | EARTHBORN PRIMITIVE FELINE 2KG | `draft` | `false` | `false` | `false` | `pending` |

## Seguridad

- No se ejecuto `db push`, `db pull` ni `migration repair`.
- No se llamo Bsale.
- No se llamo RPC apply v1.
- No se aplico otro `import_run_id`.
- No se crearon productos manualmente.
- No se modificaron productos fuera de la RPC v2.
- No se borraron productos.
- No se publicaron productos.
- No se tocaron `product_prices` ni `product_stock`.
- No se importaron imagenes.
- No se modifico Storage.
- No se toco WordPress/WooCommerce/cPanel.

## Siguiente Paso

Fase 6D.7D: cruzar productos Bsale ampliados contra el CSV WooCommerce para preparar importacion de imagenes por lote, sin reemplazar imagenes existentes y sin publicar productos automaticamente.
