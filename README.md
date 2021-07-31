# Public Event Generator For Your Segment Workspace

This is a simple web application used to pump custom events into your Segment workspace.  
Disclaimer:  This tool is NOT meant to be used in production or with production data. 

## Instructions
1. Make a copy of thie [Schema Template][https://docs.google.com/spreadsheets/d/1jXUA_clzEbEX5xMLGGhFsJDgRau6RnpKYAlBbZYJy6I/edit?usp=sharing]
2. Add your custom events. 
3. Download the Google Sheet as a CSV.
4. Load the webapp and enter your source write key, number of users, drop in your CSV and hit the button. 

## Usage Notes
- Do not change the position of the template.  You can add as many properties/traits as you want in the latter columns. 
- Track event properties and Identify event traits must be in object format without curly brackets:  

Acceptable Properties:
brand:[Nike,Adidas]
brand:["Nike", "Adidas"]
price:[12.49, 14.50]

Array designates randomness - The event generator will randomly pick ONE element in the array. 

## TODOs
1. localStorage saving of write keys. 
2. Add more error checking.