import React, { useState, useEffect } from 'react'
// import { useEffect } from 'react-transition-group/node_modules/@types/react';

const UserForm = ({userList, onSubmit, userButtonStatus, setUserButtonStatus}) => {  
  const [text, setText] = useState(userList);

  useEffect(()=> {
    setText(userList);
  }, [userList])

  const handleChange = (e) => {
    setText(e.target.value);
    setUserButtonStatus("Click to Save Changes")
  }

  return (
    <form style={{width: "100%"}} onSubmit={onSubmit} key={userList}>
        <textarea onChange={handleChange}
        className="userinput" type="text" name="userList" value={text} />
        <div>
          <button className="button">{userButtonStatus}</button>
        </div>
    </form>
  )
}

export default UserForm;