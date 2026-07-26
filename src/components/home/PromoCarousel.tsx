import React from 'react';

export default function PromoCarousel() {
  const promos = [
    {
      id: 1,
      title: "Ofertas Mayoristas",
      subtitle: "Descuentos especiales por volumen este mes.",
      color: "bg-blue-600",
      icon: "🏷️"
    },
    {
      id: 2,
      title: "Línea Alimentos",
      subtitle: "Descubre las nuevas marcas premium.",
      color: "bg-amber-500",
      icon: "🍖"
    },
    {
      id: 3,
      title: "Especial Gatos",
      subtitle: "Arenas sanitarias y accesorios felinos.",
      color: "bg-teal-600",
      icon: "🐈"
    },
    {
      id: 4,
      title: "Próximamente",
      subtitle: "Pedidos 100% online integrados.",
      color: "bg-slate-700",
      icon: "💻"
    }
  ];

  return (
    <div className="bg-slate-50 border-b border-slate-200 py-6 overflow-x-auto">
      <div className="container mx-auto px-4">
        <div className="flex gap-4 min-w-max md:min-w-0 md:grid md:grid-cols-4">
          {promos.map((promo) => (
            <div 
              key={promo.id} 
              className={`${promo.color} rounded-xl p-4 text-white shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer w-64 md:w-auto`}
            >
              <div className="text-3xl bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                {promo.icon}
              </div>
              <div>
                <h3 className="font-bold text-sm">{promo.title}</h3>
                <p className="text-[11px] text-white/80 leading-tight mt-0.5">{promo.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
