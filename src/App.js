import React, { useState } from 'react'
import './App.css';
import Analytics from "@segment/analytics.js-core/build/analytics";
import SegmentIntegration from "@segment/analytics.js-integration-segmentio";
import CSVReader from './parser.js';
import moment from 'moment';
import { generateUsers, generateRandomValue } from './faker.js'

// Constants - DO NOT CHANGE
const unixDay = 86400;
const firstEvent = 2;
const firstProp = 7;
const dependencyElement = 3;
const dropoffElement = 4;
const dayElement = 5;
const randomizeElement = 6;
const version = 1.4;

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
  s = s.replace("{", "");
  s = s.replace("}", "");
  s = s.replace('"', "");
  s = s.trim();
  if (isNumeric(s)) return parseFloat(s);
  return s
}

const checkIsArrayAndHasEvent = (recallArr, firedEvents) => {
  let isArrayAndHasEvent = false
  if (Array.isArray(recallArr)) {
    recallArr.forEach(e => {
      if (firedEvents[e]) isArrayAndHasEvent = e
    })
  } 
  return isArrayAndHasEvent
}

const removeMissingEvents = (newRecallCell, firedEvents) => {
  let newArr = []; 
  for (let i = 0; i < newRecallCell.length; i++) {
    if (firedEvents[newRecallCell[i]]) newArr.push(newRecallCell[i])
  }
  return newArr;
}

const createMultipleProperty = (val, firedEvents, recallCell ) => {
  let newRecallCell = recallCell.map(e => JSON.stringify(e));
  let outputArr = [];
  let sourceArr = val.split(",");
  sourceArr = sourceArr.map(e => sanitize(e))
  newRecallCell = removeMissingEvents(newRecallCell, firedEvents)
  for (let i = 0; i < newRecallCell.length; i++) {
    let tempObj = {};
    for (let y = 0; y < sourceArr.length; y++) {
      tempObj[sourceArr[y]] = firedEvents[newRecallCell[i]][sourceArr[y]]
    }
    outputArr.push(tempObj);
  }
  return outputArr
}

