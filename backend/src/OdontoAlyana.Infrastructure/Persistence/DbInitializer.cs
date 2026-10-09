using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OdontoAlyana.Domain.Constants;
using OdontoAlyana.Domain.Entities;
using OdontoAlyana.Infrastructure.Identity;
using OdontoAlyana.Infrastructure.Notifications;

namespace OdontoAlyana.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();

        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        foreach (var role in AppRoles.All)
        {
            if (!await roles.RoleExistsAsync(role))
                await roles.CreateAsync(new IdentityRole<Guid>(role));
        }

        await SeedAdminAsync(scope.ServiceProvider);
        await SeedDefaultScheduleAsync(db);
        await SeedDefaultTreatmentsAsync(db);
        await SeedDefaultClinicSettingsAsync(db);
    }

    private static async Task SeedAdminAsync(IServiceProvider services)
    {
        var adminOptions = services.GetRequiredService<IOptions<AdminSeedOptions>>().Value;
        if (string.IsNullOrWhiteSpace(adminOptions.Email) || string.IsNullOrWhiteSpace(adminOptions.Password))
            return;

        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        if (await userManager.FindByEmailAsync(adminOptions.Email) is not null)
            return;

        var admin = new ApplicationUser
        {
            UserName = adminOptions.Email,
            Email = adminOptions.Email,
            FullName = adminOptions.FullName,
            PhoneNumber = string.IsNullOrWhiteSpace(adminOptions.PhoneNumber) ? null : adminOptions.PhoneNumber,
            EmailConfirmed = true,
        };

        var created = await userManager.CreateAsync(admin, adminOptions.Password);
        if (created.Succeeded)
            await userManager.AddToRoleAsync(admin, AppRoles.Admin);
    }

    private static async Task SeedDefaultScheduleAsync(AppDbContext db)
    {
        if (await db.WorkingHours.AnyAsync()) return;

        var weekdays = new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday };
        foreach (var day in weekdays)
        {
            db.WorkingHours.Add(new WorkingHours
            {
                DayOfWeek = day,
                StartTime = new TimeOnly(8, 0),
                EndTime = new TimeOnly(17, 0),
                IsActive = true,
            });
        }

        db.WorkingHours.Add(new WorkingHours
        {
            DayOfWeek = DayOfWeek.Saturday,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(12, 0),
            IsActive = true,
        });

        db.WorkingHours.Add(new WorkingHours
        {
            DayOfWeek = DayOfWeek.Sunday,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(12, 0),
            IsActive = false,
        });

        await db.SaveChangesAsync();
    }

    private static async Task SeedDefaultTreatmentsAsync(AppDbContext db)
    {
        if (await db.Treatments.AnyAsync()) return;

        db.Treatments.AddRange(
            new Treatment { Name = "Consulta / valoración", Description = "Revisión inicial y diagnóstico.", DurationMinutes = 30, Price = null },
            new Treatment { Name = "Limpieza dental", Description = "Profilaxis y remoción de sarro.", DurationMinutes = 45, Price = null },
            new Treatment { Name = "Resina / obturación", Description = "Tratamiento de caries.", DurationMinutes = 60, Price = null },
            new Treatment { Name = "Extracción", Description = "Extracción de pieza dental.", DurationMinutes = 45, Price = null },
            new Treatment { Name = "Control de ortodoncia", Description = "Ajuste de brackets/alineadores.", DurationMinutes = 30, Price = null }
        );

        await db.SaveChangesAsync();
    }

    private static async Task SeedDefaultClinicSettingsAsync(AppDbContext db)
    {
        if (await db.ClinicSettings.AnyAsync()) return;

        // Por defecto: la clínica se queda 50%, y sobre lo que le queda a la odontóloga se
        // retiene un 15% (impuestos). Ella puede cambiar ambos valores desde Admin → Configuración.
        db.ClinicSettings.Add(new ClinicSettings { ClinicPercent = 50m, RetentionPercent = 15m });
        await db.SaveChangesAsync();
    }
}