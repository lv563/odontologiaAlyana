using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OdontoAlyana.Application.Abstractions;
using OdontoAlyana.Infrastructure.Auth;
using OdontoAlyana.Infrastructure.BackgroundJobs;
using OdontoAlyana.Infrastructure.Identity;
using OdontoAlyana.Infrastructure.Notifications;
using OdontoAlyana.Infrastructure.Persistence;
using OdontoAlyana.Infrastructure.Services;
using QuestPDF.Infrastructure;

namespace OdontoAlyana.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        services.AddDbContext<AppDbContext>(o =>
            o.UseNpgsql(config.GetConnectionString("Default")));

        services.AddIdentityCore<ApplicationUser>(o =>
            {
                o.User.RequireUniqueEmail = true;
                o.Password.RequiredLength = 8;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>();

        services.Configure<JwtOptions>(config.GetSection(JwtOptions.SectionName));
        services.Configure<EmailOptions>(config.GetSection(EmailOptions.SectionName));
        services.Configure<ReminderOptions>(config.GetSection(ReminderOptions.SectionName));
        services.Configure<AdminSeedOptions>(config.GetSection(AdminSeedOptions.SectionName));

        services.AddScoped<TokenService>();
        services.AddScoped<AuthService>();
        services.AddScoped<TreatmentService>();
        services.AddScoped<ScheduleService>();
        services.AddScoped<AppointmentService>();
        services.AddScoped<PatientService>();
        services.AddScoped<InvoiceService>();
        services.AddScoped<ClinicSettingsService>();
        services.AddScoped<StatsService>();

        services.AddScoped<IEmailSender, SmtpEmailSender>();

        services.AddHostedService<AppointmentReminderJob>();

        return services;
    }
}