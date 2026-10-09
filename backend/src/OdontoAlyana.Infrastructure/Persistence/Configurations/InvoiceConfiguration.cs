using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OdontoAlyana.Domain.Entities;

namespace OdontoAlyana.Infrastructure.Persistence.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.Property(i => i.TreatmentName).IsRequired().HasMaxLength(150);
        builder.Property(i => i.Amount).HasPrecision(10, 2);
        builder.HasIndex(i => i.PatientId);

        builder.HasOne(i => i.Appointment)
            .WithMany()
            .HasForeignKey(i => i.AppointmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
