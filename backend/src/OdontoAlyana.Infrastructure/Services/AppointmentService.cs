using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OdontoAlyana.Application.Abstractions;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Domain.Entities;
using OdontoAlyana.Domain.Enums;
using OdontoAlyana.Infrastructure.Notifications;
using OdontoAlyana.Infrastructure.Persistence;

namespace OdontoAlyana.Infrastructure.Services;

public class AppointmentResult
{
    public bool Succeeded { get; init; }
    public string? Error { get; init; }
    public AppointmentDto? Appointment { get; init; }

    public static AppointmentResult Fail(string error) => new() { Succeeded = false, Error = error };
    public static AppointmentResult Ok(AppointmentDto dto) => new() { Succeeded = true, Appointment = dto };
}

public class AppointmentService(
    AppDbContext db,
    IEmailSender emailSender,
    IOptions<EmailOptions> emailOptions,
    ILogger<AppointmentService> logger)
{
    private readonly EmailOptions _emailOptions = emailOptions.Value;

    private static AppointmentDto ToDto(Appointment a, Treatment treatment, Identity.ApplicationUser patient) => new(
        a.Id, a.Date, a.StartTime, a.EndTime, a.Status.ToString(), a.Notes,
        treatment.Id, treatment.Name, treatment.DurationMinutes,
        patient.Id, patient.FullName, patient.Email!, patient.PhoneNumber);

    /// <summary>Aplica el join con el paciente y proyecta a DTO como último paso de la consulta:
    /// EF Core no puede traducir filtros/orden compuestos DESPUÉS de proyectar a un DTO con
    /// constructor posicional, así que todo Where/OrderBy debe ir sobre `appointments` (entidad).</summary>
    private IQueryable<AppointmentDto> ToDtoQuery(IQueryable<Appointment> appointments) =>
        from a in appointments
        join u in db.Users on a.PatientId equals u.Id
        select new AppointmentDto(
            a.Id, a.Date, a.StartTime, a.EndTime, a.Status.ToString(), a.Notes,
            a.TreatmentId, a.Treatment!.Name, a.Treatment.DurationMinutes,
            a.PatientId, u.FullName, u.Email!, u.PhoneNumber);

    public async Task<AppointmentResult> CreateAsync(Guid patientId, CreateAppointmentRequest request, CancellationToken ct = default)
    {
        var treatment = await db.Treatments.FindAsync([request.TreatmentId], ct);
        if (treatment is null || !treatment.IsActive)
            return AppointmentResult.Fail("El tratamiento no existe o ya no está disponible.");

        var endTime = request.StartTime.Add(TimeSpan.FromMinutes(treatment.DurationMinutes));

        var conflict = await db.Appointments.AnyAsync(a =>
            a.Date == request.Date &&
            a.Status == AppointmentStatus.Confirmed &&
            request.StartTime < a.EndTime && a.StartTime < endTime, ct);

        if (conflict)
            return AppointmentResult.Fail("Ese horario ya no está disponible, elige otro.");

        var appointment = new Appointment
        {
            PatientId = patientId,
            TreatmentId = treatment.Id,
            Date = request.Date,
            StartTime = request.StartTime,
            EndTime = endTime,
            Status = AppointmentStatus.Confirmed,
            Notes = request.Notes,
        };
        db.Appointments.Add(appointment);
        await db.SaveChangesAsync(ct);

        var patient = await db.Users.FindAsync([patientId], ct);
        if (patient is null) return AppointmentResult.Fail("Paciente no encontrado.");

        await NotifyNewAppointmentAsync(patient, treatment, appointment, ct);

        return AppointmentResult.Ok(ToDto(appointment, treatment, patient));
    }

    /// <summary>La cita ya quedó guardada en la base de datos antes de llamar esto: un fallo de
    /// correo (ej. restricción de sandbox del proveedor de email) no debe tumbar la reserva.</summary>
    private async Task NotifyNewAppointmentAsync(Identity.ApplicationUser patient, Treatment treatment, Appointment appointment, CancellationToken ct)
    {
        var when = $"{appointment.Date:dddd dd/MM/yyyy} a las {appointment.StartTime:hh\\:mm}";

        try
        {
            await emailSender.SendAsync(
                patient.Email!,
                "Confirmación de tu cita - Odonto Alyana",
                $"<p>Hola {patient.FullName},</p><p>Tu cita para <strong>{treatment.Name}</strong> quedó agendada para el {when}.</p><p>Te esperamos.</p>",
                ct: ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "No se pudo enviar el correo de confirmación al paciente {PatientId}", patient.Id);
        }

        if (!string.IsNullOrWhiteSpace(_emailOptions.AdminEmail))
        {
            try
            {
                await emailSender.SendAsync(
                    _emailOptions.AdminEmail,
                    "Nueva cita reservada",
                    $"<p>{patient.FullName} ({patient.Email}, {patient.PhoneNumber}) reservó <strong>{treatment.Name}</strong> el {when}.</p>",
                    ct: ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "No se pudo enviar el aviso de nueva cita al admin para la cita {AppointmentId}", appointment.Id);
            }
        }
    }

    public Task<List<AppointmentDto>> GetMineAsync(Guid patientId, CancellationToken ct = default)
    {
        var query = db.Appointments
            .Where(a => a.PatientId == patientId)
            .OrderByDescending(a => a.Date)
            .ThenBy(a => a.StartTime);

        return ToDtoQuery(query).ToListAsync(ct);
    }

    public async Task<bool> CancelOwnAsync(Guid patientId, Guid appointmentId, CancellationToken ct = default)
    {
        var appointment = await db.Appointments.FirstOrDefaultAsync(a => a.Id == appointmentId && a.PatientId == patientId, ct);
        if (appointment is null) return false;

        appointment.Status = AppointmentStatus.Cancelled;
        appointment.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public Task<List<AppointmentDto>> GetAllAsync(DateOnly? from, DateOnly? to, AppointmentStatus? status, Guid? patientId = null, CancellationToken ct = default)
    {
        IQueryable<Appointment> query = db.Appointments;
        if (from is not null) query = query.Where(a => a.Date >= from);
        if (to is not null) query = query.Where(a => a.Date <= to);
        if (status is not null) query = query.Where(a => a.Status == status.Value);
        if (patientId is not null) query = query.Where(a => a.PatientId == patientId);
        query = query.OrderBy(a => a.Date).ThenBy(a => a.StartTime);

        return ToDtoQuery(query).ToListAsync(ct);
    }

    public async Task<bool> UpdateStatusAsync(Guid appointmentId, AppointmentStatus status, CancellationToken ct = default)
    {
        var appointment = await db.Appointments.FindAsync([appointmentId], ct);
        if (appointment is null) return false;

        appointment.Status = status;
        appointment.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>Envía (o reenvía) el recordatorio por correo de una cita puntual. Usado por el job
    /// automático y por el botón "enviar recordatorio ahora" del admin.</summary>
    public async Task<bool> SendReminderAsync(Guid appointmentId, CancellationToken ct = default)
    {
        var appointment = await db.Appointments.Include(a => a.Treatment).FirstOrDefaultAsync(a => a.Id == appointmentId, ct);
        if (appointment is null) return false;

        var patient = await db.Users.FindAsync([appointment.PatientId], ct);
        if (patient is null || string.IsNullOrWhiteSpace(patient.Email)) return false;

        var when = $"{appointment.Date:dddd dd/MM/yyyy} a las {appointment.StartTime:hh\\:mm}";

        await emailSender.SendAsync(
            patient.Email!,
            "Recordatorio de tu próxima cita - Odonto Alyana",
            $"<p>Hola {patient.FullName},</p><p>Te recordamos tu próxima cita: <strong>{appointment.Treatment?.Name}</strong> el {when}.</p><p>¡Te esperamos!</p>",
            ct: ct);

        appointment.ReminderSentAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }
}
