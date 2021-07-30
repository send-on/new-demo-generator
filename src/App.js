import React, { useState } from 'react'
import './App.css';
import Analytics from "@segment/analytics.js-core/build/analytics";
import SegmentIntegration from "@segment/analytics.js-integration-segmentio";
import CSVReader2 from './parser.js';
import moment from 'moment';
import {writeKey} from './config.js'
const unixDay = 86400;
const unixHour = 3600;

const analytics = new Analytics();
const integrationSettings = {
  "Segment.io": {
    apiKey: writeKey,
    retryQueue: true,
    addBundledMetadata: true
  }
};
analytics.use(SegmentIntegration);
analytics.initialize(integrationSettings);
// analytics.load('writekey')

const userList = [{
  "first_name":"Oliver",
  "last_name":"Han",
  "email":"oliver.han@segment.com",
  "anonymousId":"abc123",
  "user_id":"xyz987"
},
{
  "first_name":"Ju",
  "last_name":"Lee",
  "email":"Ju.lee@segment.com",
  "anonymousId":"12313908",
  "user_id":"3i219381209"
}
]

// Helper functions
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const firstProp = 8

const sanitize = (s) => {
  if (s.includes(false)) return false;
  if (s.includes(true)) return true;
  s = s.replace('\"', "");
  s = s.replace("[", "");
  s = s.replace("]", "");
  s = s.trim();
  return s
}

const createProps = (e) => {
  let propsObject = e.splice(firstProp)
  propsObject = propsObject.filter(function(el) { return el; });
  const properties = {}
  for (let i = 0; i < propsObject.length; i++) {
    let temp = propsObject[i].split([":"]);
    temp[1] = temp[1].split(',')
    let randomValue = sanitize(temp[1][getRandomInt(temp[1].length)])
    // randomValue = sanitize(randomValue)
    properties[temp[0]] = randomValue
  }
  return properties;
}

// "timestamp": "2021-07-29T23:04:33.133Z",

const launcher = (schemaObject, userList, u_i, e_i, firedEvents) => {
  // reset ajs on new user
  if (e_i === 0) {
    analytics.reset();
    analytics.setAnonymousId(userList[u_i].anonymousId)
  }
  // handle time set time, index 6 is days_ago, index 7 is hours
  let timestamp = moment().unix()
  console.log(schemaObject)
  if (schemaObject[e_i][6]) {
    timestamp = timestamp - schemaObject[e_i][6]*unixDay
    if (schemaObject[e_i][7]) {
      timestamp = timestamp - Math.floor((Math.random() * (parseFloat(schemaObject[e_i][7]))*unixHour))
    }
  }
  timestamp = moment(timestamp, "X").format();

  
  if (schemaObject[e_i][1] === "identify") {
    let properties = createProps(schemaObject[e_i]);
    Object.assign(properties, userList[u_i])
    analytics.identify(userList[u_i].user_id, properties, {timestamp:timestamp})
    firedEvents.push(parseInt(schemaObject[e_i][0]))
  }
  if (schemaObject[e_i][1] === "track") {
    let properties = createProps(schemaObject[e_i]);
    analytics.track(schemaObject[e_i][2], properties, {
      anonymousId: userList[u_i].anonymousId,
      timestamp:timestamp
    })
    firedEvents.push(parseInt(schemaObject[e_i][0]))
  }
  // next event
  if (schemaObject[e_i+1]) {
    launcher(schemaObject, userList, u_i, e_i+1,firedEvents)
  } else if (userList[u_i+1]) {
    launcher(schemaObject, userList, u_i+1, 1,[])
  } else {
    return "finished"
  }
}

// launcher(schemaObject, userList, 0, 0, [])

function App() {
  const [dataArr, setDataArr] = useState([])
  
  return (
    <div className="App">
      <header className="App-header">
        <CSVReader2 
          setDataArr={setDataArr}
        />
        
        <a href="button1" onClick={()=>launcher(dataArr, userList, 0, 1, [])} className="button1">
          Activate Lasers
        </a>

          
      </header>
      
    </div>
  );
}

export default App;



