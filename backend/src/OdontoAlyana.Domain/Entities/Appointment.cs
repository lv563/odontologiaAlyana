using OdontoAlyana.Domain.Common;
using OdontoAlyana.Domain.Enums;

namespace OdontoAlyana.Domain.Entities;

/// <summary>Cita reservada por un paciente para un tratamiento en una fecha/hora concreta.</summary>
public class Appointment : BaseEntity
{
    public Guid PatientId { get; set; }
    public Guid TreatmentId { get; set; }
    public Treatment? Treatment { get; set; }

    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Confirmed;
    public string? Notes { get; set; }

    /// <summary>Marca de cuándo se envió el recordatorio por WhatsApp (null = aún no enviado).</summary>
    public DateTime? ReminderSentAtUtc { get; set; }
}
