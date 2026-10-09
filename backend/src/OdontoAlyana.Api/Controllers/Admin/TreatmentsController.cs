using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoAlyana.Api.Extensions;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Infrastructure.Services;

namespace OdontoAlyana.Api.Controllers.Admin;

/// <summary>CRUD de tratamientos/procedimientos ofrecidos por la clínica.</summary>
[ApiController]
[Route("api/admin/treatments")]
[Authorize(Policy = AuthExtensions.AdminPolicy)]
public class TreatmentsController(TreatmentService treatmentService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await treatmentService.GetAllAsync());

    [HttpPost]
    public async Task<IActionResult> Create(UpsertTreatmentRequest request) => Ok(await treatmentService.CreateAsync(request));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpsertTreatmentRequest request)
    {
        var dto = await treatmentService.UpdateAsync(id, request);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var ok = await treatmentService.DeactivateAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
