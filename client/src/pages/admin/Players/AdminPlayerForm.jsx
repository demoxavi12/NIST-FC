import { useParams } from 'react-router'
import PlaceholderPage from '../../../components/common/PlaceholderPage'

/** Serves both /admin/players/new and /admin/players/:id/edit. */
function AdminPlayerForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  return (
    <PlaceholderPage
      variant="admin"
      title={isEdit ? 'Edit Player' : 'Add Player'}
      route={isEdit ? '/admin/players/:id/edit' : '/admin/players/new'}
      params={isEdit ? { id } : {}}
      phase="Phase 4 — Players"
      description="Player form: name, photo, position, batch, branch, bio and status."
    />
  )
}

export default AdminPlayerForm
