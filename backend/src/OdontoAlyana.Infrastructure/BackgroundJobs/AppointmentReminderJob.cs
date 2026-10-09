using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OdontoAlyana.Domain.Enums;
using OdontoAlyana.Infrastructure.Notifications;
using OdontoAlyana.Infrastructure.Persistence;
using OdontoAlyana.Infrastructure.Services;

namespace OdontoAlyana.Infrastructure.BackgroundJobs;

/// <summary>Revisa periódicamente qué citas confirmadas caen dentro de N días (Reminder:DaysBefore)
/// y a las que todavía no se les envió recordatorio, y les manda el aviso por correo.</summary>
public class AppointmentReminderJob(
    IServiceScopeFactory scopeFactory,
    IOptions<ReminderOptions> options,
    ILogger<AppointmentReminderJob> logger) : BackgroundService
{
    private readonly ReminderOptions _options = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromHours(Math.Max(1, _options.CheckIntervalHours));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunOnceAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error revisando recordatorios de citas");
            }

            await Task.Delay(interval, stoppingToken);
        }
    }

    private async Task RunOnceAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var appointmentService = scope.ServiceProvider.GetRequiredService<AppointmentService>();

        var targetDate = DateOnly.FromDateTime(DateTime.Now.AddDays(_options.DaysBefore));

        var pending = await db.Appointments
            .Where(a => a.Date == targetDate
                        && a.Status == AppointmentStatus.Confirmed
                        && a.ReminderSentAtUtc == null)
            .Select(a => a.Id)
            .ToListAsync(ct);

        foreach (var id in pending)
            await appointmentService.SendReminderAsync(id, ct);

        if (pending.Count > 0)
            logger.LogInformation("Recordatorios por correo enviados: {Count}", pending.Count);
    }
}
