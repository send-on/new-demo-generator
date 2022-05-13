import { SelectField, option } from 'evergreen-ui'
import { useState, useMemo, useEffect } from 'react'

const Industry = ({ allIndustries, setSelectedIndustries, selectedIndustries}) => {
  return (
    <SelectField
      label="Industry"
      inputWidth="280px"
      value={selectedIndustries}
      onChange={e => setSelectedIndustries(e.target.value)}
    >
      {allIndustries.map((el, i) => <option key={i} value={el} >{el}</option>)}
    </SelectField>
  )
}

export default Industry

