import React from 'react'

const UserForm = ({userList, onSubmit, userButtonStatus, setUserButtonStatus}) => {   
  return (
    <form style={{width: "100%"}} onSubmit={onSubmit} key={userList}>
        <textarea onChange={()=>setUserButtonStatus("Click to Save Changes")} className="userinput" type="text" name="userList" defaultValue={JSON.stringify(userList, null, 2)} />
        <div>
          <button className="button">{userButtonStatus}</button>
        </div>
    </form>
  )
}

export default UserForm;