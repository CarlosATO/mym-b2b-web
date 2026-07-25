export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard B2B</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Clientes Pendientes', value: '12', color: 'bg-amber-100 text-amber-800' },
          { label: 'Productos Web', value: '1,245', color: 'bg-blue-100 text-blue-800' },
          { label: 'Ventas (Hoy)', value: '$0', color: 'bg-green-100 text-green-800' },
          { label: 'Errores Sincronización', value: '0', color: 'bg-slate-100 text-slate-800' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">{stat.label}</h3>
            <p className={`text-3xl font-bold inline-block px-3 py-1 rounded-md ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Actividad Reciente</h2>
        <p className="text-slate-500 text-sm">Próximamente: Registros de auditoría y accesos.</p>
      </div>
    </div>
  );
}
