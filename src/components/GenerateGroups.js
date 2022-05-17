import { Button, TextInput, Checkbox } from 'evergreen-ui'
import GroupForm from './GroupForm';

const GenerateGroups = ({ numOfGroups, setNumOfGroups, lockGroupList, setGroupList, groupList, setGroupButtonStatus, groupButtonStatus, onGroupSubmit }) => {
  return (
    <div className="section">
      <div className="header">Enter Number of Groups to Generate or Import List</div>
      <div className="description">Note: Your CSV Template must have groups in a row to activate the groups. </div>
      <div className="stepComponent">
        <div className="input-box">
          <TextInput type="text" placeholder="Number of Groups (i.e. 10)" onChange={e => setNumOfGroups(e.target.value)} />
          <Button appearance='primary' style={{marginLeft: "2em"}} onClick={()=>lockGroupList(numOfGroups, setGroupList, groupList, setGroupButtonStatus)} >{`Generate or Reset Groups`}</Button>
        </div>
      </div>

      <div style={{marginTop: "0.5em", width: "100%"}}>
        <GroupForm 
        groupList={JSON.stringify(groupList, null, 2)} 
        onGroupSubmit={onGroupSubmit} 
        groupButtonStatus={groupButtonStatus} 
        setGroupButtonStatus={setGroupButtonStatus} 
        /> 
      </div>
    </div>
  )
}

export default GenerateGroups

