using OdontoAlyana.Domain.Common;

namespace OdontoAlyana.Domain.Entities;

/// <summary>Horario semanal por defecto de la clínica. Una fila por día de la semana.</summary>
public class WorkingHours : BaseEntity
{
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public bool IsActive { get; set; } = true;
}
