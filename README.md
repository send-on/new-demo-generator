# Public Event Generator For Your Segment Workspace

This is a simple web application used to pump custom events into your Segment workspace.  
Disclaimer:  This tool is NOT meant to be used in production or with production data. 

## Instructions
1. Make a copy of thie [Schema Template][https://docs.google.com/spreadsheets/d/1jXUA_clzEbEX5xMLGGhFsJDgRau6RnpKYAlBbZYJy6I/edit?usp=sharing]
2. Add your custom events. 
3. Download the Google Sheet as a CSV
4. Load the webapp and enter your source write key, drop in your CSV and hit the button. 

## Notes
- The current status will create 1000 unique profiles to walk through the event journey.  This will be configurable in the future. 
- Do not change the position of the template.  You can add as many properties/traits as you want in the latter columns. 
- Track event properties and Identify event traits must be in object format without curly brackets:  

Acceptable Properties:
brand:[Nike,Adidas]
brand:["Nike", "Adidas"]
price:[12.49, 14.50]

Array designates randomness - The event generator will randomly pick ONE element in the array. 

## TODOs
1. Dropoffs, Repeats, amd Dependencies for events.  Currently these columns don't do anything.
2. Set the number of users (such as 1 for testing).
3. Customize the number of unique users from 0-10K
4. localStorage saving of write keys. 