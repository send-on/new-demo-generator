import { SelectField, option } from 'evergreen-ui'
import { useState, useMemo, useEffect } from 'react'

const Industry = ({ allIndustries, setSelectedIndustries, selectedIndustries}) => {

  

  return (
    <SelectField
      label="Industry"
      inputWidth="280px"
      description="Select industry or select Other"
      value={'Other'}
      onChange={e => setSelectedIndustries(e.target.value)}
    >
      {allIndustries.map((el, i) => <option key={i} value={el} >{el}</option>)}
    </SelectField>
  )
}

export default Industry

