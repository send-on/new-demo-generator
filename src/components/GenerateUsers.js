import { Button, TextInput, Checkbox } from 'evergreen-ui'
import UserForm from './UserForm';
import { useState } from 'react'

const GenerateUsers = ({ numOfUsers, setNumOfUsers, lockUserList, setUserList, userList, setUserButtonStatus, userButtonStatus, onUserSubmit, regenerateAnonymousId, showGroups, setShowGroups }) => {
  return (
    <div className="section">
      <div className="header">Enter Number of Users to Generate or Import List</div>
      <div className="description">Note: Click save after manually modifying values. </div>
      <div className="stepComponent">
        <div className="input-box">
          <TextInput type="text" placeholder="Number of Users (i.e. 100)" onChange={e => setNumOfUsers(e.target.value)} />
          <Button appearance='primary' style={{marginLeft: "2em"}} onClick={()=>lockUserList(numOfUsers, setUserList, userList, setUserButtonStatus)} >{`Generate or Reset Users`}</Button>
        </div>
      </div>

      <div style={{marginTop: "0.5em", width: "100%"}}>
        <UserForm 
        userList={JSON.stringify(userList, null, 2)} 
        onUserSubmit={onUserSubmit} 
        userButtonStatus={userButtonStatus} 
        setUserButtonStatus={setUserButtonStatus} 
        /> 
      </div>
      <Button style={{marginTop: "1em"}} onClick={()=>regenerateAnonymousId(userList, setUserList)} >Shuffle Anonymous ID</Button>
      <GroupsCheckbox 
        showGroups={showGroups} 
        setShowGroups={setShowGroups}
        />
    </div>
  )
}

export default GenerateUsers


const GroupsCheckbox = ({ showGroups, setShowGroups }) => {
  return (
    <Checkbox
      label="Enable Groups (Beta)"
      checked={showGroups}
      onChange={e => setShowGroups(e.target.checked)}
    />
  )
}