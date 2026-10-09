using Microsoft.EntityFrameworkCore;
using OdontoAlyana.Application.Abstractions;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Domain.Entities;
using OdontoAlyana.Infrastructure.Persistence;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace OdontoAlyana.Infrastructure.Services;

public class InvoiceResult
{
    public bool Succeeded { get; init; }
    public string? Error { get; init; }
    public InvoiceDto? Invoice { get; init; }

    public static InvoiceResult Fail(string error) => new() { Succeeded = false, Error = error };
    public static InvoiceResult Ok(InvoiceDto dto) => new() { Succeeded = true, Invoice = dto };
}

/// <summary>Genera facturas en PDF por cita/procedimiento y las envía por correo al paciente.</summary>
public class InvoiceService(AppDbContext db, IEmailSender emailSender)
{
    private static InvoiceDto ToDto(Invoice i) => new(i.Id, i.PatientId, i.AppointmentId, i.TreatmentName, i.Amount, i.CreatedAtUtc, i.SentAtUtc);

    /// <summary>Crea la factura y la envía por correo. Si se pasa un adjunto (foto/PDF de la factura
    /// que ella ya tiene hecha), se envía ese archivo tal cual; si no, se genera un PDF automático.</summary>
    public async Task<InvoiceResult> CreateAndSendAsync(
        Guid patientId,
        Guid appointmentId,
        decimal? amountOverride,
        byte[]? attachmentBytes = null,
        string? attachmentFileName = null,
        string? attachmentContentType = null,
        CancellationToken ct = default)
    {
        var appointment = await db.Appointments
            .Include(a => a.Treatment)
            .FirstOrDefaultAsync(a => a.Id == appointmentId && a.PatientId == patientId, ct);
        if (appointment is null) return InvoiceResult.Fail("La cita no existe para este cliente.");

        var patient = await db.Users.FindAsync([patientId], ct);
        if (patient is null) return InvoiceResult.Fail("Cliente no encontrado.");

        var treatmentName = appointment.Treatment?.Name ?? "Procedimiento";
        var amount = amountOverride ?? appointment.Treatment?.Price ?? 0m;

        var invoice = new Invoice
        {
            PatientId = patientId,
            AppointmentId = appointmentId,
            TreatmentName = treatmentName,
            Amount = amount,
        };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync(ct);

        var attachment = attachmentBytes is { Length: > 0 }
            ? new EmailAttachment(
                string.IsNullOrWhiteSpace(attachmentFileName) ? $"Factura-{invoice.Id:N}" : attachmentFileName,
                attachmentBytes,
                string.IsNullOrWhiteSpace(attachmentContentType) ? "application/octet-stream" : attachmentContentType)
            : new EmailAttachment(
                $"Factura-{invoice.Id:N}.pdf",
                BuildPdf(patient.FullName, treatmentName, amount, appointment.Date, invoice.Id),
                "application/pdf");

        await emailSender.SendAsync(
            patient.Email!,
            "Factura - Odonto Alyana",
            $"<p>Hola {patient.FullName},</p><p>Adjuntamos la factura por <strong>{treatmentName}</strong> ({appointment.Date:dd/MM/yyyy}).</p><p>¡Gracias por tu confianza!</p>",
            [attachment],
            ct);

        invoice.SentAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return InvoiceResult.Ok(ToDto(invoice));
    }

    public Task<List<InvoiceDto>> GetForPatientAsync(Guid patientId, CancellationToken ct = default) =>
        db.Invoices
            .Where(i => i.PatientId == patientId)
            .OrderByDescending(i => i.CreatedAtUtc)
            .Select(i => new InvoiceDto(i.Id, i.PatientId, i.AppointmentId, i.TreatmentName, i.Amount, i.CreatedAtUtc, i.SentAtUtc))
            .ToListAsync(ct);

    /// <summary>Registro global: todas las facturas de todos los clientes, para el libro/registro de facturación.</summary>
    public Task<List<InvoiceWithPatientDto>> GetAllAsync(CancellationToken ct = default) =>
        (from i in db.Invoices
         join u in db.Users on i.PatientId equals u.Id
         orderby i.CreatedAtUtc descending
         select new InvoiceWithPatientDto(
             i.Id, i.PatientId, u.FullName, u.Email!, i.AppointmentId, i.TreatmentName, i.Amount, i.CreatedAtUtc, i.SentAtUtc))
        .ToListAsync(ct);

    private static byte[] BuildPdf(string patientName, string treatmentName, decimal amount, DateOnly serviceDate, Guid invoiceId)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text("Odonto Alyana").FontSize(20).Bold();
                        col.Item().Text("Clínica dental").FontSize(10).FontColor(Colors.Grey.Darken1);
                    });
                    row.ConstantItem(160).AlignRight().Column(col =>
                    {
                        col.Item().Text("FACTURA").FontSize(16).Bold().AlignRight();
                        col.Item().Text($"N.º {invoiceId.ToString()[..8].ToUpperInvariant()}").FontSize(10).AlignRight();
                        col.Item().Text($"Fecha: {DateTime.Now:dd/MM/yyyy}").FontSize(10).AlignRight();
                    });
                });

                page.Content().PaddingTop(30).Column(col =>
                {
                    col.Item().Text("Facturado a").FontSize(10).FontColor(Colors.Grey.Darken1);
                    col.Item().Text(patientName).FontSize(13).Bold();

                    col.Item().PaddingTop(25).Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(3);
                            c.RelativeColumn(2);
                            c.RelativeColumn(2);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Text("Procedimiento").Bold();
                            header.Cell().Text("Fecha").Bold();
                            header.Cell().AlignRight().Text("Monto").Bold();
                            header.Cell().ColumnSpan(3).PaddingTop(4).BorderBottom(1).BorderColor(Colors.Grey.Lighten1);
                        });

                        table.Cell().PaddingTop(8).Text(treatmentName);
                        table.Cell().PaddingTop(8).Text(serviceDate.ToString("dd/MM/yyyy"));
                        table.Cell().PaddingTop(8).AlignRight().Text($"RD$ {amount:#,##0.00}");
                    });

                    col.Item().PaddingTop(20).AlignRight().Text($"Total: RD$ {amount:#,##0.00}").FontSize(14).Bold();
                });

                page.Footer().AlignCenter().Text("Gracias por confiar en Odonto Alyana").FontSize(9).FontColor(Colors.Grey.Darken1);
            });
        });

        return document.GeneratePdf();
    }
}
