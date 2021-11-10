import React, { useState } from 'react'
import './App.css';
import Analytics from "@segment/analytics.js-core/build/analytics";
import SegmentIntegration from "@segment/analytics.js-integration-segmentio";
import CSVReader from './components/Parser';
import { toaster } from 'evergreen-ui'
import { generateUsers, generateRandomValue } from './util/faker'
import {
  firstEvent,
  dependencyElement,
  dropoffElement,
  version
} from './constants/config'
import {
  createEventProps,
  checkDependency,
  shouldDropEvent,
  loadEventProps, 
  createTimestamp, 
  createEventContext, 
  removeEventContext
} from './util/event'
import UserForm from './components/UserForm';
import Notepad from './components/Notepad';


const launcher = async (
  eventList, // data schema
  userList, 
  u_i, // index for user
  e_i, // index for event
  firedEvents={0:true}, // object of events fired
  setIsLoading, 
  analytics, 
  setCounter, 
  counter, 
  setUserCounter, 
  setStatus,
  isRealTime,
  eventTimeout=10
  ) => {
  // reset ajs on new user
  setStatus("Working...");
  setIsLoading(true);
  if (e_i < 3) {
    analytics.reset();
    analytics.setAnonymousId(userList[u_i].anonymousId);
  }
  // Check for dropoff
  if (shouldDropEvent(eventList[e_i][dropoffElement])) {
    // Check for dependency 
    if (!eventList[e_i][dependencyElement] || (eventList[e_i][dependencyElement] < 1)) {
      // if no dependency exists, set dependency to 0
      eventList[e_i][dependencyElement] = "0";
    } 
    if (checkDependency(eventList[e_i][dependencyElement], firedEvents) || e_i === firstEvent) {
      let timestamp = createTimestamp(eventList[e_i], firedEvents)[0];
      let properties = createEventProps(eventList[e_i], firedEvents);
      let contextObj = createEventContext(properties); 
      properties = removeEventContext(properties);

      counter++;
      let context = {
        anonymousId: userList[u_i].anonymousId,
        timestamp:timestamp,
        ...contextObj
      };
      if (isRealTime) delete context.timestamp;


      // Identify
      if (eventList[e_i][1] === "identify") {
        Object.assign(properties, userList[u_i]);
        delete properties.user_id;
        delete properties.anonymousId;
        await analytics.identify(userList[u_i].user_id, properties, context);
      }

      if (eventList[e_i][1] === "page") {
        delete properties.user_id;
        delete properties.anonymousId;
        await analytics.page(eventList[e_i][2], properties, context);
      }

      // Track
      if (eventList[e_i][1] === "track") {
        await analytics.track(eventList[e_i][2], properties, context);
      }
      properties.timestampUnix = createTimestamp(eventList[e_i], firedEvents)[1]
      firedEvents[parseInt(eventList[e_i][0])] = properties;
    }
  }
  
  // set event and user counters
  if (u_i%10 === 0) setUserCounter(userList.length - u_i)

  // next event
  if (eventList[e_i+1]) {    
    if (counter%100 === 0) setCounter(counter);
    setTimeout(()=>launcher(
      eventList, 
      userList, 
      u_i, 
      e_i+1,
      firedEvents, 
      setIsLoading, 
      analytics, 
      setCounter, 
      counter, 
      setUserCounter, 
      setStatus,
      isRealTime,
      eventTimeout
      ), eventTimeout ?? 10);
  } else if (userList[u_i+1]) {
    if (counter%100 === 0) setCounter(counter);
    setTimeout(()=>launcher(
      eventList, 
      userList, 
      u_i+1, 
      2,
      {0:true}, 
      setIsLoading, 
      analytics, 
      setCounter, 
      counter, 
      setUserCounter, 
      setStatus,
      isRealTime, 
      eventTimeout
      ), eventTimeout ?? 10);
  } else {
    setCounter(counter);
    setUserCounter(userList.length-1- u_i);
    setStatus("Finishing Up ...");
    let anonId = generateRandomValue("##"); 
    if (!isRealTime) {
      loadEventProps(eventList, 0, 2, {0:true}, analytics, setIsLoading, setStatus, anonId);
    } else {
      setIsLoading(false);
      setStatus("DONE, Fire Again?");
      toaster.success("All events fired!")
    }
    return "finished";
  }
}

