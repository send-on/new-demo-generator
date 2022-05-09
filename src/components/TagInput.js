import { TagInput } from "evergreen-ui";
import { useState, useMemo } from 'react'

const Tags = () => {
  const [values, setValues] = useState(['First', 'Second'])
  const allValues = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth']
  const autocompleteItems = useMemo(() => allValues.filter((i) => !values.includes(i)), [allValues, values])

  return (
    <TagInput
      inputProps={{ placeholder: 'Enter something...' }}
      values={values}
      onChange={setValues}
      autocompleteItems={autocompleteItems}
    />
  )
}

export default Tags