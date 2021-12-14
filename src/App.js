import React, { useState } from 'react'
import './App.css';
import Analytics from "@segment/analytics.js-core/build/analytics";
import SegmentIntegration from "@segment/analytics.js-integration-segmentio";
import CSVReader from './components/Parser';
import { toaster, Button, TextInput } from 'evergreen-ui'
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
  createObjectProperty,
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
      let timestampArr = createTimestamp(eventList[e_i], firedEvents);
      let timestamp = timestampArr[0]
      let properties = createEventProps(eventList[e_i], firedEvents);
      let contextObj = createEventContext(properties); 
      let propertiesWithObjects = createObjectProperty(properties);

      counter++;
      let context = {
        anonymousId: userList[u_i].anonymousId,
        timestamp:timestamp,
        ...contextObj
      };

      let fireProperties = removeEventContext(properties); // remove properties for fire object
      Object.assign(fireProperties, propertiesWithObjects);
      
      if (isRealTime) delete context.timestamp;
      
      // Identify
      if (eventList[e_i][1] === "identify") {
        Object.assign(fireProperties, userList[u_i]);
        delete fireProperties.user_id;
        delete fireProperties.anonymousId;
        await analytics.identify(userList[u_i].user_id, fireProperties, context);
      }
      // Page
      if (eventList[e_i][1] === "page") {
        delete fireProperties.user_id;
        delete fireProperties.anonymousId;
        await analytics.page(eventList[e_i][2], eventList[e_i][2], fireProperties, context);
      }

      // Track
      if (eventList[e_i][1] === "track") {
        await analytics.track(eventList[e_i][2], fireProperties, context);
      }
      properties.timestampUnix = timestampArr[1]
      firedEvents[parseInt(eventList[e_i][0])] = properties; // save all properties incl context and timestamp
      
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
      setStatus("FIRE EVENTS");
      toaster.success(`All events fired!`, {id: 'single-toast'})
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
  const [status, setStatus] = useState("FIRE EVENTS");
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
      toaster.success("User list has been reset", {id: 'single-toast'})
    } else {
      setUserButtonStatus("Click to Save Changes ")
      setUserList(generateUsers(numOfUsers));
      toaster.success("Successfully generated user list", {id: 'single-toast'})
    }    
    return
  }

  const regenerateAnonymousId = (userList, setUserList) => {
    let temp = userList;
    for (let i = 0; i < temp.length; i++) {
      temp[i].anonymousId = generateRandomValue("##");
    }
    if (userButtonStatus === "Click to Save Changes ") {
      setUserButtonStatus("Click to Save Changes")
    } else {
      setUserButtonStatus("Click to Save Changes ")
    }
    setUserList(temp);
    toaster.success("Anonymous IDs have been regenerated", {id: 'single-toast'})
  }

  const onSubmit = (e) => {
    e.preventDefault();
    try {
      setUserList(JSON.parse(e.target.userList.value));
      toaster.success("Changes to user list saved", {id: 'single-toast'})
      setUserButtonStatus("Click to Save Changes")
    }
    catch(e) {
      toaster.danger(e.message, {id: 'single-toast'});
    }
  }

  

  return (
    <div className="App">
      <div className="navigation-header">
        <a href="/">
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHBhdGggZD0iTTMuMjYzIDE1LjU1N2MtLjYwNSAwLTEuMDk2LjUwNy0xLjA5NiAxLjEzMiAwIC42MjUuNDkgMS4xMzIgMS4wOTYgMS4xMzIuNjA1IDAgMS4wOTYtLjUwNyAxLjA5Ni0xLjEzMiAwLS42MjUtLjQ5LTEuMTMyLTEuMDk2LTEuMTMyek0xNS4zNDggMS44NzRjLS42MDUgMC0xLjA5Ni41MDctMS4wOTYgMS4xMzIgMCAuNjI1LjQ5IDEuMTMyIDEuMDk2IDEuMTMyLjYwNSAwIDEuMDk2LS41MDcgMS4wOTYtMS4xMzIgMC0uNjIzLS40ODgtMS4xMy0xLjA5Mi0xLjEzMmgtLjAwNHptLTcuOTMzIDQuNThWNy44NGMwIC4yMDguMTY0LjM3Ny4zNjYuMzc3aDEwLjg1NWMuMi0uMDAyLjM2MS0uMTcuMzYxLS4zNzdWNi40NTRhLjM3MS4zNzEgMCAwIDAtLjM2NS0uMzc3SDcuNzc2YS4zNzIuMzcyIDAgMCAwLS4zNjMuMzc3aC4wMDJ6bTQuMTc1IDYuNHYtMS4zODJhLjM3Mi4zNzIgMCAwIDAtLjM2NS0uMzc3SC4zN2EuMzcxLjM3MSAwIDAgMC0uMzcuMzczdjEuMzg3YzAgLjIwOC4xNjQuMzc3LjM2NS4zNzdoMTAuODU2YS4zNzEuMzcxIDAgMCAwIC4zNy0uMzczdi0uMDA0em03LjMzNC0xLjg1NmEuMzU5LjM1OSAwIDAgMC0uMjQ4LS4xNDJsLTEuMzM0LS4xNGEuMzY2LjM2NiAwIDAgMC0uMzk5LjMyNWMtLjU2MyA0LjMwMy00LjM5NiA3LjMyLTguNTYyIDYuNzRhNy40MSA3LjQxIDAgMCAxLTEuNjg2LS40NDMuMzU4LjM1OCAwIDAgMC0uNDY2LjIxNmwtLjUxNSAxLjI3OGEuMzguMzggMCAwIDAgLjIwOS40OTljNC45ODggMS45ODIgMTAuNTg4LS41ODggMTIuNTA3LTUuNzQxLjI3OC0uNzQ3LjQ2OS0xLjUyNS41NjctMi4zMThhLjM4LjM4IDAgMCAwLS4wNzMtLjI3NHpNLjA4IDcuODAyYS4zODQuMzg0IDAgMCAxLS4wNDQtLjI5MUMxLjEzNSAzLjA5MyA0Ljk5LjAwMyA5LjQwNyAwYTkuMzY3IDkuMzY3IDAgMCAxIDMuMTguNTUyLjM4OC4zODggMCAwIDEgLjIyMy40OTFsLS40NzQgMS4yOTVhLjM2LjM2IDAgMCAxLS40Ni4yMTUgNy4zNzYgNy4zNzYgMCAwIDAtMi40Ny0uNDMxIDcuMzcgNy4zNyAwIDAgMC00Ljc3MSAxLjc2QTcuOTMyIDcuOTMyIDAgMCAwIDIuMDUgOC4wMDlhLjM1OS4zNTkgMCAwIDEtLjQzNC4yNzJMLjMwOSA3Ljk3OWEuMzYzLjM2MyAwIDAgMS0uMjMtLjE3N3oiIGZpbGw9IiM1MEI2OEMiIC8+Cjwvc3ZnPgo=" alt="Segment" />
        </a>
        <div style={{flex:"2", marginLeft:"12px", fontSize: "16px", fontWeight: 600}}>Event Generator (v{version})</div>
        <div className="navigation-right" style={{flex: "1"}}>
          <div style={{marginRight: "3em", fontSize: "14px", fontWeight: 500}}><a rel="noreferrer" target="_blank" href="https://docs.google.com/spreadsheets/d/1QpgfIq1VgGBy9iMNekSR80J2JHCmDaAPwEUH8_NDWcA/edit#gid=934482474">Templates</a></div>
          <div style={{marginRight: "3em", fontSize: "14px", fontWeight: 500}}><a rel="noreferrer" target="_blank" href="https://segment.atlassian.net/wiki/spaces/SOLENG/pages/1904738629/Event+Generator+Formerly+Demo+Generator+2.0">Documentation</a></div>
          <div style={{marginRight: "3em", fontSize: "14px", fontWeight: 500}}><a rel="noreferrer" target="_blank" href="https://docs.google.com/spreadsheets/d/1zYPYBais9JLmO4XukU6_GQ6ltg-Uofcq0IbUjLb08rI/edit?usp=sharing">Share</a></div>
          <div style={{marginRight: "3em", fontSize: "14px", fontWeight: 500}}><a rel="noreferrer" target="_blank" href="https://github.com/send-on/new-demo-generator">Github</a></div>
        </div>
        
        
      </div>
      <header className="App-body">
        <div className="main">
          <div className="section">
            <div className="header">1. Enter Number of Users to Generate or Import List</div>
          <div className="stepComponent">
            <TextInput type="text" placeholder="Number of Users (i.e. 100)" onChange={e => setNumOfUsers(e.target.value)} />
            <Button appearance='primary' style={{marginLeft: "2em"}} onClick={()=>lockUserList(numOfUsers, setUserList, userList, setUserButtonStatus)} >{`Generate or Reset Users`}</Button>
          </div>

          <div style={{marginTop: "0.5em", width: "100%"}}>
            <UserForm 
            userList={JSON.stringify(userList, null, 2)} 
            onSubmit={onSubmit} 
            userButtonStatus={userButtonStatus} 
            setUserButtonStatus={setUserButtonStatus} 
            /> 
          </div>
          <Button style={{marginTop: "1em"}} onClick={()=>regenerateAnonymousId(userList, setUserList)} >Shuffle Anonymous ID</Button>
          <div className="note">Note: Click save when manually changing values in text field (including copying and pasting). </div>
        </div>
        <div className="section">
          <div className="header">2. Enter Source   
            <a style={{marginLeft:"3px"}} href="https://segment.com/docs/getting-started/02-simple-install/#find-your-write-key">Write Key</a>
          </div>
          <form>
            <TextInput name="source" autoComplete="on" className="inputbox" type="text" placeholder="Write Key" onChange={e => setWriteKey(e.target.value)} /> 
          </form>
          <Notepad />
        </div>
        
          <CSVReader 
            setEventList={setEventList}
            setIsLoading={setIsLoading}
            setCsvLoaded={setCsvLoaded}
            setStatus={setStatus}
          />

          <div style={{marginTop: "2em"}}>

          <div className="header">4. Fire Events (Turn Off Adblock)</div>
          <div>
            <Button style={{marginRight: "2em"}} onClick={()=>setIsRealTime(!isRealTime)} >Real-Time: {JSON.stringify(isRealTime)}</Button> 
            <TextInput style={{width: "275px"}} name="source" autoComplete="on" type="text" placeholder="[Optional] Firing Speed (Default 10ms)" onChange={e => setEventTimeout(e.target.value)} /> 
          </div> 
          <div style={{marginBottom:"0.25em"}} className="note">Note: Real-time: true will disable timestamp override (ignores Days Ago).</div>
          <div style={{marginBottom:"2em"}} className="note">It is recommended to fire events in Real time first using a few users to populate the Personas workspace. </div>
          {(!isLoading && (userList.length > 0) && (eventList.length > 0)) ? 
          <Button 
            isLoading={isLoading}
            size='large' 
            appearance='primary'
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
          </Button> 
          :
          <Button onClick={()=>toaster.warning(`Generate users or load CSV before firing. ${isLoading}`, {id: 'single-toast'}) } appearance='primary' size='large' isLoading={isLoading}>{status}</Button> 
          }  
          
          </div>
          <div style={{marginTop: "2em"}} className="note"><b>{counter}</b> Events Fired</div> 
          <div className="note"><b>{userCounter}</b> Users Remaining</div> 
          <div style={{marginTop: "2em", marginBottom: "2em"}} className="note">
          </div>
        </div>
      </header>     
    </div>
  );
}

export default App;