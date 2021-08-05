import React, { useState } from 'react'
import './App.css';
import Analytics from "@segment/analytics.js-core/build/analytics";
import SegmentIntegration from "@segment/analytics.js-integration-segmentio";
import CSVReader from './parser.js';
import moment from 'moment';
import { generateUsers } from './faker.js'

// Constants - DO NOT CHANGE
const unixDay = 86400;
const firstEvent = 2;
const firstProp = 7;
const dependencyElement = 3;
const dropoffElement = 4;
const dayElement = 5;
const randomizeElement = 6;
const version = 1.1;

// Helper functions
const getRandomInt = (max) => {
  return Math.floor(Math.random() * max);
}

const isNumeric = (str) => {
  if (typeof str != "string") return false 
  return !isNaN(str) && 
         !isNaN(parseFloat(str)) 
}

const sanitize = (s) => {
  if (s.includes(false)) return false;
  if (s.includes(true)) return true;
  s = s.replace('\"', "");
  s = s.replace("[", "");
  s = s.replace("]", "");
  s = s.replace('"', "");
  s = s.trim();
  if (isNumeric(s)) return parseFloat(s);
  return s
}

const createProps = (e, firedEvents) => {
  // remove non property/traits from array
  let recallNum = parseInt(e[dependencyElement]);
  let propsObject = e.slice(firstProp);
  propsObject = propsObject.filter(function(el) { return el; });
  const properties = {};
  // create properties object, randomize array element selection per iteration, sanitize 
  for (let i = 0; i < propsObject.length; i++) {
    let temp = propsObject[i].split([":"]);
    // check for * recall
    if (temp[1].includes("*") && (firedEvents[recallNum])) {
      if (firedEvents[recallNum][temp[0]] !== undefined) properties[temp[0]] = firedEvents[recallNum][temp[0]]
    } else {
      temp[1] = temp[1].split(',')
      // if val[0] is array
      if (temp[0].includes("[")) {
        // Create tuple from key [prop, 2]
        let tuple = [
          sanitize(temp[0].split(',')[0]),
          sanitize(temp[0].split(',')[1])
        ]
        let randomValue = [];
        // Push in random value i times, pop out element when chosen (block if too many)
        if (tuple[1] > temp[1].length) tuple[1] = temp[1].length;
        for (let i = 0; i < tuple[1]; i++) {
          let randomInt = getRandomInt(temp[1].length)
          randomValue.push(sanitize(temp[1][randomInt]));
          temp[1].splice(randomInt,1);
        }
        properties[tuple[0]] = randomValue;
      } else { 
        // randomly choose element in array
        let randomValue = sanitize(temp[1][getRandomInt(temp[1].length)]);
        properties[temp[0]] = randomValue;
      }
    }
  }
  return properties;
}

const checkDependency = (dependentOn, firedEvents={}) => (
  (dependentOn in firedEvents ? true : false)
)

const shouldDrop = (dropoff) => (
  (parseFloat(dropoff) < (Math.floor(Math.random() * 101))) ? false : true
)

