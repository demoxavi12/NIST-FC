import { AlertCircle } from 'lucide-react'

/** A form field's error message: icon + text, never colour alone. */
function FieldError({ id, children }) {
  if (!children) return null
  return (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-sm font-medium text-danger">
      <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
      {children}
    </p>
  )
}

export default FieldError
