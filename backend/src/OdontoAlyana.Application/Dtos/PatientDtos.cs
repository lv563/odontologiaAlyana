namespace OdontoAlyana.Application.Dtos;

public record PatientDto(
    Guid Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    DateTime CreatedAtUtc,
    int AppointmentsCount,
    DateOnly? NextAppointmentDate);
