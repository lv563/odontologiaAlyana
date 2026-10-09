using System.Globalization;
using Microsoft.EntityFrameworkCore;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Domain.Enums;
using OdontoAlyana.Infrastructure.Persistence;

namespace OdontoAlyana.Infrastructure.Services;

/// <summary>Métricas de citas atendidas (completadas) y lo ganado, agrupado por día/semana/mes/año
/// y por tratamiento, para el panel de la administradora.</summary>
public class StatsService(AppDbContext db, ClinicSettingsService clinicSettingsService)
{
    public async Task<StatsSummaryDto> GetSummaryAsync(DateOnly from, DateOnly to, StatsGranularity granularity, CancellationToken ct = default)
    {
        var rows = await db.Appointments
            .Where(a => a.Status == AppointmentStatus.Completed && a.Date >= from && a.Date <= to)
            .Select(a => new { a.Date, a.PatientId, a.TreatmentId, TreatmentName = a.Treatment!.Name, Price = a.Treatment.Price })
            .ToListAsync(ct);

        var totalRevenue = rows.Sum(r => r.Price ?? 0m);
        var totalPatients = rows.Select(r => r.PatientId).Distinct().Count();

        var byBucket = rows
            .GroupBy(r => BucketStart(r.Date, granularity))
            .ToDictionary(g => g.Key, g => (Count: g.Count(), Revenue: g.Sum(r => r.Price ?? 0m)));

        var series = new List<StatsPeriodDto>();
        for (var bucket = BucketStart(from, granularity); bucket <= to; bucket = NextBucket(bucket, granularity))
        {
            var (count, revenue) = byBucket.GetValueOrDefault(bucket, (0, 0m));
            series.Add(new StatsPeriodDto(Label(bucket, granularity), bucket, count, revenue));
        }

        var byTreatment = rows
            .GroupBy(r => new { r.TreatmentId, r.TreatmentName })
            .Select(g => new StatsByTreatmentDto(g.Key.TreatmentId, g.Key.TreatmentName, g.Count(), g.Sum(r => r.Price ?? 0m)))
            .OrderByDescending(x => x.Revenue)
            .ToList();

        // Bruto -> lo que se queda la clínica -> sobre el resto, la retención -> lo neto para la odontóloga.
        var settings = await clinicSettingsService.GetOrCreateAsync(ct);
        var clinicCut = Math.Round(totalRevenue * settings.ClinicPercent / 100m, 2);
        var doctorShare = totalRevenue - clinicCut;
        var retentionAmount = Math.Round(doctorShare * settings.RetentionPercent / 100m, 2);
        var netRevenue = doctorShare - retentionAmount;

        return new StatsSummaryDto(
            rows.Count, totalRevenue, totalPatients, series, byTreatment,
            settings.ClinicPercent, settings.RetentionPercent, clinicCut, retentionAmount, netRevenue);
    }

    private static DateOnly BucketStart(DateOnly date, StatsGranularity granularity) => granularity switch
    {
        StatsGranularity.Day => date,
        StatsGranularity.Week => date.AddDays(-((7 + (int)date.DayOfWeek - 1) % 7)),
        StatsGranularity.Month => new DateOnly(date.Year, date.Month, 1),
        StatsGranularity.Year => new DateOnly(date.Year, 1, 1),
        _ => date,
    };

    private static DateOnly NextBucket(DateOnly bucket, StatsGranularity granularity) => granularity switch
    {
        StatsGranularity.Day => bucket.AddDays(1),
        StatsGranularity.Week => bucket.AddDays(7),
        StatsGranularity.Month => bucket.AddMonths(1),
        StatsGranularity.Year => bucket.AddYears(1),
        _ => bucket.AddDays(1),
    };

    private static string Label(DateOnly bucket, StatsGranularity granularity) => granularity switch
    {
        StatsGranularity.Day => bucket.ToString("dd/MM"),
        StatsGranularity.Week => $"Sem. {bucket:dd/MM}",
        StatsGranularity.Month => CultureInfo.GetCultureInfo("es-ES").TextInfo.ToTitleCase(bucket.ToString("MMM yyyy", CultureInfo.GetCultureInfo("es-ES"))),
        StatsGranularity.Year => bucket.ToString("yyyy"),
        _ => bucket.ToString("dd/MM"),
    };
}
