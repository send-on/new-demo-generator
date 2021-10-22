import React, { useState, useEffect } from 'react';
import { SideSheet, Pane, Heading, Card, Button } from 'evergreen-ui';
import { toaster } from 'evergreen-ui'

function Notepad() {
  const [isShown, setIsShown] = React.useState(false)
  const [webKey, setWebKey] = useState(localStorage.getItem("web") ?? "");
  const [serverKey, setServerKey] = useState(localStorage.getItem("server") ?? "");
  const [emailKey, setEmailKey] = useState(localStorage.getItem("email") ?? "");
  const [appleKey, setAppleKey] = useState(localStorage.getItem("apple") ?? "");
  const [androidKey, setAndroidKey] = useState(localStorage.getItem("android") ?? "");
  const [otherKey, setOtherKey] = useState(localStorage.getItem("other") ?? "");

  const handleChange = (e) => {
    if (e.target.name === "web") {
      setWebKey(e.target.value);
    } else if (e.target.name === "apple") {
      setAppleKey(e.target.value);
    } else if (e.target.name === "android") {
      setAndroidKey(e.target.value);
    } else if (e.target.name === "other") {
      setOtherKey(e.target.value);
    } else if (e.target.name === "server") {
      setServerKey(e.target.value);
    } else if (e.target.name === "email") {
      setEmailKey(e.target.value);
    }
  }

  const saveToMemory = () => {
    localStorage.setItem('web', webKey);
    localStorage.setItem('server', serverKey);
    localStorage.setItem('email', emailKey);
    localStorage.setItem('apple', appleKey);
    localStorage.setItem('android', androidKey);
    localStorage.setItem('other', otherKey);
    toaster.success("Saved Keys to Browser LocalStorage")
  }

  return (
    <React.Fragment>
      <SideSheet
        isShown={isShown}
        onCloseComplete={() => setIsShown(false)}
        containerProps={{
          display: 'flex',
          flex: '1',
          flexDirection: 'column'
        }}
      >
        <Pane zIndex={1} flexShrink={0} elevation={0} backgroundColor="white">
          <Pane padding={16}>
            <Heading size={600}>Writekey Notepad (Save Keys)</Heading>
          </Pane>
        </Pane>
        <Pane flex="1" overflowY="scroll" background="tint1" padding={16}>
          <Card
            backgroundColor="white"
            elevation={0}
            height={480}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <div>

              <div><input onChange={handleChange} className="notepad" type="text" name="web" placeholder="Web" defaultValue={webKey} /></div>
              <div><input onChange={handleChange} className="notepad" type="text" name="server" placeholder="Server" defaultValue={serverKey}/></div>
              <div><input onChange={handleChange} className="notepad" type="text" name="email" placeholder="Email" defaultValue={emailKey}/></div>
              <div><input onChange={handleChange} className="notepad" type="text" name="apple" placeholder="iOS" defaultValue={appleKey}/></div>
              <div><input onChange={handleChange} className="notepad" type="text" name="android" placeholder="Android" defaultValue={androidKey} /></div>
              <div><input onChange={handleChange} className="notepad" type="text" name="other" placeholder="Other" defaultValue={otherKey}/></div>
              <div style={{textAlign: "center"}}><Button appearance="primary" style={{margin: "2em 0em 0em 0em"}} onClick={()=>saveToMemory()}className="button">Save</Button></div>
            </div>
          {/* <Button style={{"marginBottom":"10px"}} onClick={() => setIsShown(true)}>Add {tabName.slice(0,-1)}</Button> */}
      

            
            
          </Card>
        </Pane>
      </SideSheet>
      <Button onClick={() => setIsShown(true)}>Show Write Key Notepad</Button>
    </React.Fragment>
  )
}

export default Notepad