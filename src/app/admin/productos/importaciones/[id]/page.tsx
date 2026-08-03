import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBsaleProductImportRuns, getBsaleProductImportItems } from '@/lib/api/admin-import-audits';
import {
  RunStatusBadge,
  RunModeBadge,
  ItemActionBadge,
  ItemStatusBadge,
  ConflictBadge
} from '@/components/admin/ImportAuditBadges';

export const metadata = {
  title: 'Detalle Auditoría Bsale | Admin',
};

const PAGE_SIZE = 100;

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('es-CL');
}

export default async function AdminImportAuditDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const runId = resolvedParams.id;
  const page = typeof resolvedSearchParams.page === 'string'
    ? parseInt(resolvedSearchParams.page, 10) || 1
    : 1;

  const [runs, items] = await Promise.all([
    getBsaleProductImportRuns(),
    getBsaleProductImportItems(runId, PAGE_SIZE, page)
  ]);

  const run = runs.find((r) => r.id === runId);
  if (!run) {
    notFound();
  }

  const totalCount = items.length > 0 ? items[0].total_count : 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 truncate">Detalle Auditoría Bsale</h1>
          <p className="text-sm text-slate-500 mt-1 break-words">
            Revisión read-only de una corrida dry_run. No se ejecuta ni se aplica ninguna importación.
          </p>
        </div>
        <Link
          href="/admin/productos/importaciones"
          className="inline-flex flex-shrink-0 items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50"
        >
          Volver a auditorías
        </Link>
      </div>

      {/* Resumen superior del run */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-slate-900">Run: {run.id}</h2>
          <RunModeBadge mode={run.mode} />
          <RunStatusBadge status={run.status} />
          <span className="text-sm text-slate-500">Origen: {run.source}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Inicio</div>
            <div className="mt-1 text-slate-900">{formatDate(run.started_at)}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Término</div>
            <div className="mt-1 text-slate-900">{formatDate(run.finished_at)}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vistos</div>
            <div className="mt-1 text-slate-900">{run.total_seen}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Crearían</div>
            <div className="mt-1 text-slate-900">{run.total_created}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Actualizarían</div>
            <div className="mt-1 text-slate-900">{run.total_updated}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Omitidos</div>
            <div className="mt-1 text-slate-900">{run.total_skipped}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Conflictos / Errores</div>
            <div className="mt-1 text-slate-900">{run.total_conflicts} / {run.total_errors}</div>
          </div>
        </div>
        {run.error_message && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-3 rounded-r-md text-sm text-red-800">
            {run.error_message}
          </div>
        )}
      </div>

      {/* Items de la corrida */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden flex flex-col">
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-sm font-medium text-slate-900">No hay items para esta corrida</h3>
            <p className="mt-1 text-sm text-slate-500">Esta corrida no registró items en la auditoría.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acción</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SKU</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bsale Variant ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Producto web match</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo conflicto</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mensaje</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap"><ItemActionBadge action={item.action} /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><ItemStatusBadge status={item.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{item.sku || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.bsale_variant_id || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{item.source_name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {item.matched_product_id ? (
                        <Link href={`/admin/productos/${item.matched_product_id}/editar`} className="text-blue-600 hover:text-blue-900">
                          {item.matched_product_id}
                        </Link>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><ConflictBadge conflictType={item.conflict_type} /></td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-[240px] truncate" title={item.message || ''}>{item.message || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Mostrando página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span> ({totalCount} items)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Link
                    href={`/admin/productos/importaciones/${runId}?page=${page > 1 ? page - 1 : 1}`}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium ${page <= 1 ? 'text-slate-300 pointer-events-none' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Anterior
                  </Link>
                  <Link
                    href={`/admin/productos/importaciones/${runId}?page=${page < totalPages ? page + 1 : totalPages}`}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium ${page >= totalPages ? 'text-slate-300 pointer-events-none' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Siguiente
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
