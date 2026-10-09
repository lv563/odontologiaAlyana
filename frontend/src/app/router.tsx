import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../admin/layout/AdminLayout'
import { ClinicSettingsPage } from '../admin/pages/ClinicSettingsPage'
import { DashboardPage } from '../admin/pages/DashboardPage'
import { InvoicesPage } from '../admin/pages/InvoicesPage'
import { MetricsPage } from '../admin/pages/MetricsPage'
import { PatientsPage } from '../admin/pages/PatientsPage'
import { SchedulePage } from '../admin/pages/SchedulePage'
import { TreatmentsPage } from '../admin/pages/TreatmentsPage'
import { LoginPage } from '../auth/pages/LoginPage'
import { RegisterPage } from '../auth/pages/RegisterPage'
import { BookingPage } from '../booking/BookingPage'
import { LandingPage } from '../landing/LandingPage'
import { RequireRole } from '../shared/components/RequireRole'
import { UserLayout } from '../user/layout/UserLayout'
import { MyAppointmentsPage } from '../user/pages/MyAppointmentsPage'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/reservar', element: <BookingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/registro', element: <RegisterPage /> },
  {
    // Versión administrador
    element: <RequireRole role="Admin" />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <MetricsPage /> },
          { path: 'citas', element: <DashboardPage /> },
          { path: 'clientes', element: <PatientsPage /> },
          { path: 'horarios', element: <SchedulePage /> },
          { path: 'tratamientos', element: <TreatmentsPage /> },
          { path: 'facturas', element: <InvoicesPage /> },
          { path: 'configuracion', element: <ClinicSettingsPage /> },
        ],
      },
    ],
  },
  {
    // Versión usuario
    element: <RequireRole role="User" />,
    children: [
      {
        path: '/app',
        element: <UserLayout />,
        children: [{ index: true, element: <MyAppointmentsPage /> }],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
