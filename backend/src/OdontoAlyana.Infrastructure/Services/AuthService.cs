using Microsoft.AspNetCore.Identity;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Domain.Constants;
using OdontoAlyana.Infrastructure.Auth;
using OdontoAlyana.Infrastructure.Identity;

namespace OdontoAlyana.Infrastructure.Services;

public class AuthResult
{
    public bool Succeeded { get; init; }
    public string? Error { get; init; }
    public AuthResponse? Response { get; init; }

    public static AuthResult Fail(string error) => new() { Succeeded = false, Error = error };
    public static AuthResult Ok(AuthResponse response) => new() { Succeeded = true, Response = response };
}

/// <summary>Registro/login de pacientes. Los administradores se crean por semilla, no por este flujo.</summary>
public class AuthService(UserManager<ApplicationUser> userManager, TokenService tokenService)
{
    public async Task<AuthResult> RegisterAsync(RegisterRequest request)
    {
        var existing = await userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
            return AuthResult.Fail("Ya existe una cuenta con ese correo.");

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
        };

        var created = await userManager.CreateAsync(user, request.Password);
        if (!created.Succeeded)
            return AuthResult.Fail(string.Join(" ", created.Errors.Select(e => e.Description)));

        await userManager.AddToRoleAsync(user, AppRoles.User);

        var (token, expires) = tokenService.CreateToken(user.Id, user.Email!, user.FullName, [AppRoles.User]);
        return AuthResult.Ok(new AuthResponse(token, expires, user.FullName, user.Email!, AppRoles.User));
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
            return AuthResult.Fail("Correo o contraseña incorrectos.");

        var roles = await userManager.GetRolesAsync(user);
        var role = roles.Contains(AppRoles.Admin) ? AppRoles.Admin : AppRoles.User;

        var (token, expires) = tokenService.CreateToken(user.Id, user.Email!, user.FullName, roles);
        return AuthResult.Ok(new AuthResponse(token, expires, user.FullName, user.Email!, role));
    }
}
