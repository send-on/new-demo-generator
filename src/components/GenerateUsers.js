import { Button, TextInput } from 'evergreen-ui'
import UserForm from './UserForm';

const GenerateUsers = ({ numOfUsers, setNumOfUsers, lockUserList, setUserList, userList, setUserButtonStatus, userButtonStatus, onSubmit, regenerateAnonymousId }) => {
  return (
    <div className="section">
      <div className="header">Enter Number of Users to Generate or Import List</div>
      <div className="note">Note: Click save after manually modifying values. </div>
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
    </div>
  )
}

export default GenerateUsers