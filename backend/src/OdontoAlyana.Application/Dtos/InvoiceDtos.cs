namespace OdontoAlyana.Application.Dtos;

public record InvoiceDto(
    Guid Id,
    Guid PatientId,
    Guid AppointmentId,
    string TreatmentName,
    decimal Amount,
    DateTime IssuedAtUtc,
    DateTime? SentAtUtc);

public record CreateInvoiceRequest(decimal? Amount);

/// <summary>Para el registro global de facturas (todas las de todos los clientes, con nombre).</summary>
public record InvoiceWithPatientDto(
    Guid Id,
    Guid PatientId,
    string PatientName,
    string PatientEmail,
    Guid AppointmentId,
    string TreatmentName,
    decimal Amount,
    DateTime IssuedAtUtc,
    DateTime? SentAtUtc);
