import { useState, useEffect } from 'react'
import { TextInput, Button, toaster } from 'evergreen-ui'
import Industry from './IndustryInput';
import Notepad from './Notepad';
import Tags from './TagInput';

const Source = ({ setWriteKey, writeKey, analyticsSecondary, algoliaIndex, setSelectedTags, setSelectedIndustries, selectedTags, selectedIndustries, setCompany, company }) => {
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

  const handleSubmit = (event) => {
    event.preventDefault();
    toaster.success("Workspace Details Saved", {description: "Details will persist if page is refreshed",id: 'single-toast'});
    localStorage.setItem('company', company);
    localStorage.setItem('selectedIndustries', selectedIndustries);
    localStorage.setItem('selectedTags', JSON.stringify(selectedTags));
    localStorage.setItem('writeKey', writeKey);
  }

  const clearWorkspaceDetails = (event) => {
    event.preventDefault();
    toaster.success("Workspace Details Cleared", {id: 'single-toast'});
    localStorage.removeItem('company');
    localStorage.removeItem('selectedIndustries');
    localStorage.removeItem('selectedTags');
    localStorage.removeItem('writeKey');
    setCompany('');
    setSelectedIndustries('-');
    setSelectedTags([]);
    setWriteKey('');
  }

  return (
    <div className="section">
      <div className="header" style={{marginBottom: "12px"}}>Enter Workspace Details
      </div>
      <form onSubmit={handleSubmit}>
        <div className='header-source'> <label htmlFor="name">Company Name</label></div>
        <div className='description'>Leave blank if testing or not for customer.</div>
          <div className='input-box'>
            <TextInput name="company" id="company" autoComplete="on" className="inputbox" type="text" value={company} placeholder="Name" onChange={(e) => {setCompany(e.target.value || "")}} /> 
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
            <TextInput name="source" id="source" autoComplete="on" type="text" placeholder="Write Key" value={writeKey || ""}  onChange={e => setWriteKey(e.target.value)} /> 
            <div className='input-box'>
              <Notepad 
              analyticsSecondary={analyticsSecondary} 
              />
            </div>
        </div>
        <div>
          <Button type="submit" appearance="primary">Save</Button>
          <Button type="reset" marginLeft={"12px"} onClick={clearWorkspaceDetails} appearance="default">Clear</Button>
        </div>
      </form>
      
      
    </div>
  )
}

export default Source