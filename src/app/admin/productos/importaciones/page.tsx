import Link from 'next/link';
import { getBsaleProductImportRuns } from '@/lib/api/admin-import-audits';
import { RunStatusBadge, RunModeBadge } from '@/components/admin/ImportAuditBadges';

export const metadata = {
  title: 'Auditorías Bsale | Admin',
};

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('es-CL');
}

export default async function AdminImportAuditsPage() {
  const runs = await getBsaleProductImportRuns();

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">Auditorías Bsale</h1>
          <p className="text-sm text-slate-500 mt-1 break-words">
            Revisa dry-runs de importación antes de permitir cualquier aplicación real al catálogo.
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden flex flex-col">
        {runs.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">No hay auditorías</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-lg mx-auto">
              Aún no hay corridas dry_run registradas. Cuando se ejecute un dry-run de importación, aparecerá aquí para revisión.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha inicio</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Origen</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Modo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Vistos</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Crearían</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actualizarían</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Omitidos</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Conflictos</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Errores</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha término</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{formatDate(run.started_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{run.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><RunModeBadge mode={run.mode} /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><RunStatusBadge status={run.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">{run.total_seen}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">{run.total_created}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">{run.total_updated}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">{run.total_skipped}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">{run.total_conflicts}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">{run.total_errors}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(run.finished_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/productos/importaciones/${run.id}`} className="text-blue-600 hover:text-blue-900">
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
