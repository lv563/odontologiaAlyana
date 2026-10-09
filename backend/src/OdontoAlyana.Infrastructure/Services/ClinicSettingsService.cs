using Microsoft.EntityFrameworkCore;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Domain.Entities;
using OdontoAlyana.Infrastructure.Persistence;

namespace OdontoAlyana.Infrastructure.Services;

/// <summary>Configuración financiera (fila única): % de la clínica y % de retención, con los
/// que el dashboard calcula lo bruto vs. lo neto que le queda a la odontóloga.</summary>
public class ClinicSettingsService(AppDbContext db)
{
    public async Task<ClinicSettings> GetOrCreateAsync(CancellationToken ct = default)
    {
        var settings = await db.ClinicSettings.FirstOrDefaultAsync(ct);
        if (settings is not null) return settings;

        settings = new ClinicSettings();
        db.ClinicSettings.Add(settings);
        await db.SaveChangesAsync(ct);
        return settings;
    }

    public async Task<ClinicSettingsDto> GetAsync(CancellationToken ct = default)
    {
        var s = await GetOrCreateAsync(ct);
        return new ClinicSettingsDto(s.ClinicPercent, s.RetentionPercent);
    }

    public async Task<ClinicSettingsDto> UpdateAsync(UpdateClinicSettingsRequest request, CancellationToken ct = default)
    {
        var s = await GetOrCreateAsync(ct);
        s.ClinicPercent = Math.Clamp(request.ClinicPercent, 0, 100);
        s.RetentionPercent = Math.Clamp(request.RetentionPercent, 0, 100);
        s.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return new ClinicSettingsDto(s.ClinicPercent, s.RetentionPercent);
    }
}