const launcher = async (
  dataArr, // data schema
  userList, 
  u_i, // index for user
  e_i, // index for event
  firedEvents={0:true}, // object of events fired
  setIsLoading=false, 
  analytics, 
  setCounter, 
  counter, 
  setUserCounter, 
  setStatus
  ) => {
  // reset ajs on new user
  setIsLoading(true);
  if (e_i < 3) {
    analytics.reset();
    analytics.setAnonymousId(userList[u_i].anonymousId);
  }
  // Check for dropoff
  if (shouldDrop(dataArr[e_i][dropoffElement])) {
    // Check for dependency 
    if (!dataArr[e_i][dependencyElement] || (dataArr[e_i][dependencyElement] < 1)) {
      // if no dependency exists, set dependency to 1
      dataArr[e_i][dependencyElement] = 0
    } 
    if (checkDependency(dataArr[e_i][dependencyElement], firedEvents) || e_i === firstEvent) {
      // Handle time set time, index 6 is days_ago, index 7 is hours
      let timestamp = moment().unix();
      if (dataArr[e_i][dayElement]) timestamp = timestamp - dataArr[e_i][dayElement]*unixDay
      if (dataArr[e_i][randomizeElement]) timestamp = timestamp - Math.floor((Math.random() * (parseFloat(dataArr[e_i][randomizeElement]))*unixDay));
      timestamp = moment(timestamp, "X").format();

      counter++;
      // Identify
      if (dataArr[e_i][1] === "identify") {
        let properties = createProps(dataArr[e_i], firedEvents);
        Object.assign(properties, userList[u_i]);
        delete properties.user_id;
        delete properties.anonymousId;
        firedEvents[parseInt(dataArr[e_i][0])] = properties
        await analytics.identify(userList[u_i].user_id, properties, 
          {timestamp:timestamp}
        );
      }

      // Track
      if (dataArr[e_i][1] === "track") {
        let properties = createProps(dataArr[e_i], firedEvents);
        firedEvents[parseInt(dataArr[e_i][0])] = properties
        await analytics.track(dataArr[e_i][2], properties, {
          anonymousId: userList[u_i].anonymousId,
          timestamp:timestamp
        });
      }
    }
  }
  
  // set event and user counters
  
  if (u_i%10 === 0) setUserCounter(userList.length - u_i)

  // next event
  if (dataArr[e_i+1]) {    
    if (counter%100 === 0) setCounter(counter);
    setTimeout(()=>launcher(
      dataArr, 
      userList, 
      u_i, 
      e_i+1,
      firedEvents, 
      setIsLoading, 
      analytics, 
      setCounter, 
      counter, 
      setUserCounter, 
      setStatus
      ), 10);
  } else if (userList[u_i+1]) {
    if (counter%100 === 0) setCounter(counter);
    setTimeout(()=>launcher(
      dataArr, 
      userList, 
      u_i+1, 
      1,
      {0:true}, 
      setIsLoading, 
      analytics, 
      setCounter, 
      counter, 
      setUserCounter, 
      setStatus
      ), 10);
  } else {
    setCounter(counter);
    setUserCounter(userList.length-1- u_i)
    setIsLoading(false);
    setStatus("DONE, Fire Again?")
    return "finished";
  }
}

const App = () => {
  const [dataArr, setDataArr] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [csvLoaded, setCsvLoaded] = useState(false);
  const [writeKey, setWriteKey] = useState('');
  const [counter, setCounter] = useState(0);
  const [numOfUsers, setNumOfUsers] = useState(1);
  const [userList, setUserList] = useState([]);
  const [userCounter, setUserCounter] = useState(0);
  const [status, setStatus] = useState("NOT READY: GENERATE USERS")

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

  const lockUserList = (numOfUsers, setUserList, setStatus) => {
    setStatus("3. ACTIVATE LASERS")
    setUserList(generateUsers(numOfUsers));
    return
  }

  return (
    <div className="App">
      <header className="App-header">
        <h5>1. Enter Source <a style={{color:"white"}} href="https://segment.com/docs/getting-started/02-simple-install/#find-your-write-key">Write Key</a></h5>
      <input className="inputbox" type="text" placeholder="Write Key" onChange={e => setWriteKey(e.target.value)} /> 
      <input className="inputbox" type="text" placeholder="Number of Users (0 to 10000)" onChange={e => setNumOfUsers(e.target.value)} />
      {userList.length > 0 ? 
      <a href="/#" onClick={()=>lockUserList(numOfUsers, setUserList, setStatus)} className="button1">{`DONE -> ${userList.length} Users Set`}</a>
      : 
      <a href="/#" onClick={()=>lockUserList(numOfUsers, setUserList, setStatus)} className="button1">Generate Users</a>
      }
        <CSVReader 
          setDataArr={setDataArr}
          setIsLoading={setIsLoading}
          setCsvLoaded={setCsvLoaded}
        />
        {!isLoading && (userList.length > 0) ? 
        <a href="/#"
          className="highlight button1" 
          onClick={()=>{
            if (csvLoaded) launcher(dataArr, 
              userList, 
              userList.length-numOfUsers, 
              2, 
              {0:true}, 
              setIsLoading, 
              analytics, 
              setCounter, 
              0, 
              setUserCounter, 
              setStatus
              )
            }
          } 
        >
          {status}
        </a> 
        :
        <a href="/#" className="button1">{status}</a> 
        }  
        <h4>{counter}</h4> Events Fired
        <h4>{userCounter}</h4> Users Remaining
        <div></div>
        <h6>
          <a rel="noreferrer" href="https://docs.google.com/spreadsheets/d/13XXBkNGFTms5o-6A3A3vqmIoVBUqkxSgvj9ghTTYGdI/edit?usp=sharing" target="_blank">v{version} - Template</a><br></br><br></br>
          <a rel="noreferrer" href="https://github.com/send-on/new-demo-generator" target="_blank">README</a>
        </h6>
        
      </header>     
    </div>
  );
}

export default App;