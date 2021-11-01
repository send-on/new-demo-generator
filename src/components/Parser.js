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
      <h5>3. Click or Drag Upload <a style={{color:"white"}} href="https://docs.google.com/spreadsheets/d/1jXUA_clzEbEX5xMLGGhFsJDgRau6RnpKYAlBbZYJy6I/edit?usp=sharing">CSV</a></h5>
      <div className="note" style={{"marginBottom": "1em"}}>(HINT - you can drag the file directly from the downloads bar at the bottom of Chrome after download)</div>
      <CSVReader
        onDrop={handleOnDrop}
        onError={handleOnError}
        addRemoveButton
        onRemoveFile={handleOnRemoveFile}
        skipEmptyLines={false}
      >
        <span>Drop CSV file here or click to upload.</span>
      </CSVReader>
    </>
  );
  
}