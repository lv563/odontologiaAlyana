namespace OdontoAlyana.Application.Dtos;

public record WorkingHoursDto(DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime, bool IsActive);

public record UpdateWorkingHoursRequest(List<WorkingHoursDto> Days);

public record DayOverrideDto(Guid Id, DateOnly Date, bool IsOpen, TimeOnly? StartTime, TimeOnly? EndTime, string? Note);

public record UpsertDayOverrideRequest(DateOnly Date, bool IsOpen, TimeOnly? StartTime, TimeOnly? EndTime, string? Note);
