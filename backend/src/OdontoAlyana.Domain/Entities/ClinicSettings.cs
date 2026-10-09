using OdontoAlyana.Domain.Common;

namespace OdontoAlyana.Domain.Entities;

/// <summary>Configuración financiera de la clínica (fila única): qué porcentaje de lo facturado
/// se queda la clínica, y qué porcentaje se retiene (impuestos) sobre lo que le corresponde a
/// la odontóloga. Se usa para calcular lo bruto vs. lo neto en el dashboard.</summary>
public class ClinicSettings : BaseEntity
{
    /// <summary>% de cada factura que se queda la clínica (0-100). Por defecto 50.</summary>
    public decimal ClinicPercent { get; set; } = 50m;

    /// <summary>% de retención (impuestos) aplicado sobre la parte que le toca a la odontóloga. Por defecto 15.</summary>
    public decimal RetentionPercent { get; set; } = 15m;
}
