using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoAlyana.Api.Extensions;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Infrastructure.Services;

namespace OdontoAlyana.Api.Controllers.Admin;

/// <summary>La administradora habilita/deshabilita días y define el horario semanal.</summary>
[ApiController]
[Route("api/admin/schedule")]
[Authorize(Policy = AuthExtensions.AdminPolicy)]
public class ScheduleController(ScheduleService scheduleService) : ControllerBase
{
    [HttpGet("working-hours")]
    public async Task<IActionResult> GetWorkingHours() => Ok(await scheduleService.GetWorkingHoursAsync());

    [HttpPut("working-hours")]
    public async Task<IActionResult> SetWorkingHours(UpdateWorkingHoursRequest request)
    {
        await scheduleService.SetWorkingHoursAsync(request);
        return NoContent();
    }

    [HttpGet("overrides")]
    public async Task<IActionResult> GetOverrides([FromQuery] DateOnly from, [FromQuery] DateOnly to) =>
        Ok(await scheduleService.GetOverridesAsync(from, to));

    [HttpPost("overrides")]
    public async Task<IActionResult> UpsertOverride(UpsertDayOverrideRequest request) =>
        Ok(await scheduleService.UpsertOverrideAsync(request));

    [HttpDelete("overrides/{id:guid}")]
    public async Task<IActionResult> DeleteOverride(Guid id)
    {
        var ok = await scheduleService.DeleteOverrideAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
