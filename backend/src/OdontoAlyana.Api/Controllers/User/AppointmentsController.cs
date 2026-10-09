using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoAlyana.Api.Extensions;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Infrastructure.Services;

namespace OdontoAlyana.Api.Controllers.User;

/// <summary>Reservar y consultar las propias citas. Requiere haberse registrado e iniciado sesión.</summary>
[ApiController]
[Route("api/appointments")]
[Authorize(Policy = AuthExtensions.UserPolicy)]
public class AppointmentsController(AppointmentService appointmentService) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<IActionResult> Create(CreateAppointmentRequest request)
    {
        var result = await appointmentService.CreateAsync(CurrentUserId, request);
        return result.Succeeded ? Ok(result.Appointment) : BadRequest(new { message = result.Error });
    }

    [HttpGet("mine")]
    public async Task<IActionResult> Mine() => Ok(await appointmentService.GetMineAsync(CurrentUserId));

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var ok = await appointmentService.CancelOwnAsync(CurrentUserId, id);
        return ok ? NoContent() : NotFound();
    }
}
