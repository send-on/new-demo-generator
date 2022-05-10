import { TextInput, TagInput } from 'evergreen-ui'
import Notepad from './Notepad';
import Tags from './TagInput';
// import '../App.css';

const Source = ({ setWriteKey, analyticsSecondary }) => (
  <div className="section">
    
    <div className="header">Enter Workspace Details
    </div>
    <form>
      <div className='header-source'> <label htmlFor="name">Company Name</label></div>
        <div className='input-box'>
          <TextInput name="company" id="company" autoComplete="on" className="inputbox" type="text" placeholder="Name" onChange={e => setWriteKey(e.target.value || "placeholder")} /> 
        </div>

        <div className='header-source'> <label htmlFor="name">Industry</label></div>
        <div className='input-box'>
          <TextInput name="company" id="company" autoComplete="on" className="inputbox" type="text" placeholder="Name" onChange={e => setWriteKey(e.target.value || "placeholder")} /> 
        </div>

        <div className='header-source'> <label htmlFor="name">Tags</label></div>
        <div className='input-box'>
          <Tags />
        </div>
        
          


        <div className='header-source'> <label htmlFor="source">Source Write Key</label></div>
        <div className='input-box'>
          <TextInput name="source" id="source" autoComplete="on" className="inputbox" type="text" placeholder="Write Key" onChange={e => setWriteKey(e.target.value || "placeholder")} /> 
          <div className='input-box'><Notepad analyticsSecondary={analyticsSecondary} /></div>
      </div>
    </form>
    
    
  </div>
)

export default Source