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
    <p><strong>Perks:</strong></p>
    <ul className="list-disc list-inside ml-4">
    <li>Can browse and view help requests</li>
    </ul>
    <p><strong>Limit:</strong> Cannot post help requests.</p>
    </li>
    <li className="p-4 bg-green-100 rounded">
    <strong>Level 2</strong>
    <p><strong>Perks:</strong></p>
    <ul className="list-disc list-inside ml-4">
    <li>Can post help requests</li>
    </ul>
    <p><strong>Limit:</strong> Maximum help request amount: 1000.</p>
    </li>
    <li className="p-4 bg-yellow-100 rounded">
    <strong>Level 3</strong>
    <p><strong>Perks:</strong></p>
    <ul className="list-disc list-inside ml-4">
    <li>Can post help requests</li>
    <li>Can view detailed profiles of other users</li>
    <li>Can receive notifications for new help requests in their area</li>
    </ul>
    <p><strong>Limit:</strong> Maximum help request amount: 3000.</p>
    </li>
    <li className="p-4 bg-purple-100 rounded">
    <strong>Level 4</strong>
    <p><strong>Perks:</strong></p>
    <ul className="list-disc list-inside ml-4">
    <li>Can post help requests</li>
    <li>Can see a list of top contributors</li>
    <li>Access to basic analytics about their help requests (e.g., number of views)</li>
    </ul>
    <p><strong>Limit:</strong> Maximum help request amount: 5000.</p>
    </li>
    <li className="p-4 bg-pink-100 rounded">
    <strong>Level 5</strong>
    <p><strong>Perks:</strong></p>
    <ul className="list-disc list-inside ml-4">
    <li>Can create their own community of helpers and invite others</li>
    <li>Can moderate their own community</li>
    </ul>
    <p><strong>Limit:</strong> Maximum help request amount: 10000.</p>
    </li>
    <li className="p-4 bg-red-100 rounded">
    <strong>Level 6</strong>
    <p><strong>Perks:</strong></p>
    <ul className="list-disc list-inside ml-4">
    <li>Can post help requests</li>
    <li>Receive priority support from the app</li>
    <li>Can create public events for community fundraising</li>
    </ul>
    <p><strong>Limit:</strong> Maximum help request amount: 20000.</p>
    </li>
    <li className="p-4 bg-indigo-100 rounded">
    <strong>Level 7</strong>
    <p><strong>Perks:</strong></p>
    <ul className="list-disc list-inside ml-4">
    <li>Can post help requests</li>
    <li>Access premium templates for requests</li>
    <li>Can use Priority Funding</li>
    <li>Receive monthly reports on their impact and donations received</li>
    </ul>
    <p><strong>Limit:</strong> Maximum help request amount: 50000.</p>
    <p><strong>Additional:</strong> Priority Funding allows advance of funds with 20% fee, repaid from future donations.</p>
    </li>
    <li className="p-4 bg-teal-100 rounded">
    <strong>Level 8</strong>
    <p><strong>Perks:</strong></p>
    <ul className="list-disc list-inside ml-4">
    <li>Can post help requests</li>
    <li>Gain access to exclusive giver matching programs</li>
    <li>Use premium request templates</li>
    <li>Receive priority customer support</li>
    <li>Get early access to new features</li>
    <li>Can create recurring help campaigns</li>
    <li>Can create and manage larger communities</li>
    <li>Receive detailed monthly impact reports</li>
    </ul>
    <p><strong>Limit:</strong> Maximum help request amount: 100000.</p>
    </li>
    <li className="p-4 bg-orange-100 rounded">
    <strong>Level 9</strong>
    <p><strong>Perks:</strong></p>
    <ul className="list-disc list-inside ml-4">
    <li>Can post help requests</li>
    <li>Receive mentorship from top donors</li>
    <li>Create and manage Social Circles (SACCO-like groups)</li>
    <li>Set rules and manage operations within Social Circles</li>
    <li>Can host webinars and online events within the app</li>
    <li>Receive a portion of fees charged on transactions within their Social Circles</li>
    <li>Can offer Priority Funding at 15% of the requested amount</li>
    <li>Operate savings groups (merry-go-round style)</li>
    <li>Have one-on-one interactions with investor advisers</li>
    </ul>
    <p><strong>Limit:</strong> Maximum help request amount: 1000000.</p>
    </li>
    <li className="p-4 bg-gray-100 rounded">
    <strong>Level 10</strong>
    <p><strong>Perks:</strong></p>
    <ul className="list-disc list-inside ml-4">
    <li>Can post help requests</li>
    <li>Get featured on the app's main page</li>
    <li>Manage advanced Social Circles (create multiple circles, implement complex rules)</li>
    <li>Increased fee sharing from Social Circle transactions</li>
    <li>Can participate in beta testing</li>
    <li>Provide direct feedback to developers</li>
    <li>Access to advanced analytics, including demographic insights of donors</li>
    <li>Opportunity to influence platform development</li>
    <li>Offer Priority Funding at 15% of the requested amount with more flexible terms</li>
    <li>Operate and manage multiple savings groups</li>
    <li>Regular one-on-one sessions with top investor advisers</li>
    <li>Exclusive access to high-profile donors and partners</li>
    <li>Ability to create and lead platform-wide initiatives</li>
    </ul>
    <p><strong>Limit:</strong> Maximum help request amount: 100000000.</p>
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