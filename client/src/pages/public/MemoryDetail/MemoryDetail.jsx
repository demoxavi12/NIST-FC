import { useParams } from 'react-router'
import PlaceholderPage from '../../../components/common/PlaceholderPage'

function MemoryDetail() {
  const { slug } = useParams()

  return (
    <PlaceholderPage
      title="Memory"
      route="/memories/:slug"
      phase="Phase 5 — Memories"
      description="A single memory with its photo gallery, players involved, and previous/next navigation."
      params={{ slug }}
    />
  )
}

export default MemoryDetail
