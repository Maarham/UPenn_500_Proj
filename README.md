# UPenn_500_Proj
This is the repo for the CIS 5500: Databases Final project. All of the relevant code will be in this repo. 

## Project Description
The project is a full-stack public safety intelligence application, designed to visualize and analyze city safety data. The application is built with React and Flask where the React frontend provides the interactive, user-friendly interface, while the Flask backend handles the data ingestion, API endpoints, and database operations. 

## Running Project Locally
With new terminal,
1. Enter the folder for backend server
```bash
cd api
```
3. Install Dependencies
```bash
pip install -r ../requirements.txt
```
5. Run the Flask server
```bash
python queries.py
```
With another separate terminal,
1. Enter the folder for the frontend server
```bash
cd frontend
```
3. Run the React server
```bash
npm start
```
4. Open http://localhost:3000 to view it in your browser.
   
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
  
  We cleaned fire-incidents.csv by filtering for Arrival DmTM >= 2016 to reduce the number of rows to 148786, we deleted columns: ['Battalion', 'Station Area', 'Box','point', 'Neighborhoods (old)', 'Zip Codes',
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

**Current Coverage:** 80.44% lines, 78.71% statements ✅ **Exceeds 80% target!**
**Test Status:** 123/123 tests passing (100% pass rate)

**Location:** `frontend/src/*.test.js`

**Running tests:**
```bash
cd frontend
npm test                                    # Interactive mode
npm test -- --coverage --watchAll=false    # With coverage report
```

**Configuration:**
- Jest config in `frontend/package.json`
- Coverage threshold: 80%
- Excludes: `index.js`, `reportWebVitals.js`, `setupTests.js`, `MapView.js`

**Test Coverage by Component:**
- 100% coverage: Query1, Query2, Query4, utils
- 90%+ coverage: Query3 (97%), Query9 (92%)
- 80%+ coverage: Query5 (87.5%), Query6 (81.6%)

**View Coverage Report:**
Run tests with `--coverage` flag, then open `frontend/coverage/lcov-report/index.html`

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

