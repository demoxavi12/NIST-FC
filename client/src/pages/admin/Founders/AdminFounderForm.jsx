import { useParams } from 'react-router'
import PlaceholderPage from '../../../components/common/PlaceholderPage'

/** Serves both /admin/founders/new and /admin/founders/:id/edit. */
function AdminFounderForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  return (
    <PlaceholderPage
      variant="admin"
      title={isEdit ? 'Edit Founder' : 'Add Founder'}
      route={isEdit ? '/admin/founders/:id/edit' : '/admin/founders/new'}
      params={isEdit ? { id } : {}}
      phase="Phase 7 — Founders"
      description="Founder form: name, photo, role, batch, branch, bio, quote, order and publishing."
    />
  )
}

export default AdminFounderForm
