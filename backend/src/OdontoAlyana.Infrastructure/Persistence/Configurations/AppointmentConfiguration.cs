using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OdontoAlyana.Domain.Entities;

namespace OdontoAlyana.Infrastructure.Persistence.Configurations;

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.Property(a => a.Notes).HasMaxLength(500);
        builder.HasIndex(a => new { a.Date, a.StartTime });
        builder.HasIndex(a => a.PatientId);

        builder.HasOne(a => a.Treatment)
            .WithMany(t => t.Appointments)
            .HasForeignKey(a => a.TreatmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
