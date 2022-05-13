import { useState, useEffect } from 'react'
import { TextInput, TagInput } from 'evergreen-ui'
import Industry from './IndustryInput';
import Notepad from './Notepad';
import Tags from './TagInput';

const Source = ({ setWriteKey, analyticsSecondary, algoliaIndex, setSelectedTags, setSelectedIndustries, selectedTags, selectedIndustries, setCompany }) => {
  const [allTags, setAllTags] = useState([])
  const [allIndustries, setAllIndustries] = useState([])

  useEffect(() => {
    algoliaIndex.searchForFacetValues('industry', '')
    .then(({ facetHits }) => {
      let industries = facetHits.map(el => el.value);
      setAllIndustries(industries)
    })
    algoliaIndex.searchForFacetValues('tags', '')
    .then(({ facetHits }) => {
      setAllTags(facetHits.map(el => el.value))
    })
  },[])

  return (
    <div className="section">
      <div className="header" style={{marginBottom: "12px"}}>Enter Workspace Details
      </div>
      {/* <form> */}
        <div className='header-source'> <label htmlFor="name">Company Name</label></div>
          <div className='input-box'>
            <TextInput name="company" id="company" autoComplete="on" className="inputbox" type="text" placeholder="Name" onChange={e => setCompany(e.target.value || "placeholder")} /> 
          </div>
          <div></div>

          <div className='input-box'>
            <Industry 
            allIndustries={allIndustries} 
            setSelectedIndustries={setSelectedIndustries}
            selectedIndustries={selectedIndustries}
            />
          </div>

          <div className='header-source' style={{marginTop: "-12px"}}> <label htmlFor="name">Tags</label></div>
          <div className='description'>Enter your own tags, search for existing tags, or dropdown to select.</div>
          <div className='input-box' >
            <Tags 
            allTags={allTags} 
            setSelectedTags={setSelectedTags}
            selectedTags={selectedTags}
            />
          </div>
          
            


          <div className='header-source' style={{marginTop: "12px", marginBottom: "-8px"}}> <label htmlFor="source">Source Write Key</label></div>
          <div className='input-box'>
            <TextInput name="source" id="source" autoComplete="on" className="inputbox" type="text" placeholder="Write Key" onChange={e => setWriteKey(e.target.value || "placeholder")} /> 
            <div className='input-box'>
              <Notepad analyticsSecondary={analyticsSecondary} />
              </div>
        </div>
      {/* </form> */}
      
      
    </div>
  )
}

export default Source