import React, { useState, useEffect } from 'react'
import './App.css';
import Analytics from "@segment/analytics.js-core/build/analytics";
import SegmentIntegration from "@segment/analytics.js-integration-segmentio";
import CSVReader from './components/CSVReader';
import { toaster, Button, TextInput, Tooltip, InfoSignIcon } from 'evergreen-ui'
import { generateUsers, generateRandomValue } from './util/faker'
import { generateSessionId } from './util/common.js';
import {
  firstEvent,
  dependencyElement,
  dropoffElement,
  defaultEventTimeout,
  usageTrackingWriteKey,
  nodeConfiguration
} from './constants/config'
import {
  createEventProps,
  checkDependency,
  shouldDropEvent,
  createTimestamp, 
  createEventContext, 
  createObjectProperty,
  removeEventContext, 
  fireNodeEvents,
  fireJSEvents
} from './util/event'

import GenerateUsers from './components/GenerateUsers';
import Source from './components/Source';
import Header from './components/Header';
const AnalyticsNode = require('analytics-node');

// Side tracking for product improvements
const analyticsSecondary = new AnalyticsNode(usageTrackingWriteKey, nodeConfiguration);

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
  isNode,
  eventTimeout=1, 
  analyticsOptional
  ) => {
  // reset ajs on new user
  setIsLoading(true);
  // reset traits in localStorage on each user for ajs
  if (e_i < 3 && !isNode) {
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
      let timestampArr = createTimestamp(eventList[e_i], firedEvents); // Create timestamp Tuple
      let timestamp = timestampArr[0] // parse out timestamp used in event
      let properties = createEventProps(eventList[e_i], firedEvents); // create event properties
      let contextObj = createEventContext(properties);  // create event context 
      let propertiesWithObjects = createObjectProperty(properties); // Handle nested objects 
      // If user is identified, set event property to true
      // This is used to determine if userId should be used in node analytics
      if (eventList[e_i][1] === "identify") firedEvents["identify"] = true

      // Generate a random IP for node analytics
      if (!firedEvents["ip"]) firedEvents['ip'] = generateRandomValue("#ip")

      counter++;
      let context = {
        timestamp: timestamp,
        ...contextObj
      };
      
      let fireProperties = removeEventContext(properties); // remove properties to fire object
      Object.assign(fireProperties, propertiesWithObjects); // Handle nested objects

      (isNode) ? 
      await fireNodeEvents(fireProperties, eventList, e_i, userList, u_i, context, analytics, timestamp, firedEvents, analyticsOptional) // Bulk Node Mode
      : 
      await fireJSEvents(fireProperties, eventList, e_i, userList, u_i, context, analytics, timestamp, analyticsOptional) // AJS mode
      
      properties.timestampUnix = timestampArr[1] // set unix time stamp before saving to memmory
      firedEvents[parseInt(eventList[e_i][0])] = properties; // save all properties incl context and timestamp
    }
  }
  
  // set event and user counters
  if (u_i%10 === 0 && !isNode) setUserCounter(userList.length - u_i)

  // next event
  if (eventList[e_i+1]) {    
    if (isNode) {
      launcher(
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
        isNode,
        eventTimeout, 
        analyticsOptional
        );
    } else {
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
        isNode,
        eventTimeout, 
        analyticsOptional
        ), eventTimeout ?? defaultEventTimeout);
    }
  } else if (userList[u_i+1]) {
    if (isNode) {
      launcher(
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
        isNode, 
        eventTimeout, 
        analyticsOptional,
        );
    } else {
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
        isNode, 
        eventTimeout,
        analyticsOptional,
        ), eventTimeout ?? defaultEventTimeout);
    }
  } else {
    setCounter(counter);
    setUserCounter(userList.length-1- u_i);
    setIsLoading(false);
    isNode 
    ? toaster.success("All events fired! ", {description: "Keep window open to allow node client to flush remaining events",id: 'single-toast'})
    : toaster.success(`All events fired!`, {id: 'single-toast'})
    
    analyticsSecondary.track({
      anonymousId: generateSessionId(),
      event: 'End Fired Events',
      properties: {
        numOfUsers: u_i,
        numOfEvents: e_i,
        isNode: isNode,
        eventTimeout: eventTimeout
      }
    });
    return "finished";
  }
}

