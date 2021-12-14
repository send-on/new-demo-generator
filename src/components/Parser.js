import { CSVReader } from 'react-papaparse';
import '../App.css';

export default ({setEventList, setIsLoading, setCsvLoaded, setStatus}) => {
  const handleOnDrop = (data) => {
    setIsLoading(false)
    setCsvLoaded(true)
    let arr = data.map(obj => obj.data)
    setEventList(arr)
    setStatus("FIRE EVENTS")
  };
  const handleOnError = (err, file, inputElem, reason) => {
    console.log(err);
  };
  const handleOnRemoveFile = (data) => {
    setIsLoading(false)
    setCsvLoaded(false)
    console.log(data);
  };

  return (
    <>
      <div className="header">3. Click or Drag Upload <a href="https://docs.google.com/spreadsheets/d/1QpgfIq1VgGBy9iMNekSR80J2JHCmDaAPwEUH8_NDWcA/edit#gid=508251273">CSV</a></div>
      <div className="note" style={{"marginBottom": "1em"}}>HINT: Drag CSV directly from the downloads bar.</div>
      <div style={{margin: "auto", width: "12em", textAlign: "center" }}>
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