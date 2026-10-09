using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OdontoAlyana.Api.Extensions;
using OdontoAlyana.Infrastructure.Services;

namespace OdontoAlyana.Api.Controllers.Admin;

/// <summary>Registro global de todas las facturas emitidas, de todos los clientes.</summary>
[ApiController]
[Route("api/admin/invoices")]
[Authorize(Policy = AuthExtensions.AdminPolicy)]
public class InvoicesController(InvoiceService invoiceService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await invoiceService.GetAllAsync());
}