const createProps = (e, firedEvents) => {
  // set recallNum for single value
  let recallNum = "0"
  let recallCell = "0"
  if (e[dependencyElement]) {
    recallNum = parseInt(e[dependencyElement])
    recallCell = JSON.parse(e[dependencyElement])
  } 
  
  // set recallNum to existing value based on dependency
  if (Array.isArray(recallCell)) recallNum = checkIsArrayAndHasEvent(recallCell, firedEvents)

  // remove non property/traits from array
  let propsObject = e.slice(firstProp);
  propsObject = propsObject.filter(function(el) { return el; });
  const properties = {};
  // create properties object, randomize array element selection per iteration, sanitize 
  for (let i = 0; i < propsObject.length; i++) {
    let temp = propsObject[i].split([":"]);
    // check for * recall
    if (temp[1].includes("*") && (firedEvents[recallNum])) {
      if (firedEvents[recallNum][temp[0]] !== undefined) properties[temp[0]] = firedEvents[recallNum][temp[0]]
    } else if (temp[1].includes("{") && Array.isArray(recallCell)) {
      properties[temp[0]] = createMultipleProperty(temp[1], firedEvents, recallCell);
    } else if (temp[1].includes('##')) {
      properties[temp[0]] = generateRandomValue(1);
    } else if (temp[1].includes ('#')) {
      properties[temp[0]] = generateRandomValue(0);
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

const checkDependency = (dependentOn, firedEvents={}) => {
  let parsedDependentOn = JSON.parse(dependentOn)
  if (Array.isArray(parsedDependentOn)) { 
    return checkIsArrayAndHasEvent(parsedDependentOn, firedEvents)
  } else {
    return (dependentOn in firedEvents ? true : false)
  }
}

const shouldDrop = (dropoff) => {
  return (parseFloat(dropoff) < (Math.floor(Math.random() * 101))) ? false : true;
}
  

const loadProps = (dataArr, u_i, e_i, firedEvents, analytics, setIsLoading, setStatus, anonId) => {
  if (dataArr[e_i][1] === "identify") {
    let properties = createProps(dataArr[e_i], firedEvents);
    firedEvents[parseInt(dataArr[e_i][0])] = properties
    analytics.identify(anonId, properties);
  }
  if (dataArr[e_i][1] === "page") {
    let properties = createProps(dataArr[e_i], firedEvents);
    firedEvents[parseInt(dataArr[e_i][0])] = properties
    analytics.page(dataArr[e_i][2], properties);
  }

  if (dataArr[e_i][1] === "track") {
    let properties = createProps(dataArr[e_i], firedEvents);
    firedEvents[parseInt(dataArr[e_i][0])] = properties
    analytics.track(dataArr[e_i][2], properties, {
      anonymousId: anonId,
    });
  } 
  // next event
  if (dataArr[e_i+1]) {
    setTimeout(()=>loadProps(
      dataArr,
      u_i,
      e_i+1,
      firedEvents,
      analytics, 
      setIsLoading,
      setStatus, 
      anonId
    ), 10)
  } else if (u_i < 10) {
    setTimeout(()=>loadProps(
      dataArr,
      u_i+1,
      1,
      firedEvents,
      analytics, 
      setIsLoading,
      setStatus, 
      anonId
    ), 10)
  } else {
    setIsLoading(false);
    setStatus("DONE, Fire Again?");
  }
}

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
  setStatus("Working...")
  setIsLoading(true);
  if (e_i < 3) {
    analytics.reset();
    analytics.setAnonymousId(userList[u_i].anonymousId);
  }
  // Check for dropoff
  if (shouldDrop(dataArr[e_i][dropoffElement])) {
    // Check for dependency 
    if (!dataArr[e_i][dependencyElement] || (dataArr[e_i][dependencyElement] < 1)) {
      // if no dependency exists, set dependency to 0
      dataArr[e_i][dependencyElement] = "0";
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

      if (dataArr[e_i][1] === "page") {
        let properties = createProps(dataArr[e_i], firedEvents);
        Object.assign(properties, userList[u_i]);
        delete properties.user_id;
        delete properties.anonymousId;
        firedEvents[parseInt(dataArr[e_i][0])] = properties
        await analytics.page(dataArr[e_i][2], properties, 
          {
            anonymousId: userList[u_i].anonymousId,
            timestamp:timestamp
          }
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
      2,
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
    setStatus("Finishing Up ...")
    let anonId = generateRandomValue(1); 
    loadProps(dataArr, 0, 2, {0:true}, analytics, setIsLoading, setStatus, anonId);
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
  const [status, setStatus] = useState("NOT READY: GENERATE USERS OR LOAD CSV")

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
    setUserList(generateUsers(numOfUsers));
    return
  }

  return (
    <div className="App">
      <header className="App-header">
        <h5>1. Enter How many Users to Generate</h5>
      
      <input className="inputbox" type="text" placeholder="Number of Users (Recommended < 500)" onChange={e => setNumOfUsers(e.target.value)} />

      
      {userList.length > 0 ? 
      <a href="/#" onClick={()=>lockUserList(numOfUsers, setUserList, setStatus)} className="button1">{`DONE -> ${userList.length} Users Set, Click to Regenerate`}</a>
      : 
      <a href="/#" onClick={()=>lockUserList(numOfUsers, setUserList, setStatus)} className="button1">Generate Users</a>
      }
      <div className="note">Note: Each time you click will generate a new set of users. To re-use the same user set for multiple sources or data sets, do not repeat this step moving forward</div>

      <h5>2. Enter Source <a style={{color:"white"}} href="https://segment.com/docs/getting-started/02-simple-install/#find-your-write-key">Write Key</a></h5>
      <input className="inputbox" type="text" placeholder="Write Key" onChange={e => setWriteKey(e.target.value)} /> 
        <CSVReader 
          setDataArr={setDataArr}
          setIsLoading={setIsLoading}
          setCsvLoaded={setCsvLoaded}
          setStatus={setStatus}
        />

        <h5>4. Fire Events</h5>
        {!isLoading && (userList.length > 0) ? 
        <a href="#!"
          className="highlight button1" 
          onClick={()=>{
            if (csvLoaded) launcher(
              dataArr, // array of events
              userList, // array of all users
              userList.length-numOfUsers, // user position index
              2, // event position index
              {"0":true},  // firedEvents
              setIsLoading, 
              analytics, 
              setCounter, 
              0,  //event counter
              setUserCounter, 
              setStatus
              )
            }
          } 
        >
          {status}
        </a> 
        :
        <a href="#!" className="button1">{status}</a> 
        }  
        <h4>{counter}</h4> Events Fired
        <h4>{userCounter}</h4> Users Remaining
        <div></div>
        <h6>
          <a rel="noreferrer" href="https://docs.google.com/spreadsheets/d/1QpgfIq1VgGBy9iMNekSR80J2JHCmDaAPwEUH8_NDWcA/edit#gid=934482474" target="_blank">v{version} - Template</a><br></br><br></br>
          <a rel="noreferrer" href="https://github.com/send-on/new-demo-generator" target="_blank">README</a>
        </h6>
        
      </header>     
    </div>
  );
}

export default App;