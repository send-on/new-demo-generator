# Public Event Generator For Your Segment Workspace

This is a simple web application used to pump custom events into your Segment workspace.  

**Disclaimer**:  This tool is NOT meant to be used in production or with production data. 
<br><br>

## Instructions
1. Make a copy of this [Schema Template](https://docs.google.com/spreadsheets/d/13XXBkNGFTms5o-6A3A3vqmIoVBUqkxSgvj9ghTTYGdI/edit?usp=sharing).
2. Add your custom events. 
3. Download the Google Sheet as a **CSV**.
4. Load the webapp and enter "number of users", hit generate users.  
5. Enter your Segment source write key. 
5. Upload your CSV and hit the button. 


<br>

## Usage Notes
- In the excel template, it is recommended to set values with formulas as opposed to hard coded for "Event ID, Dependency, Days Ago".  That way you can delete rows without changing everything. 
- Do not change the column position of the template.  You can add as many properties/traits as you want in the latter columns. 
- If you want to send the events to the same users, do not hit regenerate, click on Fire again. 

<br>

## FEATURES

### Event Type
Must be identify, track or page.  Group calls will be supported in the future. 

<br>

### Event Name
Track events MUST have a value.  Identify events can be blank and if there is a value it will be ignored. 

<br>

### Dependency
Connect events together such that the subsequent event does not fire if the prior event does not.  For example, an "Email Opened" event should not fire if "Email Sent" was not fired. 

> event_3 has dependency on 2 
>
> event_2 does not fire
>
> event_3 will not fire. 

<br>

### Chance of Happening
This is the inverse of a "Dropoff".  100 ensures the event will fire while 25 implies there is a 25% chance this event will fire. 

<br>

### Timestamps (Days Ago and Days Randomizer)

 **Days Ago** will enable you to set the timestamp of the event.  Days ago will set the timestamp of the event to be x days in the past.  Decimals are OK (i.e. 4.5 days ago).

 **Day Randomizer** will randomize the timestamp to ensure no event has the same timestamp.  The final timestamp is calculated by `Days Ago - random(0 -> dayRandomizer)`.  In other words, Hour Randomizer will subtract a random time from the time stamp.  

 To ensure sequential events are in order, you can set the Days Ago of events to be 0.1 apart and set the randomizer to 1. 

<br>

### Properties and Traits
Track event properties and Identify event traits must be in object format **WITHOUT curly brackets**. 

In order to randomly pick one property, set the value as an array. 

To fire properties with array values, use format `[property, 2]:[val1, val2, val3]`.  This will pick 2 random values from the array set, if you set the integer above the number of values, it will send all values but not go above the number of elements in the array. 

> **Acceptable Properties**:
> 
> brand: Nike
> 
> brand:[Nike,Adidas] `// randomly pick ONE between Nike and Adidas` 
> 
> brand:["Nike", "Adidas"] `// OK with or without quotes`
> 
> price:[12.49, 14.50] `// number type`
> 
> [brand, 2]:[Nike, Adidas, Under Armour] `// output is brand:["Adidas", "Nike"],  will randomly pick 2`

<br>


### Creating Random IDs for Traits and Properties 

Setting a property to `#` or `##` will set the property to a random short or long ID respectively. 

If you set `property: #`, it will generate a random short ID while `property: ##` will set it as a long ID with multiple hyphens. This is useful if you want to add ios.idfa or android.id of a random value, simply set `ios.idfa: ##`.  Another use case is setting `link_id: #` or `checkout_id: #` to have it be a short code. 

<br>

### Linking Properties between Events 

Sometimes you need to connect property valuies between events.  For example, if your event is "Product Viewed" and "Product Added" sequentially, the brand, name, category, etc. properties between the two should be the same. 

In order to do this, set the subsequent event's dependency to the first event.  For the property value you want to connect, set `property:*` or `property:[val1, val2, ..]*`.  As long as `*` is **AFTER** the `:`, it will connect the properties together. 

> **Example Usage**
> 
> event_1 has `brand:"converse"`. 
>
> event_2 is dependent on event_1 and has `brand:*` in the schema. 
>
> event_2 will be `brand:"converse"`. 

<br>


