namespace OdontoAlyana.Infrastructure.Notifications;

public class ReminderOptions
{
    public const string SectionName = "Reminder";

    /// <summary>Cuántos días antes de la cita se envía el recordatorio por WhatsApp.</summary>
    public int DaysBefore { get; set; } = 2;

    /// <summary>Cada cuántas horas revisa el job si hay recordatorios pendientes de enviar.</summary>
    public int CheckIntervalHours { get; set; } = 6;
}
