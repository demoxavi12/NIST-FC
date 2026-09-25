import { useParams } from 'react-router'
import PlaceholderPage from '../../../components/common/PlaceholderPage'

/** Serves both /admin/memories/new and /admin/memories/:id/edit. */
function AdminMemoryForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  return (
    <PlaceholderPage
      variant="admin"
      title={isEdit ? 'Edit Memory' : 'Add Memory'}
      route={isEdit ? '/admin/memories/:id/edit' : '/admin/memories/new'}
      params={isEdit ? { id } : {}}
      phase="Phase 5 — Memories"
      description="Memory form: details, cover image, gallery, players, tags and publishing."
    />
  )
}

export default AdminMemoryForm
