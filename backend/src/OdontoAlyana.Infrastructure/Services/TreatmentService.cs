using Microsoft.EntityFrameworkCore;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Domain.Entities;
using OdontoAlyana.Infrastructure.Persistence;

namespace OdontoAlyana.Infrastructure.Services;

public class TreatmentService(AppDbContext db)
{
    private static TreatmentDto ToDto(Treatment t) => new(t.Id, t.Name, t.Description, t.DurationMinutes, t.Price, t.IsActive);

    public async Task<List<TreatmentDto>> GetActiveAsync(CancellationToken ct = default) =>
        await db.Treatments.Where(t => t.IsActive).OrderBy(t => t.Name).Select(t => new TreatmentDto(
            t.Id, t.Name, t.Description, t.DurationMinutes, t.Price, t.IsActive)).ToListAsync(ct);

    public async Task<List<TreatmentDto>> GetAllAsync(CancellationToken ct = default) =>
        await db.Treatments.OrderBy(t => t.Name).Select(t => new TreatmentDto(
            t.Id, t.Name, t.Description, t.DurationMinutes, t.Price, t.IsActive)).ToListAsync(ct);

    public async Task<TreatmentDto> CreateAsync(UpsertTreatmentRequest request, CancellationToken ct = default)
    {
        var treatment = new Treatment
        {
            Name = request.Name,
            Description = request.Description,
            DurationMinutes = request.DurationMinutes,
            Price = request.Price,
            IsActive = request.IsActive,
        };
        db.Treatments.Add(treatment);
        await db.SaveChangesAsync(ct);
        return ToDto(treatment);
    }

    public async Task<TreatmentDto?> UpdateAsync(Guid id, UpsertTreatmentRequest request, CancellationToken ct = default)
    {
        var treatment = await db.Treatments.FindAsync([id], ct);
        if (treatment is null) return null;

        treatment.Name = request.Name;
        treatment.Description = request.Description;
        treatment.DurationMinutes = request.DurationMinutes;
        treatment.Price = request.Price;
        treatment.IsActive = request.IsActive;
        treatment.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return ToDto(treatment);
    }

    /// <summary>Baja lógica: nunca se borra un tratamiento que ya tenga citas asociadas.</summary>
    public async Task<bool> DeactivateAsync(Guid id, CancellationToken ct = default)
    {
        var treatment = await db.Treatments.FindAsync([id], ct);
        if (treatment is null) return false;

        treatment.IsActive = false;
        treatment.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }
}
