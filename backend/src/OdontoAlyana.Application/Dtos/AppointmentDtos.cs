namespace OdontoAlyana.Application.Dtos;

public record TimeSlotDto(TimeOnly StartTime, TimeOnly EndTime);

public record AvailableDayDto(DateOnly Date, List<TimeSlotDto> Slots);

public record CreateAppointmentRequest(Guid TreatmentId, DateOnly Date, TimeOnly StartTime, string? Notes);

public record AppointmentDto(
    Guid Id,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string Status,
    string? Notes,
    Guid TreatmentId,
    string TreatmentName,
    int DurationMinutes,
    Guid PatientId,
    string PatientName,
    string PatientEmail,
    string? PatientPhone);

public record UpdateAppointmentStatusRequest(string Status);
