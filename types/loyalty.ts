// types/loyalty.ts
export interface LoyaltySystem {
  levels: {
    BRONZE: {
      pointsNeeded: 0,
      benefits: [
        '5% de descuento',
        '1 punto por $1 gastado',
        'Welcome drink',
        'Acceso a promociones básicas'
      ],
      emoji: '🥉',
      color: '#CD7F32'
    },
    SILVER: {
      pointsNeeded: 500,
      benefits: [
        '10% de descuento',
        '1.5 puntos por $1 gastado',
        'Upgrade de servicio gratis (cada 5 visitas)',
        'Prioridad en reservas',
        'Acceso a eventos exclusivos',
        'Descuento en productos'
      ],
      emoji: '🥈',
      color: '#C0C0C0'
    },
    GOLD: {
      pointsNeeded: 1500,
      benefits: [
        '15% de descuento',
        '2 puntos por $1 gastado',
        'Servicio de cortesía en tu cumpleaños',
        'Acceso anticipado a nuevas tendencias',
        'Producto premium de regalo mensual',
        'Estilista personal asignado',
        'Invita a un amigo gratis (1 vez al mes)'
      ],
      emoji: '🥇',
      color: '#FFD700'
    },
    PLATINUM: {
      pointsNeeded: 3500,
      benefits: [
        '20% de descuento',
        '2.5 puntos por $1 gastado',
        'Servicio VIP en cabina privada',
        'Champagne durante el servicio',
        'Acceso a colecciones exclusivas',
        'Tratamientos de lujo gratis (cada 3 visitas)',
        'Prioridad absoluta en agenda',
        'Eventos privados con celebridades',
        'Productos personalizados'
      ],
      emoji: '👑',
      color: '#E5E4E2'
    },
    DIAMOND: {
      pointsNeeded: 8000,
      benefits: [
        '25% de descuento',
        '3 puntos por $1 gastado',
        'Servicio de belleza a domicilio',
        'Asesor de imagen personal',
        'Viajes a eventos de moda internacionales',
        'Colección de productos personalizada',
        'Spa day completo gratis (cada 2 meses)',
        'Acceso a lookbooks exclusivos',
        'Membresía de por vida',
        'Experiencias únicas (desfiles, fotos)'
      ],
      emoji: '💎',
      color: '#B9F2FF'
    }
  },
  
  challenges: {
    daily: [
      'Reserva tu cita antes de las 10am → +50 pts',
      'Comparte tu look en Instagram → +30 pts',
      'Deja una reseña → +20 pts'
    ],
    weekly: [
      'Visita 2 veces en la semana → +100 pts',
      'Trae a un amigo → +150 pts',
      'Gasta más de $200 → +200 pts'
    ],
    special: [
      'Cumpleaños → +300 pts',
      'Aniversario como cliente → +500 pts',
      'Recomienda a 5 amigos → +1000 pts'
    ]
  },
  
  rewards: {
    catalog: [
      { name: 'Corte gratis', points: 300 },
      { name: 'Coloración completa', points: 800 },
      { name: 'Tratamiento capilar', points: 400 },
      { name: 'Producto premium', points: 250 },
      { name: 'Sesión de fotos', points: 1200 },
      { name: 'Día de spa completo', points: 2000 }
    ]
  }
}