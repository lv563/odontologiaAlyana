import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../shared/api/client'
import { PublicHeader } from '../shared/components/PublicHeader'
import { TreatmentIcon } from '../shared/treatmentIcon'
import { CLINIC_INFO } from '../shared/clinicInfo'

// Three.js es pesado: se separa del bundle principal y solo se carga en esta página.
const Tooth3D = lazy(() => import('./Tooth3D').then((m) => ({ default: m.Tooth3D })))
import {
  IconCalendarCheck,
  IconClipboardCheck,
  IconLock,
  IconMail,
  IconMapPin,
  IconPhone,
  IconShieldCheck,
  IconSparkles,
} from '../shared/icons'
import type { TreatmentDto } from '../shared/api/types'

export function LandingPage() {
  const [treatments, setTreatments] = useState<TreatmentDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<TreatmentDto[]>('/api/treatments')
      .then(setTreatments)
      .catch(() => setTreatments([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-public">
      <PublicHeader />

      <section className="hero">
        <div className="hero-text">
          <span className="hero-badge">
            <IconSparkles /> Citas en línea, las 24 horas
          </span>
          <h1>Tu sonrisa, en las mejores manos</h1>
          <p>
            Agenda tu cita en minutos: elige el tratamiento, mira los horarios realmente disponibles
            y confirma. Te avisamos por correo y te recordamos antes de tu cita.
          </p>
          <div className="hero-actions">
            <Link to="/reservar" className="btn btn-primary btn-lg">
              Reservar cita →
            </Link>
            <a href="#tratamientos" className="btn btn-ghost btn-lg">
              Ver tratamientos
            </a>
          </div>
          <div className="hero-trust">
            <span>
              <IconLock /> Reserva segura
            </span>
            <span>
              <IconMail /> Confirmación al instante
            </span>
            <span>
              <IconCalendarCheck /> Recordatorio automático
            </span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-blob hero-blob-1" aria-hidden="true" />
          <div className="hero-blob hero-blob-2" aria-hidden="true" />
          <div className="hero-tooth-ring" aria-hidden="true" />
          <div className="hero-tooth-canvas">
            <Suspense fallback={<div className="hero-tooth-fallback" aria-hidden="true" />}>
              <Tooth3D />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="features-bar">
        <div className="features-bar-inner">
          <div className="feature-bar-item">
            <IconCalendarCheck /> Agenda en línea 24/7
          </div>
          <div className="feature-bar-item">
            <IconMail /> Confirmación por correo
          </div>
          <div className="feature-bar-item">
            <IconClipboardCheck /> Recordatorio antes de tu cita
          </div>
          <div className="feature-bar-item">
            <IconShieldCheck /> Tus datos protegidos
          </div>
        </div>
      </section>

      <section id="tratamientos" className="section">
        <div className="section-heading center">
          <span className="eyebrow">Tratamientos</span>
          <h2>Todo lo que tu sonrisa necesita</h2>
          <p className="muted">Elige el procedimiento y reserva tu horario al instante.</p>
        </div>
        {loading && <p className="muted center-text">Cargando tratamientos…</p>}
        {!loading && treatments.length === 0 && <p className="muted center-text">Pronto publicaremos el catálogo.</p>}
        <div className="cards-grid">
          {treatments.map((t) => (
            <div className="card treatment-card" key={t.id}>
              <div className="treatment-card-icon">
                <TreatmentIcon name={t.name} />
              </div>
              <h3>{t.name}</h3>
              {t.description && <p className="muted">{t.description}</p>}
              <div className="card-meta">
                <span className="pill">⏱ {t.durationMinutes} min</span>
              </div>
              <Link to="/reservar" className="btn btn-outline btn-sm">
                Reservar →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-heading center">
          <span className="eyebrow">Por qué elegirnos</span>
          <h2>Atención pensada en ti</h2>
        </div>
        <div className="why-grid">
          <div className="why-card">
            <div className="why-card-icon">
              <IconClipboardCheck />
            </div>
            <h3>Historial siempre a la mano</h3>
            <p className="muted">Consulta tus citas pasadas y próximas desde tu cuenta, cuando quieras.</p>
          </div>
          <div className="why-card">
            <div className="why-card-icon">
              <IconCalendarCheck />
            </div>
            <h3>Disponibilidad real</h3>
            <p className="muted">Solo verás horarios realmente libres: nada de sorpresas al confirmar.</p>
          </div>
          <div className="why-card">
            <div className="why-card-icon">
              <IconMail />
            </div>
            <h3>Siempre informado</h3>
            <p className="muted">Confirmación inmediata y recordatorio automático por correo.</p>
          </div>
          <div className="why-card">
            <div className="why-card-icon">
              <IconShieldCheck />
            </div>
            <h3>Datos protegidos</h3>
            <p className="muted">Tu información se maneja de forma segura y confidencial.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading center">
          <span className="eyebrow">¿Cómo funciona?</span>
          <h2>Reserva en 4 pasos</h2>
        </div>
        <div className="steps-grid">
          <div className="step">
            <span className="step-number">1</span>
            <h3>Elige tu tratamiento</h3>
            <p className="muted">Selecciona el procedimiento que necesitas.</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <h3>Escoge día y hora</h3>
            <p className="muted">Solo verás horarios realmente disponibles.</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <h3>Crea tu cuenta</h3>
            <p className="muted">Regístrate rápido para confirmar tu cita.</p>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <h3>Recibe recordatorios</h3>
            <p className="muted">Te confirmamos por correo y te recordamos antes de tu cita.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="doctor-card">
          <img src="/dra-alyana.png" alt={CLINIC_INFO.doctorName} className="doctor-photo" />
          <div>
            <span className="eyebrow">Tu odontóloga</span>
            <h2>{CLINIC_INFO.doctorName}</h2>
            <p className="muted">{CLINIC_INFO.doctorBio}</p>
            <p className="doctor-location">
              <IconMapPin /> {CLINIC_INFO.clinicName} · {CLINIC_INFO.address}
            </p>
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="cta-card">
          <h2>¿Lista o listo para tu próxima cita?</h2>
          <p className="muted">Elige tu horario ideal en menos de dos minutos.</p>
          <Link to="/reservar" className="btn btn-primary btn-lg">
            Reservar cita ahora →
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="brand brand-on-dark">
              Odonto <span>Alyana</span>
            </Link>
            <p className="muted">Cuidado dental moderno, con reservas en línea y seguimiento por correo.</p>
          </div>
          <div className="footer-col">
            <h4>Enlaces</h4>
            <Link to="/#tratamientos">Tratamientos</Link>
            <Link to="/reservar">Reservar cita</Link>
            <Link to="/login">Iniciar sesión</Link>
          </div>
          <div className="footer-col">
            <h4>Contacto</h4>
            <span>
              <IconMapPin /> {CLINIC_INFO.address}
            </span>
            <span>
              <IconPhone /> {CLINIC_INFO.phoneDisplay}
            </span>
            <span>
              <IconMail /> {CLINIC_INFO.email}
            </span>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} Odonto Alyana · Cuidando tu sonrisa</div>
      </footer>
    </div>
  )
}
