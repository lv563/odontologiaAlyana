namespace OdontoAlyana.Application.Dtos;

public record TreatmentDto(Guid Id, string Name, string? Description, int DurationMinutes, decimal? Price, bool IsActive);

public record UpsertTreatmentRequest(string Name, string? Description, int DurationMinutes, decimal? Price, bool IsActive);
