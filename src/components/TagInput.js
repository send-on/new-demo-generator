import { TagInput } from "evergreen-ui";
import { useState, useMemo, useEffect } from 'react'

const Tags = ({ allTags, selectedTags, setSelectedTags }) => {
  const [values, setValues] = useState([])
  const autocompleteItems = useMemo(() => allTags.filter((i) => !selectedTags.includes(i)), [allTags, selectedTags])

  return (
    <TagInput
      className='tag-input'
      inputProps={{ placeholder: 'Add New or Search' }}
      values={selectedTags}
      onChange={setSelectedTags}
      autocompleteItems={autocompleteItems}
    />
  )
}

export default Tags

