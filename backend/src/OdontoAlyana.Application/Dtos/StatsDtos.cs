namespace OdontoAlyana.Application.Dtos;

public enum StatsGranularity { Day, Week, Month, Year }

public record StatsPeriodDto(string Period, DateOnly PeriodStart, int CompletedCount, decimal Revenue);

public record StatsByTreatmentDto(Guid TreatmentId, string TreatmentName, int CompletedCount, decimal Revenue);

public record StatsSummaryDto(
    int TotalCompleted,
    decimal TotalRevenue,
    int TotalPatientsAttended,
    List<StatsPeriodDto> Series,
    List<StatsByTreatmentDto> ByTreatment,
    decimal ClinicPercent,
    decimal RetentionPercent,
    decimal ClinicCut,
    decimal RetentionAmount,
    decimal NetRevenue);
