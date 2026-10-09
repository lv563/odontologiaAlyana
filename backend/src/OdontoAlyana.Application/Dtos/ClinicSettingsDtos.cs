namespace OdontoAlyana.Application.Dtos;

public record ClinicSettingsDto(decimal ClinicPercent, decimal RetentionPercent);

public record UpdateClinicSettingsRequest(decimal ClinicPercent, decimal RetentionPercent);
