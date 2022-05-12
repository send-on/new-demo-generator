import { TagInput } from "evergreen-ui";
import { useState, useMemo, useEffect } from 'react'

const Industry = ({ allIndustries, setSelectedIndustries, selectedIndustries}) => {
  const autocompleteItems = useMemo(() => allIndustries.filter((i) => !selectedIndustries.includes(i)), [allIndustries, selectedIndustries])

  return (
    <TagInput
      className='tag-input'
      inputProps={{ placeholder: 'Add New or Search' }}
      values={selectedIndustries}
      onChange={setSelectedIndustries}
      autocompleteItems={autocompleteItems}
    />
  )
}

export default Industry

