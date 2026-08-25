import SubscribeForm from "./subscribe-form"

/**
 * The subscribe pitch. Frequency plus a countable promise, mirroring the two
 * standing sections of the newsletter itself so the page can never over-promise
 * relative to what actually lands.
 */
export default function SubscribeHero() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-sans font-normal text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary mb-6">
        Finlay&apos;s Newsletter
      </h1>

      <p className="text-2xl sm:text-3xl md:text-4xl font-normal leading-[1.2] tracking-tight text-foreground text-balance">
        Every Friday: what I&apos;m seeing in AI, and what we&apos;re actually building.
      </p>

      <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
        I&apos;m 23 and running an AI company out of Melbourne. Each week I write
        down what caught my attention in AI, and what we shipped, broke or
        rebuilt inside the business. First person, no press releases, about a
        five minute read.
      </p>

      <div className="mt-10">
        <SubscribeForm />
        <p className="mt-3 text-xs text-muted-foreground">
          Free. One email a week. Unsubscribe in one click.
        </p>
      </div>
    </div>
  )
}
