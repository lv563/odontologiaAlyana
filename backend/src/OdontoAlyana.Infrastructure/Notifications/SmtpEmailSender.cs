using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OdontoAlyana.Application.Abstractions;

namespace OdontoAlyana.Infrastructure.Notifications;

/// <summary>Envía correos por SMTP. Si no hay Host/FromAddress configurados (desarrollo sin
/// credenciales todavía) no falla: solo deja constancia en el log.</summary>
public class SmtpEmailSender(IOptions<EmailOptions> options, ILogger<SmtpEmailSender> logger) : IEmailSender
{
    private readonly EmailOptions _options = options.Value;

    public async Task SendAsync(
        string toEmail,
        string subject,
        string htmlBody,
        IReadOnlyList<EmailAttachment>? attachments = null,
        CancellationToken ct = default)
    {
        if (!_options.IsConfigured)
        {
            logger.LogWarning("Email no configurado (Email:Host/FromAddress). Se omite envío a {To}: {Subject}", toEmail, subject);
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_options.FromAddress, _options.FromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(toEmail);

        var streams = new List<MemoryStream>();
        try
        {
            if (attachments is not null)
            {
                foreach (var attachment in attachments)
                {
                    var stream = new MemoryStream(attachment.Content);
                    streams.Add(stream);
                    message.Attachments.Add(new Attachment(stream, attachment.FileName, attachment.ContentType));
                }
            }

            using var client = new SmtpClient(_options.Host, _options.Port)
            {
                EnableSsl = _options.EnableSsl,
                Credentials = new NetworkCredential(_options.User, _options.Password),
            };

            await client.SendMailAsync(message, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "No se pudo enviar el correo a {To}", toEmail);
        }
        finally
        {
            foreach (var stream in streams) await stream.DisposeAsync();
        }
    }
}
