import { useState } from 'react'
import { cloudinaryImageUrl, cloudinarySrcSet } from '../../utils/cloudinaryImage'
import Lightbox from './Lightbox'

// 4:3 thumbnails; the full photo only loads in the lightbox.
const ASPECT = 3 / 4
const WIDTHS = [240, 360, 480]
const SIZES = '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw'

/** The memory's photo grid; selecting a photo opens the lightbox (UI_DESIGN §34). */
function MemoryGallery({ photos, title }) {
  const [index, setIndex] = useState(null)

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <li key={photo.publicId}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`View photo ${i + 1} of ${photos.length}`}
              className="group block aspect-[4/3] w-full overflow-hidden rounded-sm bg-surface-muted"
            >
              <img
                src={cloudinaryImageUrl(photo.url, { width: 480, height: 480 * ASPECT })}
                srcSet={cloudinarySrcSet(photo.url, WIDTHS, ASPECT)}
                sizes={SIZES}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox
        photos={photos}
        index={index}
        title={title}
        onClose={() => setIndex(null)}
        onIndexChange={setIndex}
      />
    </>
  )
}

export default MemoryGallery
