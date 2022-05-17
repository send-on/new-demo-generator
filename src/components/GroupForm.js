import React, { useState, useEffect } from 'react'
import { Button } from 'evergreen-ui'

const GroupForm = ({groupList, onGroupSubmit, groupButtonStatus, setGroupButtonStatus}) => {  
  const [text, setText] = useState(groupList);

  useEffect(()=> {
    setText(groupList);
  }, [groupList])

  const handleChange = (e) => {
    setText(e.target.value);
    setGroupButtonStatus("Click to Save Changes")
  }

  return (
    <form style={{width: "100%"}} onSubmit={onGroupSubmit} key={groupList}>
        <textarea onChange={handleChange}
        className="groupinput" type="text" name="groupList" value={text} />
        <div>
          <Button >{groupButtonStatus}</Button>
        </div>
    </form>
  )
}

export default GroupForm;