using Microsoft.AspNetCore.Mvc;
using OdontoAlyana.Infrastructure.Services;

namespace OdontoAlyana.Api.Controllers.Public;

/// <summary>Días y horarios libres, visibles sin iniciar sesión (solo al reservar se exige cuenta).</summary>
[ApiController]
[Route("api/availability")]
public class AvailabilityController(ScheduleService scheduleService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid treatmentId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var start = from ?? DateOnly.FromDateTime(DateTime.Now);
        var end = to ?? start.AddDays(21);
        if (end < start || end > start.AddDays(60))
            return BadRequest(new { message = "Rango de fechas inválido (máximo 60 días)." });

        return Ok(await scheduleService.GetAvailabilityAsync(treatmentId, start, end));
    }
}
