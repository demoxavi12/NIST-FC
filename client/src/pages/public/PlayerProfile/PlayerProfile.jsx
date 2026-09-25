import { useParams } from 'react-router'
import PlaceholderPage from '../../../components/common/PlaceholderPage'

function PlayerProfile() {
  const { slug } = useParams()

  return (
    <PlaceholderPage
      title="Player Profile"
      route="/players/:slug"
      phase="Phase 4 — Players"
      description="Individual player profile and the memories they appear in."
      params={{ slug }}
    />
  )
}

export default PlayerProfile
