import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from email.utils import formatdate

from data_processing.models import MessageType
from data_processing.services.email_processor import EmailProcessor, ProcessedMessage
from data_processing.models import EmailMessage as EmailMessageModel

# Test data
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpass123"
TEST_IMAP = "imap.example.com"

def create_test_email(subject="Test Subject", 
                     from_="sender@example.com",
                     to="recipient@example.com",
                     body_text="Test email body",
                     body_html="<p>Test email body</p>",
                     date=None):
    """Helper to create a test email message."""
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = from_
    msg['To'] = to
    msg['Date'] = formatdate(localtime=True) if date is None else date
    
    if body_text and body_html:
        msg.set_content(body_text)
        msg.add_alternative(body_html, subtype='html')
    elif body_html:
        msg.set_content(body_html, subtype='html')
    else:
        msg.set_content(body_text or "")
        
    return msg

@pytest.fixture
def mock_imap_client():
    """Fixture that mocks the aioimaplib.IMAP4_SSL client."""
    with patch('aioimaplib.IMAP4_SSL') as mock_imap_class:
        mock_imap = AsyncMock()
        mock_imap_class.return_value = mock_imap
        
        # Mock successful connection
        mock_imap.wait_hello_from_server = AsyncMock()
        mock_imap.login = AsyncMock(return_value=('OK', [b'Logged in']))
        mock_imap.logout = AsyncMock(return_value=('BYE', [b'Logging out']))
        mock_imap.select = AsyncMock(return_value=('OK', [b'1']))
        mock_imap.has_pending_idle.return_value = False
        
        yield mock_imap

@pytest.fixture
def email_processor():
    """Fixture that provides a configured EmailProcessor instance."""
    return EmailProcessor(
        username=TEST_EMAIL,
        password=TEST_PASSWORD,
        imap_server=TEST_IMAP,
        use_ssl=True,
        batch_size=10
    )

@pytest.mark.asyncio
async def test_connect_success(email_processor, mock_imap_client):
    """Test successful connection to IMAP server."""
    connected = await email_processor.connect()
    assert connected is True
    mock_imap_client.wait_hello_from_server.assert_awaited_once()
    mock_imap_client.login.assert_awaited_once_with(TEST_EMAIL, TEST_PASSWORD)

@pytest.mark.asyncio
async def test_connect_failure(email_processor, mock_imap_client):
    """Test connection failure to IMAP server."""
    mock_imap_client.login.side_effect = Exception("Connection failed")
    connected = await email_processor.connect()
    assert connected is False

@pytest.mark.asyncio
async def test_disconnect(email_processor, mock_imap_client):
    """Test disconnecting from the IMAP server."""
    # First connect
    await email_processor.connect()
    # Then disconnect
    await email_processor.disconnect()
    mock_imap_client.logout.assert_awaited_once()

@pytest.mark.asyncio
async def test_fetch_emails_success(email_processor, mock_imap_client):
    """Test successful email fetching."""
    # Setup test data
    start_date = datetime.now(timezone.utc) - timedelta(days=7)
    end_date = datetime.now(timezone.utc)
    
    # Create a test email
    test_email = create_test_email()
    
    # Mock IMAP responses
    mock_imap_client.search.return_value = ('OK', [b'1 2 3'])
    
    # Create a proper fetch response structure
    test_email_bytes = test_email.as_bytes()
    fetch_response = [
        (b'1 (RFC822 {size}'.decode('utf-8'), test_email_bytes),
        (b'2 (RFC822 {size}'.decode('utf-8'), test_email_bytes),
        (b'3 (RFC822 {size}'.decode('utf-8'), test_email_bytes)
    ]
    mock_imap_client.fetch = AsyncMock(return_value=('OK', fetch_response))
    
    # Call the method
    emails = await email_processor.fetch_emails(
        user_email=TEST_EMAIL,
        start_date=start_date,
        end_date=end_date
    )
    
    # Assertions
    assert len(emails) == 3
    assert all(isinstance(email, ProcessedMessage) for email in emails)
    mock_imap_client.select.assert_awaited_once_with('INBOX')
    assert mock_imap_client.fetch.await_count == 3

@pytest.mark.asyncio
async def test_process_single_email(email_processor):
    """Test processing a single email message."""
    # Create a test email
    test_subject = "Test Subject"
    test_from = "test@example.com"
    test_body = "This is a test email"
    
    msg = create_test_email(
        subject=test_subject,
        from_=test_from,
        body_text=test_body
    )
    
    # Process the email
    processed = email_processor._process_single_email(msg)
    
    # Assertions
    assert processed is not None
    assert processed.summary == test_subject
    assert processed.message_type == MessageType.EMAIL

@pytest.mark.asyncio
async def test_extract_email_content_multipart(email_processor):
    """Test extracting content from a multipart email."""
    # Create a multipart test email
    msg = create_test_email(
        body_text="Plain text content",
        body_html="<p>HTML content</p>"
    )
    
    # Extract content
    text, html = email_processor._extract_email_content(msg)
    
    # Assertions - strip any trailing whitespace from the content
    assert text.strip() == "Plain text content"
    assert "<p>HTML content</p>" in html

def test_parse_email_date_valid(email_processor):
    """Test parsing a valid email date."""
    # Test with a valid date string
    date_str = "Mon, 01 Jan 2023 12:00:00 +0000"
    result = email_processor._parse_email_date(date_str)
    assert result.year == 2023
    assert result.month == 1
    assert result.day == 1

def test_parse_email_date_invalid(email_processor):
    """Test parsing an invalid email date."""
    # Test with an invalid date string
    result = email_processor._parse_email_date("invalid date")
    assert isinstance(result, datetime)

def test_decode_header(email_processor):
    """Test decoding email headers."""
    # Test with a simple header
    assert email_processor._decode_header("Test Subject") == "Test Subject"
    
    # Test with an encoded header
    encoded = "=?utf-8?q?Test_Subject_with_=C3=A9?="
    assert email_processor._decode_header(encoded) == "Test Subject with é"

@pytest.mark.asyncio
async def test_fetch_emails_empty_result(email_processor, mock_imap_client):
    """Test email fetching when no emails are found."""
    # Setup test data
    start_date = datetime.now(timezone.utc) - timedelta(days=7)
    end_date = datetime.now(timezone.utc)
    
    # Mock empty search result
    mock_imap_client.search.return_value = ('OK', [b''])
    
    # Call the method
    emails = await email_processor.fetch_emails(
        user_email=TEST_EMAIL,
        start_date=start_date,
        end_date=end_date
    )
    
    # Assertions
    assert emails == []
    mock_imap_client.select.assert_awaited_once_with('INBOX')
    mock_imap_client.search.assert_awaited_once()
    mock_imap_client.fetch.assert_not_awaited()
