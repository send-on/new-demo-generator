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
const userList = require('./users.json')

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
  // remove non property/traits from array
  let propsObject = e.slice(firstProp)
  propsObject = propsObject.filter(function(el) { return el; });
  const properties = {}

  // create properties object, randomize array element selection per iteration, sanitize 
  for (let i = 0; i < propsObject.length; i++) {
    let temp = propsObject[i].split([":"]);
    temp[1] = temp[1].split(',')
    let randomValue = sanitize(temp[1][getRandomInt(temp[1].length)])
    properties[temp[0]] = randomValue
  }
  return properties;
}

const launcher = async (dataArr, userList, u_i, e_i, firedEvents=[], setIsLoading=false, analytics, setCounter, counter) => {
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

  // Identify
  if (dataArr[e_i][1] === "identify") {
    let properties = createProps(dataArr[e_i]);
    Object.assign(properties, userList[u_i]);
    delete properties.user_id;
    delete properties.anonymousId;
    firedEvents.push(parseInt(dataArr[e_i][0]))
    await analytics.identify(userList[u_i].user_id, properties, 
      {timestamp:timestamp}
    )
  }

  // Track
  if (dataArr[e_i][1] === "track") {
    let properties = createProps(dataArr[e_i]);
    firedEvents.push(parseInt(dataArr[e_i][0]))
    await analytics.track(dataArr[e_i][2], properties, {
      anonymousId: userList[u_i].anonymousId,
      timestamp:timestamp
    }) 
  }
  counter++;
  // next event
  if (dataArr[e_i+1]) {    
    if (counter%100 === 0) setCounter(counter)
    setTimeout(()=>launcher(dataArr, userList, u_i, e_i+1,firedEvents, setIsLoading, analytics, setCounter, counter), 10)
  } else if (userList[u_i+1]) {
    if (counter%100 === 0) setCounter(counter)
    setTimeout(()=>launcher(dataArr, userList, u_i+1, 1,[], setIsLoading, analytics, setCounter, counter), 10)
  } else {
    setCounter(counter);
    setIsLoading(false);
    return "finished"
  }
}

const App = () => {
  const [dataArr, setDataArr] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [csvLoaded, setCsvLoaded] = useState(false);
  const [writeKey, setWriteKey] = useState('');
  const [counter, setCounter] = useState(0);

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

  const incrementCounter = () => {
    setCounter(counter+1);
  }

  return (
    <div className="App">
      <header className="App-header">
        <h5>1. Enter Secret Write Key</h5>
      <input className="inputbox" type="text" placeholder="Write Key" onChange={e => setWriteKey(e.target.value)} />
        <CSVReader 
          setDataArr={setDataArr}
          setIsLoading={setIsLoading}
          setCsvLoaded={setCsvLoaded}
        />
        {!isLoading ? 
        <a 
          className="highlight button1" 
          onClick={()=>{if (csvLoaded)launcher(dataArr, userList, userList.length-1000, 1, [], setIsLoading, analytics, setCounter, 0)}} 
        >
          3. Activate Lasers
        </a> 
        :
        <a className="button1">WORKING</a> 
        }  
        <h5>{counter}</h5> Events Fired
      </header>     
    </div>
  );
}

export default App;



