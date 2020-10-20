import pandas as pd
from pymongo import MongoClient

mongo_client = MongoClient()
db = mongo_client.appPermissions
col = db.AndroidApplications

cursor = col.find()

df = pd.DataFrame(list(cursor))

# Delete the _id
if '_id' in df:
    del df['_id']

df.to_csv('data.csv', index=False)