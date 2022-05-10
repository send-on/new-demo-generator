import React, { useState } from 'react';
import { SideSheet, Pane, Heading, Card, Button, TextInput, IconButton, TrashIcon } from 'evergreen-ui';
import { toaster } from 'evergreen-ui'
import { generateSessionId } from '../util/common.js';

function Notepad({ analyticsSecondary }) {
  const [isShown, setIsShown] = React.useState(false);
  const [keys, setKeys] = useState(JSON.parse(localStorage.getItem("keys")) ?? [{name:"Source Name", value:"Write Key", index:0}]);

  const handleChange = (e) => {
    let el = e.target.attributes.name.value;
    let targetIndex = 0;
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].index === parseInt(el)) targetIndex = i
    }

    (e.target.attributes['placeholder'].value === "Source Name")
    ? keys[targetIndex]["name"] = e.target.value ?? "Source Name"
    : keys[targetIndex]["value"] = e.target.value ?? "Write Key"
    setKeys(keys);
  }

  const deleteKey = (index) => {
    if (index > -1 ) {
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].index === index) {
          keys.splice(i, 1)
        }
      }
      setKeys([...keys])
    }
    toaster.success("Write Key Deleted", {description: "Remember to hit save to save changes",id: 'single-toast'})
  }

  const addKey = () => {
    let highestIndex = 0;
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].index > highestIndex) highestIndex = keys[i].index
    }
    setKeys([...keys, {name: "", value: "", index: highestIndex+1}])
  }

  const saveToMemory = () => {
    localStorage.setItem('keys', JSON.stringify(keys));
    toaster.success("Saved Keys to Browser LocalStorage", {id: 'single-toast'})
    analyticsSecondary.track({
      anonymousId: generateSessionId(),
      event: 'Saved Writekey to Notepad',
      properties: {
        keys: keys
      }
    });
  }

  return (
    <div style={{"marginLeft":"8px"}}>
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
            <Heading size={600}>Writekey Notepad</Heading>
          </Pane>
        </Pane>
        <Pane flex="1" overflowY="scroll" background="tint1" padding={16}>
          <Card
            backgroundColor="white"
            elevation={0}
            display="flex"
            alignItems="top"
            justifyContent="center"
          >
            <div>
              
              {keys.map((key) => {
                return (
                  <div key={key.index} style={{"margin": "1em", "display": "flex"}}>
                    <TextInput width={"150px"} style={{marginRight: "1em"}} onChange={handleChange} type="text" name={key.index} placeholder="Source Name" defaultValue={key.name ?? "Source Name"} />
                    <TextInput width={"300px"} onChange={handleChange} type="text" name={key.index} placeholder="Write Key" defaultValue={key.value ?? "Write Key"} />
                    {(keys.length > 1) ? <IconButton name={key.index} style={{"marginTop": "8px", "marginLeft": "1em"}} icon={TrashIcon} intent="danger" onClick={()=>deleteKey(key.index)} /> : <div></div>}
                  </div>
                )
              })}
              <div style={{textAlign: "left", display: "block"}}>
                <Button appearance="primary" width={"70px"} style={{margin: "2em 1.5em 2em 1.5em"}} onClick={addKey}className="button">+ New</Button>
              </div>
            </div>
          </Card>
          <div style={{textAlign: "right", display: "block"}} ><Button appearance="primary" style={{margin: "2em 1.5em 2em 1.5em"}} onClick={()=>saveToMemory()}className="button">Save Write Keys</Button></div>
        </Pane>
      </SideSheet>
      <Button onClick={() => setIsShown(true)}>Show Write Key Notepad</Button>
    </div>
  )
}

export default Notepad