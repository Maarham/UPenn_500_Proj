# UPenn_500_Proj
This is the repo for the CIS 5500: Databases Final project. All of the relevant code will be in this repo. 

## Downloading the Data

### Crime Data

The first thing you will need to do is get your Google Cloud ready. Follow the instructions [here](https://cloud.google.com/bigquery/public-data) to create a project and role.

After that is complete, make sure to log in to your Google Cloud account by running the following command in your CLI: `gcloud auth application-default login`

Install all of the required packages using pip: `pip install -r requirements.txt`

Once complete, change the project-ID in the first cell in `download_data.ipynb` and then run the panels to download the data into the `/data` directory. 

## Fire Dataset

The dataset is available here: https://www.kaggle.com/datasets/san-francisco/sf-fire-data-incidents-violations-and-more/data. We will be using four datasets from this data: 
- fire-incidents.csv
- fire-inspections.csv
- fire-safety-complaints.csv
- fire-violations.csv
  One method of downloading and retrieving the dataset is creating a Kaggle Account and going to the dataset page and click "Download" to download the datasets locally into your compute.
  The fire-inspections, fire-safety-complaints.csv and fire-violations are small enough to be on our data folder.
  We cleaned fire-incidents.csv by filtering for Arrival DmTM >= 2026 to reduce the number of rows to 148786, we deleted columns: ['Battalion', 'Station Area', 'Box','point', 'Neighborhoods (old)', 'Zip Codes',
       'Fire Prevention Districts', 'Police Districts', 'Supervisor Districts',
       'Civic Center Harm Reduction Project Boundary', '2017 Fix It Zones',
       'HSOC Zones', 'Central Market/Tenderloin Boundary',
       'Central Market/Tenderloin Boundary Polygon - Updated',
       'HSOC Zones as of 2018-06-05', 'Neighborhoods', 'SF Find Neighborhoods',
       'Current Police Districts', 'Current Supervisor Districts',
       'Analysis Neighborhoods'] to reduce the column size to 60 columns. This makes the file size decrease from 245mb to 52mb.

## Running Tests

This project includes comprehensive unit tests for both the backend API and the frontend React application.

### Backend Tests (Python/pytest)

The backend uses pytest with coverage reporting configured to require at least 80% code coverage.

**Location:** `api/tests/`

**Running the tests:**

```bash
cd api
pytest
```

**Running tests with coverage report:**

```bash
cd api
pytest --cov=. --cov-report=html --cov-report=term
```

**Configuration:**
- Test configuration is defined in `api/pytest.ini`
- Coverage threshold is set to 80% minimum
- HTML coverage reports are generated in `api/htmlcov/`
- JSON coverage data is saved to `api/coverage.json`

**Test files:**
- `test_queries.py` - Tests for all API endpoints and query functions

**What is tested:**
- All 10 query endpoints with various parameters
- Error handling for invalid inputs
- Database connections and query execution
- Response formats and data validation

### Frontend Tests (React/Jest)

The frontend uses Jest and React Testing Library with an 80% coverage threshold for branches, functions, lines, and statements.

**Location:** `frontend/src/`

**Running the tests:**

```bash
cd frontend
npm test
```

**Running tests with coverage:**

```bash
cd frontend
npm test -- --coverage --watchAll=false
```

**Configuration:**
- Jest configuration is in `frontend/package.json` under the `jest` key
- Coverage excludes: `index.js`, `reportWebVitals.js`, `setupTests.js`, and `MapView.js`
- Coverage threshold: 80% for all metrics

**Test files:**
- `App.test.js` - Main application component tests
- `IncidentReport.test.js` - Incident report form tests
- `Query1.test.js` through `Query10.test.js` - Individual query component tests
- `utils.test.js` - Utility function tests

**What is tested:**
- Component rendering and UI elements
- User interactions and form submissions
- API calls and data fetching
- Error handling and loading states
- Utility functions for data processing

### Viewing Coverage Reports

**Backend:**
After running pytest with coverage, open `api/htmlcov/index.html` in your browser to view a detailed HTML coverage report.

**Frontend:**
After running `npm test -- --coverage --watchAll=false`, open `frontend/coverage/lcov-report/index.html` in your browser.

### Coverage Requirements

Both backend and frontend are configured to require 80% code coverage:
- **Backend:** Enforced via pytest with `--cov-fail-under=80`
- **Frontend:** Enforced via Jest with threshold settings for branches, functions, lines, and statements

Tests will fail if coverage drops below these thresholds.

