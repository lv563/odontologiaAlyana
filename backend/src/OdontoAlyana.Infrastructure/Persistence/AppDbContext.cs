using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OdontoAlyana.Domain.Entities;
using OdontoAlyana.Infrastructure.Identity;

namespace OdontoAlyana.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Treatment> Treatments => Set<Treatment>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<WorkingHours> WorkingHours => Set<WorkingHours>();
    public DbSet<DayOverride> DayOverrides => Set<DayOverride>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<ClinicSettings> ClinicSettings => Set<ClinicSettings>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}