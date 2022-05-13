import { CSVReader } from 'react-papaparse';
import { generateSessionId } from '../util/common.js';
import { toaster } from 'evergreen-ui'

export default ({setEventList, setIsLoading, setCsvLoaded, analyticsSecondary}) => {
  const handleOnDrop = (data) => {
    setIsLoading(false)
    setCsvLoaded(true)
    let arr = data.map(obj => obj.data)
    setEventList(arr)
    analyticsSecondary.track({
      anonymousId: generateSessionId(),
      event: 'Loaded CSV',
    });
  };
  const handleOnError = (err, file, inputElem, reason) => {
    console.log(err);
  };
  const handleOnRemoveFile = (data) => {
    setIsLoading(false)
    setCsvLoaded(false)
    toaster.success("Removed CSV Template " ,{id: 'single-toast'})
  };

  return (
    <>
      <div className="header">Click or Drag Upload CSV Template</div>
      <div className="description" style={{"marginBottom": "1em"}}>HINT: Drag CSV directly from the bottom Chrome downloads bar.</div>
      <div style={{width: "12em", textAlign: "left" }}>
      <CSVReader
        onDrop={handleOnDrop}
        onError={handleOnError}
        addRemoveButton
        onRemoveFile={handleOnRemoveFile}
        skipEmptyLines={false}
      >
        <span>Drop CSV file here or click to upload.</span>
      </CSVReader>
      </div>
    </>
  );
  
}