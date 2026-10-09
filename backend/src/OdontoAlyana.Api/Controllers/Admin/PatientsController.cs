using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoAlyana.Api.Extensions;
using OdontoAlyana.Application.Dtos;
using OdontoAlyana.Infrastructure.Services;

namespace OdontoAlyana.Api.Controllers.Admin;

/// <summary>Clientes (pacientes) registrados en la clínica: ficha, citas de seguimiento y facturas.</summary>
[ApiController]
[Route("api/admin/patients")]
[Authorize(Policy = AuthExtensions.AdminPolicy)]
public class PatientsController(
    PatientService patientService,
    AppointmentService appointmentService,
    InvoiceService invoiceService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await patientService.GetAllAsync());

    [HttpGet("{patientId:guid}/appointments")]
    public async Task<IActionResult> GetAppointments(Guid patientId) =>
        Ok(await appointmentService.GetAllAsync(from: null, to: null, status: null, patientId: patientId));

    /// <summary>La administradora agenda una cita (de seguimiento u otra) directamente a nombre del cliente.</summary>
    [HttpPost("{patientId:guid}/appointments")]
    public async Task<IActionResult> CreateAppointment(Guid patientId, CreateAppointmentRequest request)
    {
        var result = await appointmentService.CreateAsync(patientId, request);
        return result.Succeeded ? Ok(result.Appointment) : BadRequest(new { message = result.Error });
    }

    [HttpGet("{patientId:guid}/invoices")]
    public async Task<IActionResult> GetInvoices(Guid patientId) => Ok(await invoiceService.GetForPatientAsync(patientId));

    /// <summary>Genera la factura en PDF de una cita y la envía por correo al cliente.</summary>
    private static readonly string[] AllowedInvoiceFileTypes =
        ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];
    private const long MaxInvoiceFileBytes = 8 * 1024 * 1024; // 8 MB

    [HttpPost("{patientId:guid}/appointments/{appointmentId:guid}/invoice")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxInvoiceFileBytes + 1024)]
    public async Task<IActionResult> SendInvoice(Guid patientId, Guid appointmentId, [FromForm] SendInvoiceForm form)
    {
        byte[]? bytes = null;
        if (form.File is { Length: > 0 } file)
        {
            if (file.Length > MaxInvoiceFileBytes)
                return BadRequest(new { message = "El archivo no puede superar 8 MB." });
            if (!AllowedInvoiceFileTypes.Contains(file.ContentType))
                return BadRequest(new { message = "Solo se aceptan imagenes (JPG, PNG, WEBP, HEIC) o PDF." });

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            bytes = ms.ToArray();
        }

        var result = await invoiceService.CreateAndSendAsync(
            patientId, appointmentId, form.Amount,
            bytes, form.File?.FileName, form.File?.ContentType);

        return result.Succeeded ? Ok(result.Invoice) : BadRequest(new { message = result.Error });
    }
}

public class SendInvoiceForm
{
    public decimal? Amount { get; set; }
    public IFormFile? File { get; set; }
}
