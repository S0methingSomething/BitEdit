# Get_version.py

from google_play_scraper import app

# The official package name for BitLife on the Google Play Store
BITLIFE_APP_ID = 'com.candywriter.bitlife'

def get_current_version():
    """
    Fetches the latest version of the BitLife app and prints it to the console.
    The GitHub Action workflow will capture this printed output.
    """
    try:
        # Scrape the app details from the Play Store
        result = app(BITLIFE_APP_ID)
        # Safely get the 'version' from the result dictionary
        version = result.get('version')
        
        if version:
            # This print statement is the most important part.
            # It's how we send the version number to the GitHub workflow.
            print(version)
    except Exception as e:
        # If an error occurs, print nothing. This prevents the workflow
        # from saving a bad value.
        print(f"An error occurred: {e}", file=sys.stderr)


if __name__ == "__main__":
    # This ensures the script only runs when executed directly
    import sys
    get_current_version()

