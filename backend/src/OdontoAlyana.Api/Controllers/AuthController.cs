using Microsoft.AspNetCore.Mvc;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Infrastructure.Services;

namespace OdontoAlyana.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var result = await authService.RegisterAsync(request);
        return result.Succeeded ? Ok(result.Response) : BadRequest(new { message = result.Error });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await authService.LoginAsync(request);
        return result.Succeeded ? Ok(result.Response) : Unauthorized(new { message = result.Error });
    }
}
