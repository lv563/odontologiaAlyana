namespace OdontoAlyana.Infrastructure.Notifications;

public class EmailOptions
{
    public const string SectionName = "Email";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string User { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "Odonto Alyana";
    public bool EnableSsl { get; set; } = true;

    /// <summary>Correo de la clínica/administradora al que llegan los avisos de nuevas citas.</summary>
    public string AdminEmail { get; set; } = string.Empty;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Host) && !string.IsNullOrWhiteSpace(FromAddress);
}
