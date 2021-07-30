import React, { useState } from 'react'
import './App.css';
import Analytics from "@segment/analytics.js-core/build/analytics";
import SegmentIntegration from "@segment/analytics.js-integration-segmentio";
import CSVReader from './parser.js';
import moment from 'moment';
import {writeKey} from './config.js'
const unixDay = 86400;
const unixHour = 3600;
const firstProp = 8

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
const getRandomInt = (max) => {
  return Math.floor(Math.random() * max);
}



const sanitize = (s) => {
  if (s.includes(false)) return false;
  if (s.includes(true)) return true;
  s = s.replace('\"', "");
  s = s.replace("[", "");
  s = s.replace("]", "");
  s = s.replace('"', "");
  s = s.trim();
  return s
}

const createProps = (e) => {
  let propsObject = e.slice(firstProp)
  
  propsObject = propsObject.filter(function(el) { return el; });
  const properties = {}
  for (let i = 0; i < propsObject.length; i++) {
    let temp = propsObject[i].split([":"]);
    temp[1] = temp[1].split(',')
    let randomValue = sanitize(temp[1][getRandomInt(temp[1].length)])
    properties[temp[0]] = randomValue
  }
  return properties;
}

const launcher = (dataArr, userList, u_i, e_i, firedEvents=[], setIsLoading=false) => {
  // reset ajs on new user
  setIsLoading(true);
  if (e_i === 0) {
    analytics.reset();
    analytics.setAnonymousId(userList[u_i].anonymousId)
  }
  // Handle time set time, index 6 is days_ago, index 7 is hours
  let timestamp = moment().unix()
  if (dataArr[e_i][6]) {
    timestamp = timestamp - dataArr[e_i][6]*unixDay
    if (dataArr[e_i][7]) {
      timestamp = timestamp - Math.floor((Math.random() * (parseFloat(dataArr[e_i][7]))*unixHour))
    }
  }
  timestamp = moment(timestamp, "X").format();

  
  if (dataArr[e_i][1] === "identify") {
    let properties = createProps(dataArr[e_i]);
    Object.assign(properties, userList[u_i]);
    delete properties.user_id;
    delete properties.anonymousId;
    analytics.identify(userList[u_i].user_id, properties, {timestamp:timestamp})
    firedEvents.push(parseInt(dataArr[e_i][0]))
  }
  if (dataArr[e_i][1] === "track") {
    let properties = createProps(dataArr[e_i]);
    analytics.track(dataArr[e_i][2], properties, {
      anonymousId: userList[u_i].anonymousId,
      timestamp:timestamp
    })
    firedEvents.push(parseInt(dataArr[e_i][0]))
  }
  // next event
  if (dataArr[e_i+1]) {
    launcher(dataArr, userList, u_i, e_i+1,firedEvents, setIsLoading)
  } else if (userList[u_i+1]) {
    launcher(dataArr, userList, u_i+1, 1,[], setIsLoading)
  } else {
    return "finished"
  }
}

const App = () => {
  const [dataArr, setDataArr] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [csvLoaded, setCsvLoaded] = useState(false);
  
  return (
    <div className="App">
      <header className="App-header">
        <CSVReader 
          setDataArr={setDataArr}
          setIsLoading={setIsLoading}
          setCsvLoaded={setCsvLoaded}
        />
        {!isLoading ? 
        <a 
          className="highlight button1" 
          onClick={()=>{if (csvLoaded)launcher(dataArr, userList, 0, 1, [], setIsLoading)}} 
        >
          Activate Lasers
        </a> 
        :
        <a className="button1"  >DONE</a> 
        }  
      </header>
      
    </div>
  );
}

export default App;



