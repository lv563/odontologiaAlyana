using Microsoft.AspNetCore.Mvc;
using OdontoAlyana.Infrastructure.Services;

namespace OdontoAlyana.Api.Controllers.Public;

/// <summary>Catálogo de tratamientos visible en el landing, sin necesidad de iniciar sesión.</summary>
[ApiController]
[Route("api/treatments")]
public class TreatmentsController(TreatmentService treatmentService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetActive() => Ok(await treatmentService.GetActiveAsync());
}
