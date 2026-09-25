/**
 * Centered page container: 1280px max width with 16 / 24 / 32px horizontal
 * padding on mobile / tablet / desktop (docs/UI_DESIGN.md §9).
 */
function Container({ as: Component = 'div', className = '', children, ...props }) {
  return (
    <Component
      className={`mx-auto w-full max-w-page px-4 md:px-6 lg:px-8 ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}

export default Container
