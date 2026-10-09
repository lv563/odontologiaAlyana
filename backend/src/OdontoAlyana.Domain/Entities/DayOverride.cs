using OdontoAlyana.Domain.Common;

namespace OdontoAlyana.Domain.Entities;

/// <summary>Excepción a el horario semanal para una fecha concreta: cerrar un día habitual
/// (vacaciones, feriado) o abrir uno que normalmente está cerrado, con horario propio opcional.</summary>
public class DayOverride : BaseEntity
{
    public DateOnly Date { get; set; }
    public bool IsOpen { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? Note { get; set; }
}
