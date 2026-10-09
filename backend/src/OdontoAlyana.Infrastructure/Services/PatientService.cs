using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Domain.Constants;
using OdontoAlyana.Domain.Enums;
using OdontoAlyana.Infrastructure.Identity;
using OdontoAlyana.Infrastructure.Persistence;

namespace OdontoAlyana.Infrastructure.Services;

/// <summary>Lista de pacientes registrados (rol User), para que la administradora vea quién se
/// ha registrado y cuántas citas tiene, sin exponer la cuenta admin en el listado.</summary>
public class PatientService(UserManager<ApplicationUser> userManager, AppDbContext db)
{
    public async Task<List<PatientDto>> GetAllAsync(CancellationToken ct = default)
    {
        var patients = await userManager.GetUsersInRoleAsync(AppRoles.User);
        var ids = patients.Select(p => p.Id).ToList();

        var totalCounts = await db.Appointments
            .Where(a => ids.Contains(a.PatientId))
            .GroupBy(a => a.PatientId)
            .Select(g => new { PatientId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.PatientId, g => g.Count, ct);

        var today = DateOnly.FromDateTime(DateTime.Now);
        var nextAppointments = await db.Appointments
            .Where(a => ids.Contains(a.PatientId) && a.Status == AppointmentStatus.Confirmed && a.Date >= today)
            .GroupBy(a => a.PatientId)
            .Select(g => new { PatientId = g.Key, NextDate = g.Min(a => a.Date) })
            .ToDictionaryAsync(g => g.PatientId, g => g.NextDate, ct);

        return patients
            .OrderBy(p => p.FullName)
            .Select(p => new PatientDto(
                p.Id,
                p.FullName,
                p.Email!,
                p.PhoneNumber,
                p.CreatedAtUtc,
                totalCounts.GetValueOrDefault(p.Id),
                nextAppointments.TryGetValue(p.Id, out var next) ? next : null))
            .ToList();
    }
}
