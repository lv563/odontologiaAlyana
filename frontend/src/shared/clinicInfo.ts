/** Datos reales de la clínica/doctora, centralizados para no repetirlos por todo el código. */
export const CLINIC_INFO = {
  doctorName: 'Dra. Alyana Torres García',
  doctorBio:
    'Odontóloga general, Cirujana Bucal e Implantóloga y Docente Universitaria. Atención dental cercana y profesional en Odontología Deportiva Dominicana.',
  clinicName: 'Odontología Deportiva Dominicana',
  address: 'Calle Teodoro Chasseriau 70, El Millón, Santo Domingo, República Dominicana',
  /** Formato legible para mostrar en pantalla. */
  phoneDisplay: '+1 (809) 868-6580',
  /** Formato E.164 sin símbolos, para enlaces wa.me. */
  phoneWhatsApp: '18098686580',
  email: 'contacto@odontoalyana.com',
}

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${CLINIC_INFO.phoneWhatsApp}?text=${encodeURIComponent(message)}`
}
