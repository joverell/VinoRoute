# Scripts

This directory contains various scripts for interacting with the application.

## `add-winery-api.js`

This script adds a new winery to the database by calling the internal API.

### Prerequisites

Before running this script, you must have the following environment variables set:

- `FIREBASE_PROJECT_ID`: Your Firebase project ID.
- `FIREBASE_CLIENT_EMAIL`: Your Firebase service account client email.
- `FIREBASE_PRIVATE_KEY`: Your Firebase service account private key.
- `FIREBASE_WEB_API_KEY`: Your Firebase web API key.

You also need to have the development server running, as the script makes a request to the local API.

```bash
npm run dev
```

### Usage

You can run the script from the root of the project:

```bash
node scripts/add-winery-api.js --name "My Awesome Winery" --lat -36.12345 --lng 146.54321 --region "Rutherglen, VIC" --type winery --tags "New,Awesome,Red Wine" --visitDuration 75
```

### Arguments

- `--name`: The name of the winery (required).
- `--lat`: The latitude of the winery (required).
- `--lng`: The longitude of the winery (required).
- `--region`: The region of the winery (required).
- `--type`: The type of location (e.g., `winery`, `distillery`) (required).
- `--tags`: A comma-separated list of tags (optional).
- `--visitDuration`: The estimated visit duration in minutes (optional, defaults to 60).
