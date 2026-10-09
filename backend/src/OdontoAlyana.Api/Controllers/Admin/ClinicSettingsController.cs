using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoAlyana.Api.Extensions;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Infrastructure.Services;

namespace OdontoAlyana.Api.Controllers.Admin;

/// <summary>Configuración financiera de la clínica: % que se queda la clínica y % de retención,
/// usados para calcular lo bruto vs. lo neto en el dashboard.</summary>
[ApiController]
[Route("api/admin/settings")]
[Authorize(Policy = AuthExtensions.AdminPolicy)]
public class ClinicSettingsController(ClinicSettingsService settingsService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await settingsService.GetAsync());

    [HttpPut]
    public async Task<IActionResult> Update(UpdateClinicSettingsRequest request) =>
        Ok(await settingsService.UpdateAsync(request));
}
