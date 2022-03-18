import { TextInput } from 'evergreen-ui'
import Notepad from './Notepad';

const Source = ({ setWriteKey, analyticsSecondary }) => (
  <div className="section">
    <div className="header">Enter Source   
      <a style={{marginLeft:"3px"}} href="https://segment.com/docs/getting-started/02-simple-install/#find-your-write-key">Write Key</a>
    </div>
    <form>
      <TextInput name="source" autoComplete="on" className="inputbox" type="text" placeholder="Write Key" onChange={e => setWriteKey(e.target.value || "placeholder")} /> 
    </form>
    <Notepad 
      analyticsSecondary={analyticsSecondary}
    />
  </div>
)

export default Source