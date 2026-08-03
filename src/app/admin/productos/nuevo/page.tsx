import Link from 'next/link';

export const metadata = {
  title: 'Nuevo Producto | Admin',
};

export default function NewAdminProductPage() {
  return (
    <div className="max-w-3xl mx-auto mt-12">
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Creación manual deshabilitada</h2>
        <p className="text-slate-600 mb-8 max-w-lg mx-auto">
          La creación manual de productos está deshabilitada. Los productos se importarán desde Bsale en una fase posterior para garantizar la integridad del inventario.
        </p>
        <Link 
          href="/admin/productos"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
        >
          Volver a Productos
        </Link>
      </div>
    </div>
  );
}
