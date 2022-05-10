import { TagInput } from "evergreen-ui";
import { useState, useMemo } from 'react'

const Industry = () => {
  
  const [values, setValues] = useState([])
  const allValues = [
    "Retail / Ecommerce",
    "B2B SaaS",
    "Finance",
    "Media / Publishing",
    "Consulting",
    "Government",
    "Logistics",
    "Software",
    "Hardware",
    "Other"
  ]
  const autocompleteItems = useMemo(() => allValues.filter((i) => !values.includes(i)), [allValues, values])

  return (
    <TagInput
      className='tag-input'
      inputProps={{ placeholder: 'Enter Industry or Pick from List' }}
      values={values}
      onChange={setValues}
      autocompleteItems={autocompleteItems}
    />
  )
}

export default Industry

