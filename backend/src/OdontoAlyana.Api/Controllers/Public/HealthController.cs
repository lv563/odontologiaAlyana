using Microsoft.AspNetCore.Mvc;

namespace OdontoAlyana.Api.Controllers.Public;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok", utc = DateTime.UtcNow });
}