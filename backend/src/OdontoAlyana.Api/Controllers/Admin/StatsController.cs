using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoAlyana.Api.Extensions;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Infrastructure.Services;

namespace OdontoAlyana.Api.Controllers.Admin;

/// <summary>Métricas de citas atendidas y ganancias para el dashboard de la administradora.</summary>
[ApiController]
[Route("api/admin/stats")]
[Authorize(Policy = AuthExtensions.AdminPolicy)]
public class StatsController(StatsService statsService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetSummary(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        [FromQuery] StatsGranularity granularity = StatsGranularity.Month)
    {
        if (to < from)
            return BadRequest(new { message = "El rango de fechas es inválido." });

        var totalDays = to.DayNumber - from.DayNumber;
        if (totalDays > 3660)
            return BadRequest(new { message = "El rango no puede superar los 10 años." });
        if (granularity == StatsGranularity.Day && totalDays > 366)
            return BadRequest(new { message = "Para ver por día, el rango no puede superar un año." });

        return Ok(await statsService.GetSummaryAsync(from, to, granularity));
    }
}
