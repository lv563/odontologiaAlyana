using OdontoAlyana.Domain.Common;

namespace OdontoAlyana.Domain.Entities;

/// <summary>Factura emitida por un procedimiento/cita, enviada por correo al paciente.</summary>
public class Invoice : BaseEntity
{
    public Guid PatientId { get; set; }
    public Guid AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    /// <summary>Copia del nombre del tratamiento al momento de facturar (no cambia si luego se edita el catálogo).</summary>
    public string TreatmentName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime? SentAtUtc { get; set; }
}
