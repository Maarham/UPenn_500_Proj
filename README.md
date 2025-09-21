# UPenn_500_Proj
This is the repo for the CIS 5500: Databases Final project. All of the relevant code will be in this repo. 

## Downloading the Data

### Crime Data

The first thing you will need to do is get your Google Cloud ready. Follow the instructions [here](https://cloud.google.com/bigquery/public-data) to create a project and role.

After that is complete, make sure to login into your google cloud account by running the following command in your CLI: `gcloud auth application-default login`

Install all of the requires packages using pip: `pip install -r requirements.txt`

Once complete, change the project-ID in the first cell in `download_data.ipynb' and then run the panels to dowhnload the data into the `/data` directory. 