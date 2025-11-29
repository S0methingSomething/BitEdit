# Get_version.py
# Script to fetch and print the current version of the BitLife app.

import sys
from google_play_scraper import app

# The Google Play Store package name for BitLife
BITLIFE_APP_ID = 'com.candywriter.bitlife'

def get_current_version():
    """
    Fetches the latest version of the BitLife app from the Play Store
    and prints it to standard output. Errors are printed to standard error.
    """
    try:
        # Fetch app details, specifying language and country for consistency.
        result = app(
            BITLIFE_APP_ID,
            lang='en',
            country='us' 
        )
        
        version = result.get('version')
        
        if version:
            # This output is captured by the GitHub Actions workflow.
            print(version)
        else:
            # If no version is found in the result, print an error to stderr.
            print("Python script error: Version key not found in Play Store data.", file=sys.stderr)

    except Exception as e:
        # Print any other exceptions to stderr.
        print(f"Python script error: {e}", file=sys.stderr)
        # Ensure nothing is printed to stdout on error by not having a print() here.

if __name__ == "__main__":
    # This ensures the function runs when the script is executed directly.
    get_current_version()

