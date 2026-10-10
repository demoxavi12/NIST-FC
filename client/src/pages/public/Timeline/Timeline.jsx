import Container from '../../../components/common/Container'
import EmptyState from '../../../components/common/EmptyState'
import ErrorState from '../../../components/common/ErrorState'
import TimelineEvent from '../../../components/timeline/TimelineEvent'
import TimelineEventSkeleton from '../../../components/timeline/TimelineEventSkeleton'
import useApiRequest from '../../../hooks/useApiRequest'
import usePageMeta from '../../../hooks/usePageMeta'
import { listTimeline } from '../../../services/timelineService'

/**
 * The timeline rail: a vertical line on the left on mobile and tablet, in
 * the centre from 1024px, with a marker per event. On desktop the cards
 * alternate left and right of the line (docs/UI_DESIGN.md §39).
 */
function TimelineList({ items, renderItem }) {
  return (
    <ol className="relative before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-0.5 before:bg-border lg:before:left-1/2 lg:before:-translate-x-1/2">
      {items.map((item, index) => (
        <li key={item.key} className="relative pb-10 pl-10 last:pb-0 lg:grid lg:grid-cols-2 lg:gap-16 lg:pl-0">
          <span
            aria-hidden="true"
            className="absolute top-2 left-0 size-4 rounded-full border-[3px] border-accent bg-surface lg:left-1/2 lg:-translate-x-1/2"
          />
          <div className={index % 2 === 0 ? 'lg:col-start-1' : 'lg:col-start-2'}>{renderItem(item)}</div>
        </li>
      ))}
    </ol>
  )
}

const SKELETONS = Array.from({ length: 3 }, (_, index) => ({ key: index }))

/**
 * /timeline — "Our Journey": NIST FC's history in the order chosen by the
 * admins (docs/SITE_MAP.md §9, UI_DESIGN §38–§41, §84). Only published
 * events are returned by the API.
 */
function Timeline() {
  usePageMeta({
    title: 'Our Journey',
    description: 'The history of NIST FC, from the beginning to today — the moments and milestones that shaped the team.',
  })
  const { loading, data, error, reload } = useApiRequest(({ signal }) => listTimeline({ signal }), 'timeline')

  return (
    <>
      <section className="border-b border-border bg-surface" aria-labelledby="timeline-title">
        <Container className="py-12 md:py-16">
          <h1 id="timeline-title" className="text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
            Our Journey
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-muted">From the beginning to today.</p>
        </Container>
      </section>

      <Container className="py-10 md:py-16">
        <p role="status" className="sr-only">
          {loading ? 'Loading timeline…' : data ? `${data.length} ${data.length === 1 ? 'event' : 'events'}` : ''}
        </p>

        {error ? (
          <ErrorState title="Unable to load the timeline." message="Please try again." onRetry={reload} />
        ) : loading ? (
          <TimelineList items={SKELETONS} renderItem={() => <TimelineEventSkeleton />} />
        ) : data.length === 0 ? (
          <EmptyState title="No timeline events yet." message="The timeline will appear here once events are added." />
        ) : (
          <TimelineList
            items={data.map((event) => ({ key: event.id, event }))}
            renderItem={({ event }) => <TimelineEvent event={event} />}
          />
        )}
      </Container>
    </>
  )
}

export default Timeline
