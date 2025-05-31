import sys
from google_play_scraper import app

# Package name for BitLife on the Google Play Store
BITLIFE_APP_ID = 'com.candywriter.bitlife'

def get_current_version():
    """
    Fetches the latest version of the BitLife app and prints it to the console.
    The GitHub Action workflow will capture this printed output.
    """
    try:
        result = app(
            BITLIFE_APP_ID,
            lang='en',
            country='us'
        )
        
        version = result.get('version')
        
        if version:
            print(version)
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)

if __name__ == "__main__":
    get_current_version()
