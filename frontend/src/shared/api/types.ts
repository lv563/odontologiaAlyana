export interface TreatmentDto {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: number | null
  isActive: boolean
}

export interface TimeSlotDto {
  startTime: string
  endTime: string
}

export interface AvailableDayDto {
  date: string
  slots: TimeSlotDto[]
}

export type AppointmentStatus = 'Confirmed' | 'Cancelled' | 'Completed' | 'NoShow'

export interface AppointmentDto {
  id: string
  date: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  notes: string | null
  treatmentId: string
  treatmentName: string
  durationMinutes: number
  patientId: string
  patientName: string
  patientEmail: string
  patientPhone: string | null
}

export interface WorkingHoursDto {
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

export interface DayOverrideDto {
  id: string
  date: string
  isOpen: boolean
  startTime: string | null
  endTime: string | null
  note: string | null
}

export interface PatientDto {
  id: string
  fullName: string
  email: string
  phoneNumber: string | null
  createdAtUtc: string
  appointmentsCount: number
  nextAppointmentDate: string | null
}

export interface InvoiceDto {
  id: string
  patientId: string
  appointmentId: string
  treatmentName: string
  amount: number
  issuedAtUtc: string
  sentAtUtc: string | null
}

export interface InvoiceWithPatientDto extends InvoiceDto {
  patientName: string
  patientEmail: string
}

export interface ClinicSettingsDto {
  clinicPercent: number
  retentionPercent: number
}

export type StatsGranularity = 'Day' | 'Week' | 'Month' | 'Year'

export interface StatsPeriodDto {
  period: string
  periodStart: string
  completedCount: number
  revenue: number
}

export interface StatsByTreatmentDto {
  treatmentId: string
  treatmentName: string
  completedCount: number
  revenue: number
}

export interface StatsSummaryDto {
  totalCompleted: number
  totalRevenue: number
  totalPatientsAttended: number
  series: StatsPeriodDto[]
  byTreatment: StatsByTreatmentDto[]
  clinicPercent: number
  retentionPercent: number
  clinicCut: number
  retentionAmount: number
  netRevenue: number
}

export interface AuthResponse {
  token: string
  expiresAtUtc: string
  fullName: string
  email: string
  role: 'Admin' | 'User'
}
