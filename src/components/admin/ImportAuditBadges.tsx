const badgeBase = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

export function RunStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return <span className={`${badgeBase} bg-green-100 text-green-800`}>success</span>;
    case 'partial':
      return <span className={`${badgeBase} bg-amber-100 text-amber-800`}>partial</span>;
    case 'failed':
      return <span className={`${badgeBase} bg-red-100 text-red-800`}>failed</span>;
    case 'running':
      return <span className={`${badgeBase} bg-blue-100 text-blue-800`}>running</span>;
    default:
      return <span className={`${badgeBase} bg-slate-100 text-slate-800`}>{status}</span>;
  }
}

export function RunModeBadge({ mode }: { mode: string }) {
  switch (mode) {
    case 'dry_run':
      return <span className={`${badgeBase} bg-slate-100 text-slate-700`}>dry_run</span>;
    case 'apply':
      return <span className={`${badgeBase} bg-purple-100 text-purple-800`}>apply</span>;
    default:
      return <span className={`${badgeBase} bg-slate-100 text-slate-700`}>{mode}</span>;
  }
}

export function ItemActionBadge({ action }: { action: string }) {
  switch (action) {
    case 'create':
      return <span className={`${badgeBase} bg-blue-100 text-blue-800`}>create</span>;
    case 'update':
      return <span className={`${badgeBase} bg-green-100 text-green-800`}>update</span>;
    case 'link_existing':
      return <span className={`${badgeBase} bg-purple-100 text-purple-800`}>link_existing</span>;
    case 'skip':
      return <span className={`${badgeBase} bg-gray-100 text-gray-700`}>skip</span>;
    case 'conflict':
      return <span className={`${badgeBase} bg-amber-100 text-amber-800`}>conflict</span>;
    case 'error':
      return <span className={`${badgeBase} bg-red-100 text-red-800`}>error</span>;
    default:
      return <span className={`${badgeBase} bg-slate-100 text-slate-800`}>{action}</span>;
  }
}

export function ItemStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return <span className={`${badgeBase} bg-green-100 text-green-800`}>success</span>;
    case 'skipped':
      return <span className={`${badgeBase} bg-gray-100 text-gray-700`}>skipped</span>;
    case 'conflict':
      return <span className={`${badgeBase} bg-amber-100 text-amber-800`}>conflict</span>;
    case 'error':
      return <span className={`${badgeBase} bg-red-100 text-red-800`}>error</span>;
    case 'pending':
      return <span className={`${badgeBase} bg-blue-100 text-blue-800`}>pending</span>;
    default:
      return <span className={`${badgeBase} bg-slate-100 text-slate-800`}>{status}</span>;
  }
}

export function ConflictBadge({ conflictType }: { conflictType: string | null }) {
  if (!conflictType || conflictType === 'none' || conflictType === '') {
    return <span className="text-sm text-slate-400">-</span>;
  }
  return <span className={`${badgeBase} bg-red-100 text-red-800`}>{conflictType}</span>;
}
