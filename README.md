# AppPermissions
### Authors: Jonathan Bryan and Josh Herman

This project aims to look at the permissions app require.

## Data Format

This is the format for the data contained within ``data.csv``

#### title
Title of the application

#### appId
ID associated with the application

#### url
URL associated with the application

#### developer
The developer of the application

#### devID
The developers unique ID

#### price
The price of the application

#### free
Determines if the app is free

#### category
The category of the application

#### permissions 
The permissions the application requests
format: ``{str : [], ...}``
each string is a different permission category, and the value is an array of the required permissions for that category

#### installs
The (rough) number of installations for the application
