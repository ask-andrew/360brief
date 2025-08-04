""Service for sending email notifications and digests."""
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from typing import List, Optional, Dict, Any
from pathlib import Path

class EmailService:
    """Service for sending email notifications and digests."""
    
    def __init__(
        self,
        smtp_server: str = "smtp.gmail.com",
        smtp_port: int = 587,
        use_tls: bool = True,
        username: str = None,
        password: str = None
    ):
        """Initialize with SMTP server details."""
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.use_tls = use_tls
        self.username = username or os.getenv("SMTP_USERNAME")
        self.password = password or os.getenv("SMTP_PASSWORD")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        cc: List[str] = None,
        bcc: List[str] = None,
        attachments: List[Dict[str, Any]] = None,
        embedded_images: List[Dict[str, str]] = None
    ) -> bool:
        """
        Send an email with HTML content and optional attachments.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email body
            text_content: Plain text version (auto-generated if None)
            from_email: Sender email address
            cc: List of CC email addresses
            bcc: List of BCC email addresses
            attachments: List of attachment dicts with 'path' and 'filename'
            embedded_images: List of embedded images with 'cid' and 'path'
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        # Create message container
        msg = MIMEMultipart('related')
        msg['Subject'] = subject
        msg['From'] = from_email or self.username
        msg['To'] = to_email
        
        if cc:
            msg['Cc'] = ', '.join(cc)
        if bcc:
            msg['Bcc'] = ', '.join(bcc)
        
        # Create the body of the message (a plain-text and an HTML version)
        text = text_content or ""
        
        # Create alternative part for text/plain and text/html
        msg_alternative = MIMEMultipart('alternative')
        msg.attach(msg_alternative)
        
        # Record the MIME types of both parts - text/plain and text/html
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html_content, 'html')
        
        # Attach parts into message container
        msg_alternative.attach(part1)
        msg_alternative.attach(part2)
        
        # Attach embedded images
        if embedded_images:
            for img in embedded_images:
                with open(img['path'], 'rb') as img_file:
                    img_part = MIMEImage(img_file.read())
                    img_part.add_header('Content-ID', f'<{img["cid"]}>')
                    msg.attach(img_part)
        
        # Attach files
        if attachments:
            for attachment in attachments:
                file_path = attachment.get('path')
                file_name = attachment.get('filename', Path(file_path).name)
                
                with open(file_path, 'rb') as f:
                    part = MIMEText(f.read(), 'base64', 'utf-8')
                    part.add_header('Content-Disposition', 'attachment', filename=file_name)
                    msg.attach(part)
        
        # Send the email
        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                if self.username and self.password:
                    server.login(self.username, self.password)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    async def send_digest(
        self,
        to_email: str,
        digest_data: Dict[str, Any],
        from_email: Optional[str] = None,
        template_path: Optional[str] = None
    ) -> bool:
        """
        Send an executive digest email.
        
        Args:
            to_email: Recipient email address
            digest_data: Dictionary containing digest content
            from_email: Sender email address
            template_path: Path to HTML template file
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        # Generate HTML content from template and data
        html_content = self._render_digest_template(digest_data, template_path)
        
        # Generate plain text version (simple fallback)
        text_content = self._generate_plain_text_version(digest_data)
        
        # Send the email
        return await self.send_email(
            to_email=to_email,
            subject=f"Executive Digest - {digest_data.get('date', '')}",
            html_content=html_content,
            text_content=text_content,
            from_email=from_email,
            embedded_images=digest_data.get('embedded_images', [])
        )
    
    def _render_digest_template(
        self,
        data: Dict[str, Any],
        template_path: Optional[str] = None
    ) -> str:
        """Render digest HTML from template and data."""
        # Default template (simplified for example)
        if not template_path or not os.path.exists(template_path):
            return """
            <html>
                <body>
                    <h1>Executive Digest - {date}</h1>
                    <h2>Key Insights</h2>
                    <ul>
                        {insights}
                    </ul>
                    <h2>Action Items</h2>
                    <ul>
                        {actions}
                    </ul>
                </body>
            </html>
            """.format(
                date=data.get('date', ''),
                insights=''.join(f'<li>{i}</li>' for i in data.get('insights', [])),
                actions=''.join(f'<li>{a}</li>' for a in data.get('actions', []))
            )
        
        # Load and render custom template
        with open(template_path, 'r') as f:
            template = f.read()
            # Simple template rendering (could use Jinja2 for more complex cases)
            return template.format(**data)
    
    def _generate_plain_text_version(self, data: Dict[str, Any]) -> str:
        """Generate a plain text version of the digest."""
        text = f"Executive Digest - {data.get('date', '')}\n"
        text += "=" * 50 + "\n\n"
        
        text += "KEY INSIGHTS:\n"
        for i, insight in enumerate(data.get('insights', []), 1):
            text += f"{i}. {insight}\n"
        
        text += "\nACTION ITEMS:\n"
        for i, action in enumerate(data.get('actions', []), 1):
            text += f"{i}. {action}\n"
        
        return text