const App = () => {
  const [eventList, setEventList] = useState([]); // Event Schema
  const [isLoading, setIsLoading] = useState(false); // Firing status
  const [csvLoaded, setCsvLoaded] = useState(false); // CSV loaded status
  const [writeKey, setWriteKey] = useState(usageTrackingWriteKey); // Write key - Default is usage tracking
  const [counter, setCounter] = useState(0); // Event counter
  const [numOfUsers, setNumOfUsers] = useState(1); // Number of users set
  const [userList, setUserList] = useState([]); // Generated User List
  const [userCounter, setUserCounter] = useState(0); // User Counter
  const [userButtonStatus, setUserButtonStatus] = useState("Click to Save Changes");
  const [isNode, setIsNode] = useState(true); // Node Analytics vs AJS
  const [eventTimeout, setEventTimeout] = useState(defaultEventTimeout) // Firing speed

  // Set primary and optional analytics clients
  const analyticsJS = new Analytics();
  const analyticsNode = new AnalyticsNode(writeKey ?? "placeholder", nodeConfiguration);
  const analyticsJSOptional = new Analytics();
  const analyticsNodeOptional = new AnalyticsNode(writeKey ?? "placeholder", nodeConfiguration);

  const integrationSettings = {
    "Segment.io": {
      apiKey: writeKey,
      retryQueue: true,
      addBundledMetadata: true
    }
  };

  // Initialize JS clients
  analyticsJS.use(SegmentIntegration);
  analyticsJS.initialize(integrationSettings);
  analyticsJSOptional.use(SegmentIntegration);
  analyticsJSOptional.initialize(integrationSettings);

  useEffect(() => {
    // Side tracking for product improvements
    analyticsJS.reset();
    analyticsJS.setAnonymousId(generateSessionId());
    analyticsJS.identify({
      userAgent: window.navigator.userAgent,
      path: document.location.href
    })
    setWriteKey('placeholder');
  }, [])

  const lockUserList = (numOfUsers, setUserList, userList, setUserButtonStatus) => {
    analyticsSecondary.track({
      anonymousId: generateSessionId(),
      event: 'Generate Users',
      properties: {
        numOfUsers: numOfUsers,
      }
    });

    if (userList.length > 0) { 
      setUserButtonStatus("Click to Save Changes")
      setUserList([])
      toaster.success("User list has been reset", {id: 'reset-toast'})
    } else {
      setUserButtonStatus("Click to Save Changes ") // The space is required, do not remove.
      setUserList(generateUsers(numOfUsers));
      toaster.success("User list successfully generated", {description: "If you modify user properties, remember to hit save.",id: 'user-toast'})
    }    
    return
  }

  const regenerateAnonymousId = (userList, setUserList) => {
    analyticsSecondary.track({
      anonymousId: generateSessionId(),
      event: 'Shuffle AnonymousId',
      properties: {
        numOfUsers: userList.length
      }
    });
    if (userList.length > 0) {
      let temp = userList;
      for (let i = 0; i < temp.length; i++) {
        temp[i].anonymousId = generateRandomValue("##");
      }
      // Random bug fix - do not change
      (userButtonStatus === "Click to Save Changes ") 
      ? setUserButtonStatus("Click to Save Changes")
      : setUserButtonStatus("Click to Save Changes ")
      setUserList(temp);
      toaster.success("Anonymous IDs have been regenerated", {description: "New anonymousId(s) have been saved", id: 'user-toast'})
    } else {
      toaster.danger("No users entered", {description: "Click generate users or paste custom", id: 'user-toast'})
    }
  }

  const onSubmit = async(e) => {
    e.preventDefault();
    analyticsSecondary.track({
      anonymousId: generateSessionId(),
      event: 'Saved User List'
    });
    try {
      if (userList.length > 0) {
        setUserList(JSON.parse(e.target.userList.value));
        toaster.success("User list has been saved", {id: 'user-toast'})
        setUserButtonStatus("Click to Save Changes")
      } else {
        toaster.danger("No users entered", {description: "Click generate users or paste custom", id: 'user-toast'})
      }
    }
    catch(e) {
      toaster.danger(e.message, {id: 'single-toast'});
      analyticsSecondary.track({
        anonymousId: generateSessionId(),
        event: 'User List Error',
      });
    }
  }
  
  return (
    <div className="App">
      <Header />
      <header className="App-body">
        <div className="main">
          <GenerateUsers 
            numOfUsers={numOfUsers}
            setNumOfUsers={setNumOfUsers}
            lockUserList={lockUserList}
            setUserList={setUserList}
            userList={userList}
            setUserButtonStatus={setUserButtonStatus}
            userButtonStatus={userButtonStatus}
            onSubmit={onSubmit}
            regenerateAnonymousId={regenerateAnonymousId}
          />
          <Source 
            setWriteKey={setWriteKey}
            analyticsSecondary={analyticsSecondary}
          />
        <div className="section">
          <CSVReader 
            setEventList={setEventList}
            setIsLoading={setIsLoading}
            setCsvLoaded={setCsvLoaded}
            analyticsSecondary={analyticsSecondary}
          />
        </div>

          <div className="section">
            <div className="header">
              Fire Events (Turn Off Adblock)  
              <div style={{marginLeft: "0.25em"}}>
                <Tooltip content="Toggle between AJS and Node Analytics (faster)">
                  <InfoSignIcon />
                </Tooltip>
              </div>
            </div>
            <div style={{marginTop: "0.5em"}}>
              <Button width={"150px"} style={{marginRight: "0.5em"}} onClick={()=>{
              toaster.success(`Switched analytics library to ${(isNode ? "analytics-node" : "Analytics JS")}`, {id: 'single-toast'})
              setIsNode(!isNode)}}>
                Analytics Mode: {(isNode ? "Node" : "AJS")}
              </Button> 
              
            </div> 
            <div>
              <TextInput style={{width: "300px"}} name="source" autoComplete="on" type="text" placeholder={`[Optional AJS] Speed: Default ${defaultEventTimeout}ms)`} onChange={e => setEventTimeout(e.target.value)} />
            </div>
            <div>
            {(!isLoading && (userList.length > 0) && (eventList.length > 0)) ? 
            <Button 
              isLoading={isLoading}
              size='large' 
              appearance='primary'
              onClick={()=>{
                if (csvLoaded) {
                  analyticsSecondary.track({
                    anonymousId: generateSessionId(),
                    event: 'Begin Fired Events',
                    properties: {
                      type: "Bulk",
                      numOfUsers: userList.length,
                      numOfEvents: eventList.length,
                      writeKey: writeKey,
                      eventTimeout: eventTimeout,
                      isNode: isNode
                    }
                  });
                  launcher(
                    eventList, // array of events
                    userList, // array of all users
                    0, // user position index
                    2, // event position index
                    {"0":true},  // firedEvents
                    setIsLoading, 
                    (isNode) ? analyticsNode : analyticsJS, 
                    setCounter, 
                    0,  //event counter
                    setUserCounter, 
                    isNode,
                    eventTimeout, 
                    (isNode) ? analyticsNodeOptional : analyticsJSOptional
                    )
                  }
                }
              } 
            >
              Dispatch Events
            </Button> 
            :
            <Button onClick={()=>toaster.warning(`Event Generator not ready`, {description: "Generate users or load CSV before firing", id: 'single-toast'}) } appearance='primary' size='large' isLoading={isLoading}>Dispatch Events</Button> 
            }  
            </div>
            
            <div className="note"><b>{counter}</b> Events Fired</div> 
            <div className="note"><b>{userCounter}</b> Users Remaining</div> 
            <div className="note">
            </div>
          </div>
        </div>
      </header>     
    </div>
  );
}

export default App;