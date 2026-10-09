namespace OdontoAlyana.Infrastructure.Notifications;

/// <summary>Cuenta de administradora (odontóloga) creada automáticamente al iniciar si no existe.</summary>
public class AdminSeedOptions
{
    public const string SectionName = "AdminSeed";

    public string FullName { get; set; } = "Administradora";
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}
