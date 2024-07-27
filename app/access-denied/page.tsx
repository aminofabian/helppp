import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="flex items-center h-full p-16">
    <div className="container flex flex-col items-center justify-center px-5 mx-auto my-8">
    <div className="max-w-md text-center">
    <h2 className="mb-8 font-extrabold text-4xl text-red-600">
    <span className="sr-only">Access</span>Access Denied
    </h2>
    <p className="text-2xl font-semibold md:text-3xl text-gray-800">Oops! Only Level 2 and Above Members Are Allowed to Post a Help Request</p>
    <p className="mt-4 mb-8 text-gray-600">Help at least 2 to 3 people (with at least 50/= each) and you'll be upgraded to level 2. Remember each level unlocks new perks.</p>
    <a rel="noopener noreferrer" href="/" className="px-8 py-3 font-semibold rounded bg-violet-600 text-gray-50 hover:bg-violet-700">Click Here, Let's Get You Back Home</a>
    
    <div className="mt-8 text-left">
    <h3 className="text-xl font-bold text-gray-800">Unlock Exciting Perks at Every Level:</h3>
    <ul className="mt-4 space-y-4">
    <li className="p-4 bg-blue-100 rounded">
    <strong>Level 1</strong>
    <p><strong>Perk:</strong> Can browse and view help requests.</p>
    <p><strong>Limit:</strong> Cannot post help requests.</p>
    </li>
    <li className="p-4 bg-green-100 rounded">
    <strong>Level 2</strong>
    <p><strong>Perk:</strong> Can post help requests.</p>
    <p><strong>Limit:</strong> Maximum help request amount: 1000.</p>
    </li>
    <li className="p-4 bg-yellow-100 rounded">
    <strong>Level 3</strong>
    <p><strong>Perk:</strong> Can post help requests and view detailed profiles of other users.</p>
    <p><strong>Limit:</strong> Maximum help request amount: 3000.</p>
    <p><strong>Additional:</strong> Can receive notifications for new help requests in their area.</p>
    </li>
    <li className="p-4 bg-purple-100 rounded">
    <strong>Level 4</strong>
    <p><strong>Perk:</strong> Can post help requests and see a list of top contributors.</p>
    <p><strong>Limit:</strong> Maximum help request amount: 5000.</p>
    <p><strong>Additional:</strong> Access to basic analytics about their help requests (e.g., number of views).</p>
    </li>
    <li className="p-4 bg-pink-100 rounded">
    <strong>Level 5</strong>
    <p><strong>Perk:</strong> Can create their own community of helpers and invite others.</p>
    <p><strong>Limit:</strong> Maximum help request amount: 10000.</p>
    <p><strong>Additional:</strong> Can moderate their own community.</p>
    </li>
    <li className="p-4 bg-red-100 rounded">
    <strong>Level 6</strong>
    <p><strong>Perk:</strong> Can post help requests and receive priority support from the app.</p>
    <p><strong>Limit:</strong> Maximum help request amount: 20000.</p>
    <p><strong>Additional:</strong> Can create public events for community fundraising.</p>
    </li>
    <li className="p-4 bg-indigo-100 rounded">
    <strong>Level 7</strong>
    <p><strong>Perk:</strong> Can post help requests and access premium templates for requests.</p>
    <p><strong>Limit:</strong> Maximum help request amount: 50000.</p>
    <p><strong>Additional:</strong> Receive monthly reports on their impact and donations received.</p>
    </li>
    <li className="p-4 bg-teal-100 rounded">
    <strong>Level 8</strong>
    <p><strong>Perk:</strong> Can post help requests and gain access to exclusive donor matching programs.</p>
    <p><strong>Limit:</strong> Maximum help request amount: 100000.</p>
    <p><strong>Additional:</strong> Can create and manage larger communities.</p>
    </li>
    <li className="p-4 bg-orange-100 rounded">
    <strong>Level 9</strong>
    <p><strong>Perk:</strong> Can post help requests and receive mentorship from top donors.</p>
    <p><strong>Limit:</strong> Maximum help request amount: 1000000.</p>
    <p><strong>Additional:</strong> Can host webinars and online events within the app.</p>
    </li>
    <li className="p-4 bg-gray-100 rounded">
    <strong>Level 10</strong>
    <p><strong>Perk:</strong> Can post help requests and get featured on the app's main page.</p>
    <p><strong>Limit:</strong> Maximum help request amount: 100000000.</p>
    <p><strong>Additional:</strong> Access to advanced analytics, including demographic insights of donors.</p>
    </li>
    </ul>
    <div className="mt-8">
    <h4 className="text-lg font-semibold text-gray-800">Additional Perks:</h4>
    <ul className="mt-2 list-disc list-inside">
    <li><strong>Recognition:</strong> Badges and titles that display on their profile.</li>
    <li><strong>Discounts:</strong> Discounts or perks from partner organizations.</li>
    <li><strong>Early Access:</strong> Early access to new features and beta testing opportunities.</li>
    <li><strong>Rewards:</strong> Points or credits that can be redeemed for various rewards within the app.</li>
    </ul>
    </div>
    <div className="mt-8">
    <h4 className="text-lg font-semibold text-gray-800">Level Progression Criteria:</h4>
    <ul className="mt-2 list-disc list-inside">
    <li><strong>Donations:</strong> Amount donated by the user.</li>
    <li><strong>Requests Fulfilled:</strong> Number of help requests successfully fulfilled.</li>
    <li><strong>Community Engagement:</strong> Active participation in communities, events, and forums.</li>
    <li><strong>Time:</strong> Length of time as an active user.</li>
    </ul>
    </div>
    </div>
    </div>
    </div>
    </section>
  )
}
