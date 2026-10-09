using Microsoft.EntityFrameworkCore;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Domain.Entities;
using OdontoAlyana.Infrastructure.Persistence;

namespace OdontoAlyana.Infrastructure.Services;

/// <summary>Gestiona el horario semanal por defecto y las excepciones por fecha (habilitar/deshabilitar días),
/// y calcula los días/horarios libres disponibles para reservar.</summary>
public class ScheduleService(AppDbContext db)
{
    private const int SlotGranularityMinutes = 30;

    public async Task<List<WorkingHoursDto>> GetWorkingHoursAsync(CancellationToken ct = default) =>
        await db.WorkingHours
            .OrderBy(w => w.DayOfWeek)
            .Select(w => new WorkingHoursDto(w.DayOfWeek, w.StartTime, w.EndTime, w.IsActive))
            .ToListAsync(ct);

    public async Task SetWorkingHoursAsync(UpdateWorkingHoursRequest request, CancellationToken ct = default)
    {
        var existing = await db.WorkingHours.ToDictionaryAsync(w => w.DayOfWeek, ct);

        foreach (var day in request.Days)
        {
            if (existing.TryGetValue(day.DayOfWeek, out var row))
            {
                row.StartTime = day.StartTime;
                row.EndTime = day.EndTime;
                row.IsActive = day.IsActive;
                row.UpdatedAtUtc = DateTime.UtcNow;
            }
            else
            {
                db.WorkingHours.Add(new WorkingHours
                {
                    DayOfWeek = day.DayOfWeek,
                    StartTime = day.StartTime,
                    EndTime = day.EndTime,
                    IsActive = day.IsActive,
                });
            }
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task<List<DayOverrideDto>> GetOverridesAsync(DateOnly from, DateOnly to, CancellationToken ct = default) =>
        await db.DayOverrides
            .Where(d => d.Date >= from && d.Date <= to)
            .OrderBy(d => d.Date)
            .Select(d => new DayOverrideDto(d.Id, d.Date, d.IsOpen, d.StartTime, d.EndTime, d.Note))
            .ToListAsync(ct);

    public async Task<DayOverrideDto> UpsertOverrideAsync(UpsertDayOverrideRequest request, CancellationToken ct = default)
    {
        var entity = await db.DayOverrides.FirstOrDefaultAsync(d => d.Date == request.Date, ct);
        if (entity is null)
        {
            entity = new DayOverride { Date = request.Date };
            db.DayOverrides.Add(entity);
        }

        entity.IsOpen = request.IsOpen;
        entity.StartTime = request.StartTime;
        entity.EndTime = request.EndTime;
        entity.Note = request.Note;
        entity.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return new DayOverrideDto(entity.Id, entity.Date, entity.IsOpen, entity.StartTime, entity.EndTime, entity.Note);
    }

    public async Task<bool> DeleteOverrideAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await db.DayOverrides.FindAsync([id], ct);
        if (entity is null) return false;
        db.DayOverrides.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>Días y horarios libres para reservar un tratamiento entre dos fechas.</summary>
    public async Task<List<AvailableDayDto>> GetAvailabilityAsync(Guid treatmentId, DateOnly from, DateOnly to, CancellationToken ct = default)
    {
        var treatment = await db.Treatments.FindAsync([treatmentId], ct);
        if (treatment is null || !treatment.IsActive) return [];

        var duration = TimeSpan.FromMinutes(treatment.DurationMinutes);

        var templates = await db.WorkingHours.ToDictionaryAsync(w => w.DayOfWeek, ct);
        var overrides = await db.DayOverrides
            .Where(d => d.Date >= from && d.Date <= to)
            .ToDictionaryAsync(d => d.Date, ct);

        var busy = await db.Appointments
            .Where(a => a.Date >= from && a.Date <= to && a.Status == Domain.Enums.AppointmentStatus.Confirmed)
            .Select(a => new { a.Date, a.StartTime, a.EndTime })
            .ToListAsync(ct);

        var now = DateTime.Now;
        var result = new List<AvailableDayDto>();

        for (var date = from; date <= to; date = date.AddDays(1))
        {
            TimeOnly? windowStart, windowEnd;

            if (overrides.TryGetValue(date, out var over))
            {
                if (!over.IsOpen) continue;
                windowStart = over.StartTime ?? templates.GetValueOrDefault(date.DayOfWeek)?.StartTime;
                windowEnd = over.EndTime ?? templates.GetValueOrDefault(date.DayOfWeek)?.EndTime;
            }
            else if (templates.TryGetValue(date.DayOfWeek, out var template) && template.IsActive)
            {
                windowStart = template.StartTime;
                windowEnd = template.EndTime;
            }
            else
            {
                continue;
            }

            if (windowStart is null || windowEnd is null || windowStart >= windowEnd) continue;

            var dayBusy = busy.Where(b => b.Date == date)
                .Select(b => (b.StartTime, b.EndTime))
                .ToList();

            var slots = new List<TimeSlotDto>();
            var cursor = windowStart.Value;
            while (cursor.Add(duration) <= windowEnd.Value)
            {
                var slotStart = cursor;
                var slotEnd = cursor.Add(duration);

                var overlaps = dayBusy.Any(b => slotStart < b.EndTime && b.StartTime < slotEnd);
                var isPast = date == DateOnly.FromDateTime(now) && slotStart <= TimeOnly.FromDateTime(now);

                if (!overlaps && !isPast)
                    slots.Add(new TimeSlotDto(slotStart, slotEnd));

                cursor = cursor.AddMinutes(SlotGranularityMinutes);
            }

            if (slots.Count > 0)
                result.Add(new AvailableDayDto(date, slots));
        }

        return result;
    }
}
