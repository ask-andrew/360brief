#!/usr/bin/env python3
"""
Google Services Library

This library contains functions for interacting with Google services (Gmail, Calendar).
Updated to use existing Supabase OAuth tokens instead of standalone OAuth flow.
"""

import os
import re
import base64
import datetime
import logging
import asyncio
import json
from collections import Counter, defaultdict
from email.utils import parsedate_to_datetime

# --- Third-party Libraries ---
import requests
from dotenv import load_dotenv
import spacy

# --- Google API Libraries ---
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# --- Load environment variables ---
load_dotenv()

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

# --- Supabase Configuration ---
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def get_user_tokens_from_supabase(user_email: str):
    """Get OAuth tokens from Supabase for the given user email"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        logging.error("Supabase configuration missing")
        return None

    try:
        # First, find user by email
        user_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/profiles?email=eq.{user_email}",
            headers={
                'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY
            }
        )

        if not user_response.ok:
            logging.error(f"Failed to find user profile: {user_response.text}")
            return None

        users = user_response.json()
        if not users:
            logging.error(f"No user found with email: {user_email}")
            return None

        user_id = users[0]['id']

        # Get tokens
        token_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_tokens?user_id=eq.{user_id}&provider=eq.google",
            headers={
                'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY
            }
        )

        if not token_response.ok:
            logging.error(f"Failed to get tokens: {token_response.text}")
            return None

        tokens = token_response.json()
        if not tokens:
            logging.error(f"No Google tokens found for user: {user_id}")
            return None

        token_data = tokens[0]

        # Check if token needs refresh
        if token_data.get('expires_at'):
            expires_at = datetime.datetime.fromisoformat(token_data['expires_at'].replace('Z', '+00:00'))
            if expires_at <= datetime.datetime.now(datetime.timezone.utc):
                logging.info("Token expired, attempting refresh")
                return refresh_supabase_token(token_data, user_id)

        return {
            'access_token': token_data['access_token'],
            'refresh_token': token_data.get('refresh_token'),
            'expires_at': token_data.get('expires_at')
        }

    except Exception as e:
        logging.error(f"Error getting tokens from Supabase: {e}")
        return None

def refresh_supabase_token(token_data: dict, user_id: str):
    """Refresh OAuth token through Supabase"""
    try:
        refresh_response = requests.post(
            'https://accounts.google.com/o/oauth2/token',
            data={
                'client_id': os.getenv('GOOGLE_CLIENT_ID'),
                'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
                'refresh_token': token_data['refresh_token'],
                'grant_type': 'refresh_token'
            }
        )

        if not refresh_response.ok:
            logging.error(f"Token refresh failed: {refresh_response.text}")
            return None

        refresh_data = refresh_response.json()
        new_expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=refresh_data['expires_in'])

        # Update token in Supabase
        update_response = requests.patch(
            f"{SUPABASE_URL}/rest/v1/user_tokens?user_id=eq.{user_id}&provider=eq.google",
            headers={
                'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY
            },
            json={
                'access_token': refresh_data['access_token'],
                'expires_at': new_expires_at.isoformat()
            }
        )

        if not update_response.ok:
            logging.error(f"Failed to update refreshed token: {update_response.text}")

        return {
            'access_token': refresh_data['access_token'],
            'refresh_token': token_data.get('refresh_token'),
            'expires_at': new_expires_at.isoformat()
        }

    except Exception as e:
        logging.error(f"Error refreshing token: {e}")
        return None

# --- Helper Functions ---
def clean_text(text):
    text = re.sub(r'Subject:.*', '', text, flags=re.DOTALL)
    text = re.sub(r'From:.*', '', text, flags=re.DOTALL)
    text = re.sub(r'To:.*', '', text, flags=re.DOTALL)
    text = re.sub(r'Date:.*', '', text, flags=re.DOTALL)
    text = re.sub(r'Content-Type:.*', '', text, flags=re.DOTALL)
    text = re.sub(r'[\r\n]+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def decode_email_header(header):
    from email.header import decode_header
    decoded_string = ""
    for part, charset in decode_header(header):
        if isinstance(part, bytes):
            try:
                decoded_string += part.decode(charset if charset else 'utf-8')
            except (UnicodeDecodeError, LookupError):
                decoded_string += part.decode('latin-1', errors='ignore')
        else:
            decoded_string += part
    return decoded_string

def extract_entities(text, nlp_model):
    if not text or not nlp_model:
        return [], []
    
    cleaned_text = text
    cleaned_text = re.sub(r'https?://[^\s]+', '', cleaned_text)
    cleaned_text = re.sub(r'\S+@\S+', '', cleaned_text)
    cleaned_text = re.sub(r'[\r\n>*]+', ' ', cleaned_text)
    cleaned_text = re.sub(r'^>.*$', '', cleaned_text, flags=re.MULTILINE)
    cleaned_text = ' '.join(cleaned_text.split())
    
    doc = nlp_model(cleaned_text)
    
    people = []
    orgs = []
    
    for ent in doc.ents:
        entity_text = ent.text.strip()
        
        if any(char in entity_text for char in ['>', '<', '*', '\r', '\n', '@']):
            continue
        if len(entity_text) < 2:
            continue
        if len(re.sub(r'[^\w\s]', '', entity_text)) < 2:
            continue
        
        email_words = {'email', 'mail', 'message', 'sent', 'reply', 'forward', 'inbox', 'subject'}
        if entity_text.lower() in email_words:
            continue
            
        if ent.label_ == "PERSON":
            if len(entity_text.split()) <= 3:
                people.append(entity_text)
        elif ent.label_ == "ORG":
            if not entity_text.startswith('http'):
                orgs.append(entity_text)
    
    people = list(dict.fromkeys(people))
    orgs = list(dict.fromkeys(orgs))
    
    return people, orgs

def extract_keywords_for_themes(text, nlp_model, num_keywords=10):
    if not nlp_model:
        return []
    doc = nlp_model(text.lower())
    filtered_words = []
    for token in doc:
        if token.is_alpha and not token.is_stop:
            if token.pos_ in ["NOUN", "PROPN", "ADJ"]:
                filtered_words.append(token.text)
    
    word_counts = Counter(filtered_words)
    return [word for word, count in word_counts.most_common(num_keywords)]

def get_simplified_thread_topic(subject, thread_emails_bodies, nlp_model):
    if not nlp_model:
        return (subject[:50] + '...') if len(subject) > 50 else subject

    doc = nlp_model(subject.lower())
    subject_keywords = []
    for token in doc:
        if token.is_alpha and not token.is_stop:
            if token.pos_ in ["NOUN", "PROPN", "ADJ"]:
                subject_keywords.append(token.text)
    
    if subject_keywords:
        return Counter(subject_keywords).most_common(1)[0][0].capitalize()

    if thread_emails_bodies:
        first_body_doc = nlp_model(thread_emails_bodies[0].lower())
        body_keywords = []
        for token in first_body_doc:
            if token.is_alpha and not token.is_stop:
                if token.pos_ in ["NOUN", "PROPN", "ADJ"]:
                    body_keywords.append(token.text)
        if body_keywords:
            return Counter(body_keywords).most_common(1)[0][0].capitalize()

    return (subject[:50] + '...') if len(subject) > 50 else subject

def parse_email_date_obj(date_string):
    try:
        return parsedate_to_datetime(date_string)
    except Exception:
        try:
            return datetime.datetime.strptime(date_string, '%a, %d %b %Y %H:%M:%S %z')
        except ValueError:
            try:
                return datetime.datetime.strptime(date_string, '%a, %d %b %Y %H:%M:%S %Z')
            except ValueError:
                return None

async def fetch_recent_messages(service, days=14, max_results=200):
    date_after = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days))
    query = f"after:{int(date_after.timestamp())} is:inbox -category:promotions -category:social -category:updates -category:forums -\"unsubscribe\" -\"promo\" -\"newsletter\" -\"discount\" -\"offer\" -\"sale\" -\"webinar\" -\"event\" -\"free trial\" -\"coupon\" -\"exclusive\" -from:noreply@* -from:info@* -from:marketing@* -from:updates@* -from:notifications@*"
    
    messages = []
    next_page_token = None
    while True:
        results = service.users().messages().list(userId='me', q=query, maxResults=max_results, pageToken=next_page_token).execute()
        messages.extend(results.get('messages', []))
        next_page_token = results.get('nextPageToken')
        if not next_page_token:
            break
    return messages

async def get_message_body(service, msg_id):
    msg = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
    
    def get_plain_text_from_payload(payload):
        if 'parts' in payload:
            for part in payload['parts']:
                if part.get('mimeType') == 'text/plain':
                    data = part.get('body', {}).get('data')
                    if data:
                        return base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
                elif 'parts' in part:
                    nested_text = get_plain_text_from_payload(part)
                    if nested_text:
                        return nested_text
        elif payload.get('mimeType') == 'text/plain':
            data = payload.get('body', {}).get('data')
            if data:
                return base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
        return None

    return get_plain_text_from_payload(msg.get('payload', {}))

async def fetch_and_process_calendar_events(service, time_min, time_max):
    processed_events = []
    time_min_str = time_min.isoformat(timespec='seconds').replace('+00:00', 'Z')
    time_max_str = time_max.isoformat(timespec='seconds').replace('+00:00', 'Z')

    try:
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min_str,
            timeMax=time_max_str,
            maxResults=100,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])
        for event in events:
            event_data = {
                'id': event.get('id'),
                'summary': event.get('summary', 'No Title'),
                'description': event.get('description', ''),
                'start_time': event['start'].get('dateTime', event['start'].get('date')),
                'end_time': event['end'].get('dateTime', event['end'].get('date')),
                'location': event.get('location', ''),
                'organizer_email': event['organizer'].get('email', ''),
                'organizer_name': event['organizer'].get('displayName', event['organizer'].get('email', '')),
                'attendees': [
                    {'email': att.get('email'), 'name': att.get('displayName', att.get('email')), 'responseStatus': att.get('responseStatus')}
                    for att in event.get('attendees', []) if att.get('email')
                ],
                'status': event.get('status')
            }
            processed_events.append(event_data)
    except HttpError as e:
        logging.error(f"Error fetching calendar events: {e}")
    return processed_events

def analyze_email_interactions(emails_data, user_email, nlp_model):
    email_exchange_counts = defaultdict(int)
    response_times_per_sender = defaultdict(list)
    emails_awaiting_response = []
    
    threads = defaultdict(list)
    for email_entry in emails_data:
        threads[email_entry['threadId']].append(email_entry)

    name_email_associations = defaultdict(Counter)

    for thread_id, email_list in threads.items():
        sorted_emails = sorted(email_list, key=lambda x: parse_email_date_obj(x['date']) if parse_email_date_obj(x['date']) else datetime.datetime.min)

        last_incoming_email_info = None
        
        for email_entry in sorted_emails:
            email_date_obj = parse_email_date_obj(email_entry['date'])
            if not email_date_obj:
                continue

            normalized_from_email = email_entry['from_email'].lower()
            normalized_to_recipients = [r.lower() for r in email_entry['to_recipients']]
            normalized_cc_recipients = [r.lower() for r in email_entry['cc_recipients']]

            if email_entry['from_name'] and email_entry['from_email']:
                name_email_associations[email_entry['from_name']][email_entry['from_email'].lower()] += 1
            
            for recipient_full in email_entry['to_recipients'] + email_entry['cc_recipients']:
                match = re.match(r'^(.*?)\s*<([^>]+)>', recipient_full)
                if match:
                    name, email_addr = match.group(1).strip(), match.group(2)
                    if name: name_email_associations[name][email_addr.lower()] += 1
                elif '@' in recipient_full:
                    name_email_associations[recipient_full][recipient_full.lower()] += 1

            is_sent_by_user = (normalized_from_email == user_email.lower())
            is_received_by_user = (user_email.lower() in normalized_to_recipients or user_email.lower() in normalized_cc_recipients)

            if is_sent_by_user:
                for recipient in normalized_to_recipients + normalized_cc_recipients:
                    if recipient != user_email.lower():
                        email_exchange_counts[recipient] += 1
            elif is_received_by_user:
                email_exchange_counts[normalized_from_email] += 1
                
            if not is_sent_by_user and is_received_by_user:
                last_incoming_email_info = (email_entry['from_email'], email_date_obj, email_entry['subject'])
            elif is_sent_by_user and last_incoming_email_info:
                original_sender_email, incoming_date_obj, _ = last_incoming_email_info
                if email_date_obj > incoming_date_obj:
                    response_time = email_date_obj - incoming_date_obj
                    response_times_per_sender[original_sender_email].append(response_time)
                last_incoming_email_info = None
        
        sorted_emails_desc = sorted(email_list, key=lambda x: parse_email_date_obj(x['date']) if parse_email_date_obj(x['date']) else datetime.datetime.min, reverse=True)
        
        if sorted_emails_desc:
            latest_email_in_thread = sorted_emails_desc[0]
            latest_email_date_obj = parse_email_date_obj(latest_email_in_thread['date'])

            if latest_email_date_obj:
                normalized_latest_from_email = latest_email_in_thread['from_email'].lower()
                normalized_latest_to_recipients = [r.lower() for r in latest_email_in_thread['to_recipients']]
                normalized_latest_cc_recipients = [r.lower() for r in latest_email_in_thread['cc_recipients']]

                is_latest_sent_by_user = (normalized_latest_from_email == user_email.lower())
                is_latest_received_by_user = (user_email.lower() in normalized_latest_to_recipients or user_email.lower() in normalized_latest_cc_recipients)

                user_replied_after_this_incoming = False
                for email_in_thread in sorted_emails:
                    email_in_thread_date_obj = parse_email_date_obj(email_in_thread['date'])
                    if email_in_thread_date_obj and email_in_thread_date_obj > latest_email_date_obj:
                        if email_in_thread['from_email'].lower() == user_email.lower():
                            user_replied_after_this_incoming = True
                            break
                
                if is_latest_received_by_user and not is_latest_sent_by_user and not user_replied_after_this_incoming:
                    time_since_incoming = datetime.datetime.now(datetime.timezone.utc) - latest_email_date_obj
                    if datetime.timedelta(hours=1) < time_since_incoming < datetime.timedelta(days=14):
                        emails_awaiting_response.append({
                            'subject': latest_email_in_thread['subject'],
                            'sender': latest_email_in_thread['from_email'],
                            'date': latest_email_date_obj.strftime('%Y-%m-%d %H:%M')
                        })

    final_name_to_email_map = {}
    for name, email_counts in name_email_associations.items():
        if email_counts:
            final_name_to_email_map[name] = email_counts.most_common(1)[0][0]
        else:
            final_name_to_email_map[name] = name

    avg_response_times = {}
    for sender, times in response_times_per_sender.items():
        if times:
            total_seconds = sum(t.total_seconds() for t in times)
            avg_seconds = total_seconds / len(times)
            
            if avg_seconds < 60:
                avg_response_times[sender] = f"{int(avg_seconds)} seconds"
            elif avg_seconds < 3600:
                avg_response_times[sender] = f"{int(avg_seconds / 60)} minutes"
            elif avg_seconds < 86400:
                avg_response_times[sender] = f"{int(avg_seconds / 3600)} hours"
            else:
                avg_response_times[sender] = f"{int(avg_seconds / 86400)} days"
    
    top_email_exchange_contacts = Counter(email_exchange_counts).most_common(10)

    key_organizations = Counter()
    combined_text_for_themes = ""
    for email_entry in emails_data:
        combined_text_for_themes += email_entry['body'] + " "
        people_in_body, orgs_in_body = extract_entities(email_entry['body'], nlp_model)
        for org in orgs_in_body: key_organizations[org] += 1

    return top_email_exchange_contacts, avg_response_times, key_organizations, combined_text_for_themes, final_name_to_email_map, emails_awaiting_response
