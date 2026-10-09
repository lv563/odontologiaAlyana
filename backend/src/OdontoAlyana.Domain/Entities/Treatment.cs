using OdontoAlyana.Domain.Common;

namespace OdontoAlyana.Domain.Entities;

/// <summary>Tratamiento o procedimiento que se puede reservar (limpieza, ortodoncia, etc.).</summary>
public class Treatment : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationMinutes { get; set; } = 30;
    public decimal? Price { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Appointment> Appointments { get; set; } = [];
}
