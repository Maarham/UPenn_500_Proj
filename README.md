# UPenn_500_Proj
This is the repo for the CIS 5500: Databases Final project. All of the relevant code will be in this repo. 

## Downloading the Data

### Crime Data

The first thing you will need to do is get your Google Cloud ready. Follow the instructions [here](https://cloud.google.com/bigquery/public-data) to create a project and role.

After that is complete, make sure to log in to your Google Cloud account by running the following command in your CLI: `gcloud auth application-default login`

Install all of the required packages using pip: `pip install -r requirements.txt`

Once complete, change the project-ID in the first cell in `download_data.ipyn` and then run the panels to download the data into the `/data` directory. 

## Fire Dataset

The dataset is available here: https://www.kaggle.com/datasets/san-francisco/sf-fire-data-incidents-violations-and-more/data. We will be using four datasets from this data: 
- fire-incidents.csv
- fire-inspections.csv
- fire-safety-complaints.csv
- fire-violations.csv
  One method of downloading and retrieving the dataset is creating a Kaggle Account and going to the dataset page and click "Download" to download the datasets locally into your compute.
  The fire-inspections, fire-safety-complaints.csv and fire-violations are small enough to be on our data folder.
  
