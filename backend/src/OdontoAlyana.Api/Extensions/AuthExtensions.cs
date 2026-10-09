using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using OdontoAlyana.Domain.Constants;
using OdontoAlyana.Infrastructure.Auth;

namespace OdontoAlyana.Api.Extensions;

public static class AuthExtensions
{
    public const string AdminPolicy = "AdminOnly";
    public const string UserPolicy = "UserOnly";

    public static IServiceCollection AddJwtAuth(this IServiceCollection services, IConfiguration config)
    {
        var jwt = config.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(o =>
            {
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key))
                };
            });

        services.AddAuthorizationBuilder()
            .AddPolicy(AdminPolicy, p => p.RequireRole(AppRoles.Admin))
            // Solo pacientes (rol User): la administradora gestiona las citas desde /admin,
            // no debe poder reservarse una cita a sí misma por el flujo de paciente.
            .AddPolicy(UserPolicy, p => p.RequireRole(AppRoles.User));

        return services;
    }
}