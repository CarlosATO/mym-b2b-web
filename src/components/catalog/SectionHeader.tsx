interface SectionHeaderProps {
  label?: string;
  title: string;
  description?: string;
  centered?: boolean;
}

export default function SectionHeader({ label, title, description, centered = false }: SectionHeaderProps) {
  return (
    <div className={centered ? 'text-center' : ''}>
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2 block">
          {label}
        </span>
      )}
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-slate-500 max-w-2xl text-sm md:text-base leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
