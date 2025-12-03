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
  We cleaned fire-incidents.csv by filtering for Arrival DmTM >= 2016 to reduce the number of rows to 148786, we deleted columns: ['Battalion', 'Station Area', 'Box','point', 'Neighborhoods (old)', 'Zip Codes',
       'Fire Prevention Districts', 'Police Districts', 'Supervisor Districts',
       'Civic Center Harm Reduction Project Boundary', '2017 Fix It Zones',
       'HSOC Zones', 'Central Market/Tenderloin Boundary',
       'Central Market/Tenderloin Boundary Polygon - Updated',
       'HSOC Zones as of 2018-06-05', 'Neighborhoods', 'SF Find Neighborhoods',
       'Current Police Districts', 'Current Supervisor Districts',
       'Analysis Neighborhoods'] to reduce the column size to 60 columns. This makes the file size decrease from 245mb to 52mb.
       
  
