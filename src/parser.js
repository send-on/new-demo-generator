import { CSVReader } from 'react-papaparse';

export default ({setDataArr, setIsLoading, setCsvLoaded}) => {
  const handleOnDrop = (data) => {
    setIsLoading(false)
    setCsvLoaded(true)
    let arr = data.map(obj => obj.data)
    setDataArr(arr)
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
      <h5>2. Click or Drag Upload <a style={{color:"white"}} href="https://docs.google.com/spreadsheets/d/1jXUA_clzEbEX5xMLGGhFsJDgRau6RnpKYAlBbZYJy6I/edit?usp=sharing">CSV</a></h5>
      <CSVReader
        onDrop={handleOnDrop}
        onError={handleOnError}
        addRemoveButton
        onRemoveFile={handleOnRemoveFile}
      >
        <span>Drop CSV file here or click to upload.</span>
      </CSVReader>
    </>
  );
  
}