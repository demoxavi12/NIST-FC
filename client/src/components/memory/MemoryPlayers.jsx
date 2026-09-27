import { Link } from 'react-router'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage'

/** "Players in this memory" (UI_DESIGN §37); each links to the profile. */
function MemoryPlayers({ players }) {
  if (players.length === 0) return null
  return (
    <section aria-labelledby="memory-players">
      <h2 id="memory-players" className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
        Players in this memory
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {players.map((player) => (
          <li key={player.id}>
            <Link
              to={`/players/${player.slug}`}
              className="flex min-h-11 items-center gap-2 rounded-full border border-border py-1 pr-4 pl-1 text-sm font-semibold text-ink hover:bg-surface-muted"
            >
              <img
                src={cloudinaryImageUrl(player.photo.url, { width: 72, height: 72 })}
                alt=""
                loading="lazy"
                className="size-9 rounded-full object-cover"
              />
              {player.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default MemoryPlayers
