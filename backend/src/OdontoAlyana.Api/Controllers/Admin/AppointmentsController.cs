using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoAlyana.Api.Extensions;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Domain.Enums;
using OdontoAlyana.Infrastructure.Services;

namespace OdontoAlyana.Api.Controllers.Admin;

/// <summary>Vista de la administradora sobre todas las citas de la clínica.</summary>
[ApiController]
[Route("api/admin/appointments")]
[Authorize(Policy = AuthExtensions.AdminPolicy)]
public class AppointmentsController(AppointmentService appointmentService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] AppointmentStatus? status) =>
        Ok(await appointmentService.GetAllAsync(from, to, status));

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, UpdateAppointmentStatusRequest request)
    {
        if (!Enum.TryParse<AppointmentStatus>(request.Status, true, out var status))
            return BadRequest(new { message = "Estado inválido." });

        var ok = await appointmentService.UpdateStatusAsync(id, status);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/send-reminder")]
    public async Task<IActionResult> SendReminder(Guid id)
    {
        var ok = await appointmentService.SendReminderAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