const App = () => {
  // setEvent instead of setCounter, setUserCounter
  const [eventList, setEventList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [csvLoaded, setCsvLoaded] = useState(false);
  const [writeKey, setWriteKey] = useState('');
  const [counter, setCounter] = useState(0);
  const [numOfUsers, setNumOfUsers] = useState(1);
  const [userList, setUserList] = useState([]);
  const [userCounter, setUserCounter] = useState(0);
  const [status, setStatus] = useState("NOT READY: GENERATE USERS OR LOAD CSV");
  const [userButtonStatus, setUserButtonStatus] = useState("Click to Save Changes");
  const [isRealTime, setIsRealTime] = useState(false);
  const [eventTimeout, setEventTimeout] = useState(10)

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

  const lockUserList = (numOfUsers, setUserList, userList, setUserButtonStatus) => {
    if (userList.length > 0) { 
      setUserButtonStatus("Click to Save Changes")
      setUserList([])
      toaster.success("User List Reset")
    } else {
      setUserButtonStatus("Saved!")
      setUserList(generateUsers(numOfUsers));
      toaster.success("Successfully Generated User List!")
    }    
    
    return
  }

  const regenerateAnonymousId = (userList, setUserList) => {
    let temp = userList;
    for (let i = 0; i < temp.length; i++) {
      temp[i].anonymousId = generateRandomValue("##");
    }
    if (userButtonStatus === "Saved! ") {
      setUserButtonStatus("Saved!")
    } else {
      setUserButtonStatus("Saved! ")
    }
    toaster.success("Anonymous IDs Regenerated!")
    setUserList(temp);
  }

  const onSubmit = (e) => {
    e.preventDefault();
    try {
      setUserList(JSON.parse(e.target.userList.value));
      toaster.success("Changes to user list saved!")
      setUserButtonStatus("Saved!")
    }
    catch(e) {
      toaster.danger(e.message);
    }
  }

  

  return (
    <div className="App">
      <header className="App-header">
        <h5>1. Enter Number of Users to Generate or Import List</h5>
      <div className="stepComponent">
        <input className="inputbox" type="text" placeholder="Number of Users (Recommended < 500)" onChange={e => setNumOfUsers(e.target.value)} />
        {userList.length > 0 ? 
        <button onClick={()=>lockUserList(numOfUsers, setUserList, userList, setUserButtonStatus)} className="button">{`Users Set, Click to Reset`}</button>
        : 
        <button onClick={()=>lockUserList(numOfUsers, setUserList, userList, setUserButtonStatus)} className="button">Generate Users</button>
        }
        <button style={{marginLeft: "-1em"}}onClick={()=>regenerateAnonymousId(userList, setUserList)} className="button">Regenerate Anonymous ID</button>
      </div>

      <div style={{marginTop: "0.5em", width: "100%"}}>
        <UserForm 
        userList={JSON.stringify(userList, null, 2)} 
        onSubmit={onSubmit} 
        userButtonStatus={userButtonStatus} 
        setUserButtonStatus={setUserButtonStatus} 
        /> 
      </div>
      <div className="note">Note: You can save your user list, import another list, or make changes directly.  Don't forget the commas and click Save after! </div>

      <h5>2. Enter Source   
        <a  style={{color:"white", marginLeft:"3px"}} href="https://segment.com/docs/getting-started/02-simple-install/#find-your-write-key">Write Key</a>
        </h5>
        <form>
          <input name="source" autoComplete="on" className="inputbox" type="text" placeholder="Write Key" onChange={e => setWriteKey(e.target.value)} /> 
        </form>
        <Notepad />

        <CSVReader 
          setEventList={setEventList}
          setIsLoading={setIsLoading}
          setCsvLoaded={setCsvLoaded}
          setStatus={setStatus}
        />
        <div>
        
        <div><h5>4. Fire Events (Turn Off Adblock)</h5></div>
        <div>
          <button onClick={()=>setIsRealTime(!isRealTime)}style={{width:"250px"}} className="button">Real-Time: {JSON.stringify(isRealTime)}</button> 
          <input style={{width: "275px"}} name="source" autoComplete="on" className="inputbox" type="text" placeholder="[Optional] Firing Speed (Default 10ms)" onChange={e => setEventTimeout(e.target.value)} /> 
        </div> 
        <div style={{marginBottom:"0.25em"}} className="note">Note: Real-time: true will disable timestamp override (ignores Days Ago).</div>
        <div style={{marginBottom:"2em"}} className="note">It is recommended to fire events in Real time first using a few users to populate the Personas workspace. </div>
        {!isLoading && (userList.length > 0) ? 
        <button 
          className="highlight button1" 
          onClick={()=>{
            if (csvLoaded) launcher(
              eventList, // array of events
              userList, // array of all users
              0, // user position index
              2, // event position index
              {"0":true},  // firedEvents
              setIsLoading, 
              analytics, 
              setCounter, 
              0,  //event counter
              setUserCounter, 
              setStatus,
              isRealTime,
              eventTimeout
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