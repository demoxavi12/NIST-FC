import { useEffect } from 'react'
import {
  SITE_DEFAULT_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
} from '../constants/site'

function setMetaTag(name, content) {
  let tag = document.head.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

/**
 * Sets the document title, meta description and robots directive for a page.
 * Omit `title` to use the site's default title (homepage).
 * Admin pages pass `noindex` so they are never indexed.
 */
export default function usePageMeta({
  title,
  description = SITE_DESCRIPTION,
  noindex = false,
} = {}) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_DEFAULT_TITLE
    setMetaTag('description', description)
    setMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow')
  }, [title, description, noindex])
}
