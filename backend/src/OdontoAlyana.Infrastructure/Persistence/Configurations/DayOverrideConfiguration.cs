using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OdontoAlyana.Domain.Entities;

namespace OdontoAlyana.Infrastructure.Persistence.Configurations;

public class DayOverrideConfiguration : IEntityTypeConfiguration<DayOverride>
{
    public void Configure(EntityTypeBuilder<DayOverride> builder)
    {
        builder.HasIndex(d => d.Date).IsUnique();
        builder.Property(d => d.Note).HasMaxLength(300);
    }
}
