import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="flex items-center h-full p-16">
    <div className="container flex flex-col items-center justify-center px-5 mx-auto my-8">
    <div className="max-w-md text-center">
    <h2 className="mb-8 font-extrabold text-9xl dark:text-gray-400">
    <span className="sr-only">Error</span>404
    </h2>
    <p className="text-2xl font-semibold md:text-3xl">Oops! You've Wandered Off the Map</p>
    <p className="mt-4 mb-8 dark:text-gray-600">But fret not, intrepid explorer! While you're here, why not join us for a round of digital hide-and-seek? Or perhaps a game of virtual hot potato? We promise, it's way more fun than trying to find that missing webpage.</p>
    <a rel="noopener noreferrer" href="/" className="px-8 py-3 font-semibold rounded dark:bg-violet-600 dark:text-gray-50">Click Here, Let's Get You Back Home</a>
    </div>
    </div>
    </section>    )
  }
  