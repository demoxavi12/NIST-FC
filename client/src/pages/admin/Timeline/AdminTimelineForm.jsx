import { useParams } from 'react-router'
import PlaceholderPage from '../../../components/common/PlaceholderPage'

/** Serves both /admin/timeline/new and /admin/timeline/:id/edit. */
function AdminTimelineForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  return (
    <PlaceholderPage
      variant="admin"
      title={isEdit ? 'Edit Timeline Event' : 'Add Timeline Event'}
      route={isEdit ? '/admin/timeline/:id/edit' : '/admin/timeline/new'}
      params={isEdit ? { id } : {}}
      phase="Phase 6 — Timeline"
      description="Timeline event form: title, date/year, description, image, category, memory and publishing."
    />
  )
}

export default AdminTimelineForm
