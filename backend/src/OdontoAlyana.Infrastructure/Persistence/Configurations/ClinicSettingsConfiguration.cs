using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OdontoAlyana.Domain.Entities;

namespace OdontoAlyana.Infrastructure.Persistence.Configurations;

public class ClinicSettingsConfiguration : IEntityTypeConfiguration<ClinicSettings>
{
    public void Configure(EntityTypeBuilder<ClinicSettings> builder)
    {
        builder.Property(s => s.ClinicPercent).HasPrecision(5, 2);
        builder.Property(s => s.RetentionPercent).HasPrecision(5, 2);
    }
}
