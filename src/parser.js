import { CSVReader } from 'react-papaparse';
export default function CSVReader2({setDataArr}){
  const handleOnDrop = (data) => {
    let arr = data.map(obj => obj.data)
    setDataArr(arr)
  };
  const handleOnError = (err, file, inputElem, reason) => {
    console.log(err);
  };
  const handleOnRemoveFile = (data) => {
    console.log(data);
  };

  
  return (
    <>
      <h5>Click and Drag Upload</h5>
      <CSVReader
        onDrop={handleOnDrop}
        onError={handleOnError}
        addRemoveButton
        onRemoveFile={handleOnRemoveFile}
        config={{}}
      >
        <span>Drop CSV file here or click to upload.</span>
      </CSVReader>
    </>
  );
  
}