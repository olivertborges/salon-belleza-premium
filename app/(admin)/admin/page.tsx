'use client'

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light text-stone-900 tracking-tight">
          Dashboard
        </h1>
        <span className="text-sm text-stone-400 font-light">Admin</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Citas hoy', value: '8', change: '+2' },
          { label: 'Clientes nuevos', value: '12', change: '+5' },
          { label: 'Ingresos', value: '$450', change: '+12%' },
          { label: 'Tasa ocupación', value: '78%', change: '-3%' },
        ].map((stat, idx) => (
          <div key={idx} className="border border-stone-200 rounded-xl p-5 bg-white/50">
            <p className="text-sm text-stone-400 font-light">{stat.label}</p>
            <p className="text-2xl font-light text-stone-900 mt-1">{stat.value}</p>
            <p className={`text-sm font-light ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-400'}`}>
              {stat.change} vs ayer
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-stone-200 rounded-xl p-6 bg-white/50">
          <h2 className="text-lg font-light text-stone-900 mb-4">Próximas citas</h2>
          <div className="space-y-3">
            {[
              { client: 'Marta F.', time: '10:00', service: 'Microblading' },
              { client: 'Carlos R.', time: '11:30', service: 'Uñas Acrílicas' },
              { client: 'Ana T.', time: '13:00', service: 'Powder Brows' },
            ].map((appt, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <div>
                  <p className="text-sm font-light text-stone-900">{appt.client}</p>
                  <p className="text-xs text-stone-400 font-light">{appt.service}</p>
                </div>
                <span className="text-sm font-light text-stone-500">{appt.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-stone-200 rounded-xl p-6 bg-white/50">
          <h2 className="text-lg font-light text-stone-900 mb-4">Servicios más populares</h2>
          <div className="space-y-3">
            {[
              { name: 'Microblading', count: 45, percentage: 80 },
              { name: 'Uñas Acrílicas', count: 32, percentage: 57 },
              { name: 'Powder Brows', count: 28, percentage: 50 },
            ].map((svc, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-light text-stone-700">{svc.name}</span>
                  <span className="text-stone-400 font-light">{svc.count}</span>
                </div>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-stone-300 rounded-full"
                    style={{ width: `${svc.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
