export const useServices = () => {
  return {
    loading: false,
    data: [
      { name: 'Microblading HD & Sombreado', description: 'Diseño visagista pelo a pelo ultra fino con sombreado clínico personalizado.', price: '150', duration: '120', icon: 'FaEye' },
      { name: 'Nail Art Escultural Premium', description: 'Estructuras extremas en gel y acrílico con encapsulados de autor.', price: '80', duration: '90', icon: 'FaGem' },
      { name: 'Micropigmentación Labial Híbrida', description: 'Efecto acuarela permanente para revitalización y definición total de labios.', price: '200', duration: '150', icon: 'FaMagic' }
    ]
  }
}

export const useStaff = () => {
  return {
    loading: false,
    data: [
      { name: 'Elena Dimitrova', role: 'Master Artist & Directora', avatar_url: '' },
      { name: 'Carlos Rodas', role: 'Nail Tech Elite', avatar_url: '' },
      { name: 'Sofía Valenzuela', role: 'Dermo-Pigmentadora Máster', avatar_url: '' },
      { name: 'Marcus Sterling', role: 'Instructor Academia', avatar_url: '' }
    ]
  }
}

export const useTestimonials = () => {
  return {
    loading: false,
    data: [
      { name: 'Valeria M.', comment: 'Mis cejas quedaron perfectas e hiperrealistas. La mejor inversión en belleza que he hecho.', service: 'Microblading' },
      { name: 'Regina K.', comment: 'El set de uñas esculpidas aguantó intacto más de un mes de uso extremo. ¡Arte puro!', service: 'Nail Art' }
    ]
  }
}

export const useGallery = () => {
  return {
    loading: false,
    data: [{}, {}, {}, {}]
  }
}
