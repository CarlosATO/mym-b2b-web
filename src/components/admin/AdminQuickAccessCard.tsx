import Link from 'next/link';

interface AdminQuickAccessCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  available?: boolean;
}

export default function AdminQuickAccessCard({
  href,
  title,
  description,
  icon,
  badge,
  available = true,
}: AdminQuickAccessCardProps) {
  const cardContent = (
    <div className={`relative flex flex-col gap-3 p-5 bg-white border rounded-xl shadow-sm transition-all ${available ? 'border-slate-200 hover:border-blue-400 hover:shadow-md card-hover cursor-pointer' : 'border-slate-100 opacity-60 cursor-not-allowed'}`}>
      {badge && (
        <span className="absolute top-3 right-3 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${available ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      {available && (
        <div className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-1">
          Acceder
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
      )}
    </div>
  );

  return available ? (
    <Link href={href}>{cardContent}</Link>
  ) : (
    <div>{cardContent}</div>
  );
}
