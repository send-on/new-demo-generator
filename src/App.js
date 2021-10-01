import React, { useState } from 'react'
import './App.css';
import Analytics from "@segment/analytics.js-core/build/analytics";
import SegmentIntegration from "@segment/analytics.js-integration-segmentio";
import CSVReader from './parser';
import moment from 'moment';
import { generateUsers, generateRandomValue } from './util/faker'
import {
  unixDay,
  firstEvent,
  dependencyElement,
  dropoffElement,
  dayElement,
  randomizeElement,
  version
} from './constants/config'
import {
  createEventProps,
  checkDependency,
  shouldDropEvent,
  loadEventProps, 
} from './util/event'
import UserForm from './components/UserForm';

// setEvent instead of setCounter, setUserCounter

const launcher = async (
  dataArr, // data schema
  userList, 
  u_i, // index for user
  e_i, // index for event
  firedEvents={0:true}, // object of events fired
  setIsLoading, 
  analytics, 
  setCounter, 
  counter, 
  setUserCounter, 
  setStatus
  ) => {
  // reset ajs on new user
  setStatus("Working...");
  setIsLoading(true);
  if (e_i < 3) {
    analytics.reset();
    analytics.setAnonymousId(userList[u_i].anonymousId);
  }
  // Check for dropoff
  if (shouldDropEvent(dataArr[e_i][dropoffElement])) {
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
        let properties = createEventProps(dataArr[e_i], firedEvents);
        Object.assign(properties, userList[u_i]);
        delete properties.user_id;
        delete properties.anonymousId;
        firedEvents[parseInt(dataArr[e_i][0])] = properties
        await analytics.identify(userList[u_i].user_id, properties, 
          {timestamp:timestamp}
        );
      }

      if (dataArr[e_i][1] === "page") {
        let properties = createEventProps(dataArr[e_i], firedEvents);
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
        let properties = createEventProps(dataArr[e_i], firedEvents);
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
    setUserCounter(userList.length-1- u_i);
    setStatus("Finishing Up ...");
    let anonId = generateRandomValue(1); 
    loadEventProps(dataArr, 0, 2, {0:true}, analytics, setIsLoading, setStatus, anonId);
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
  const [status, setStatus] = useState("NOT READY: GENERATE USERS OR LOAD CSV");
  const [userButtonStatus, setUserButtonStatus] = useState("Click to Save Changes");

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

  const lockUserList = (numOfUsers, setUserList, setStatus, userList, setUserButtonStatus) => {
    if (userList.length > 0) { 
      setUserButtonStatus("Click to Save Changes")
      setUserList([])
    } else {
      setUserButtonStatus("Saved!")
      setUserList(generateUsers(numOfUsers));
    }    
    return
  }

  const onSubmit = (e) => {
    e.preventDefault();
    try {
      setUserList(JSON.parse(e.target.userList.value));
      setUserButtonStatus("Saved!")
    }
    catch(e) {
      console.log(e.message);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h5>1. Enter How many Users to Generate</h5>
      <div className="stepComponent">
        <input className="inputbox" type="text" placeholder="Number of Users (Recommended < 500)" onChange={e => setNumOfUsers(e.target.value)} />
        {userList.length > 0 ? 
        <button onClick={()=>lockUserList(numOfUsers, setUserList, setStatus, userList, setUserButtonStatus)} className="button">{`Users Set, Click to Reset`}</button>
        : 
        <button onClick={()=>lockUserList(numOfUsers, setUserList, setStatus, userList, setUserButtonStatus)} className="button">Generate Users</button>
        }
      </div>

      <div style={{marginTop: "0.5em", width: "100%"}}>
        <UserForm 
        userList={userList} 
        onSubmit={onSubmit} 
        userButtonStatus={userButtonStatus} 
        setUserButtonStatus={setUserButtonStatus} 
        /> 
      </div>
      <div className="note">Note: You can save your user list, import another list, or make changes directly.  Don't forget the commas and click Save after! </div>

      <h5>2. Enter Source 
        <a style={{color:"white"}} href="https://segment.com/docs/getting-started/02-simple-install/#find-your-write-key">Write Key</a>
        </h5>
        <form>
          <input name="source" autoComplete="on" className="inputbox" type="text" placeholder="Write Key" onChange={e => setWriteKey(e.target.value)} /> 
        </form>

        <CSVReader 
          setDataArr={setDataArr}
          setIsLoading={setIsLoading}
          setCsvLoaded={setCsvLoaded}
          setStatus={setStatus}
        />
        <div>
        <h5>4. Fire Events</h5>
        {!isLoading && (userList.length > 0) ? 
        <button 
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
        </button> 
        :
        <button className="button1">{status}</button> 
        }  
        </div>
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