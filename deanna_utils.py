import requests
import os
import logging # Import the logging module
from dotenv import load_dotenv

logger = logging.getLogger(__name__) # Initialize logger

def create_new_book(term, user_id=221):
    load_dotenv('.env')

    API_URL = os.getenv('DEANNA_API_URL')

    headers = {
        "Content-Type": "application/json",
        "X-API-KEY": os.getenv('DEANNA_API_KEY')
    }

    payload = {
        "term": term,
        "user_id": user_id
    }

    response = requests.post(API_URL, json=payload, headers=headers)
    response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)

    try:
        json_response = response.json()
        logger.info(f"Store API raw JSON response: {json_response}")
        return json_response
    except requests.exceptions.JSONDecodeError as e:
        logger.error(f"Failed to decode JSON from Store API response. Response text: {response.text}. Error: {e}")
        return {"status": "error", "message": "Invalid JSON response from API"}
