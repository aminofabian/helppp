import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="flex items-center h-full p-16 bg-white/95 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="container flex flex-col items-center justify-center px-5 mx-auto my-8">
        <div className="max-w-md text-center">
          <h2 className="mb-8 font-extrabold text-4xl text-red-600 dark:text-red-400">
            <span className="sr-only">Access</span>Access Denied
          </h2>
          <p className="text-2xl font-semibold md:text-3xl text-gray-800 dark:text-gray-100">
            Oops! Only Level 2 and Above Members Are Allowed to Post a Help Request
          </p>
          <p className="mt-4 mb-8 text-gray-600 dark:text-gray-300">
            Help at least 2 to 3 people (with at least 50/= each) and you'll be upgraded to level 2. 
            Remember each level unlocks new perks.
          </p>
          <a rel="noopener noreferrer" 
             href="/" 
             className="px-8 py-3 font-semibold rounded 
                      bg-primary/90 hover:bg-primary 
                      dark:bg-gray-800 dark:hover:bg-gray-700
                      text-white shadow-md hover:shadow-lg
                      transition-all duration-300">
            Click Here, Let's Get You Back Home
          </a>
          
          <div className="mt-8 text-left">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Unlock Exciting Perks at Every Level:
            </h3>
            <ul className="mt-4 space-y-4">
              <li className="p-4 bg-blue-100/80 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm
                           shadow-sm hover:shadow-md transition-all duration-300">
                <strong className="text-blue-800 dark:text-blue-300">Level 1</strong>
                <p className="dark:text-gray-200"><strong>Perks:</strong></p>
                <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                  <li>Can browse and view help requests</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400"><strong>Limit:</strong> Cannot post help requests.</p>
              </li>
              
              <li className="p-4 bg-green-100/80 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm
                           shadow-sm hover:shadow-md transition-all duration-300">
                <strong className="text-green-800 dark:text-green-300">Level 2</strong>
                <p className="dark:text-gray-200"><strong>Perks:</strong></p>
                <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                  <li>Can post help requests</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400"><strong>Limit:</strong> Maximum help request amount: 1000.</p>
              </li>
              
              <li className="p-4 bg-yellow-100/80 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm
                           shadow-sm hover:shadow-md transition-all duration-300">
                <strong className="text-yellow-800 dark:text-yellow-300">Level 3</strong>
                <p className="dark:text-gray-200"><strong>Perks:</strong></p>
                <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                  <li>Can post help requests</li>
                  <li>Can view detailed profiles of other users</li>
                  <li>Can receive notifications for new help requests in their area</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400"><strong>Limit:</strong> Maximum help request amount: 3000.</p>
              </li>
              
              <li className="p-4 bg-purple-100/80 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm
                           shadow-sm hover:shadow-md transition-all duration-300">
                <strong className="text-purple-800 dark:text-purple-300">Level 4</strong>
                <p className="dark:text-gray-200"><strong>Perks:</strong></p>
                <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                  <li>Can post help requests</li>
                  <li>Can see a list of top contributors</li>
                  <li>Access to basic analytics about their help requests (e.g., number of views)</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400"><strong>Limit:</strong> Maximum help request amount: 5000.</p>
              </li>
              
              <li className="p-4 bg-pink-100/80 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm
                           shadow-sm hover:shadow-md transition-all duration-300">
                <strong className="text-pink-800 dark:text-pink-300">Level 5</strong>
                <p className="dark:text-gray-200"><strong>Perks:</strong></p>
                <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                  <li>Can create their own community of helpers and invite others</li>
                  <li>Can moderate their own community</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400"><strong>Limit:</strong> Maximum help request amount: 10000.</p>
              </li>
              
              <li className="p-4 bg-red-100/80 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm
                           shadow-sm hover:shadow-md transition-all duration-300">
                <strong className="text-red-800 dark:text-red-300">Level 6</strong>
                <p className="dark:text-gray-200"><strong>Perks:</strong></p>
                <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                  <li>Can post help requests</li>
                  <li>Receive priority support from the app</li>
                  <li>Can create public events for community fundraising</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400"><strong>Limit:</strong> Maximum help request amount: 20000.</p>
              </li>
              
              <li className="p-4 bg-indigo-100/80 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm
                           shadow-sm hover:shadow-md transition-all duration-300">
                <strong className="text-indigo-800 dark:text-indigo-300">Level 7</strong>
                <p className="dark:text-gray-200"><strong>Perks:</strong></p>
                <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                  <li>Can post help requests</li>
                  <li>Access premium templates for requests</li>
                  <li>Can use Priority Funding</li>
                  <li>Receive monthly reports on their impact and donations received</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400"><strong>Limit:</strong> Maximum help request amount: 50000.</p>
                <p className="text-gray-600 dark:text-gray-400"><strong>Additional:</strong> Priority Funding allows advance of funds with 20% fee, repaid from future donations.</p>
              </li>
              
              <li className="p-4 bg-teal-100/80 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm
                           shadow-sm hover:shadow-md transition-all duration-300">
                <strong className="text-teal-800 dark:text-teal-300">Level 8</strong>
                <p className="dark:text-gray-200"><strong>Perks:</strong></p>
                <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                  <li>Can post help requests</li>
                  <li>Gain access to exclusive giver matching programs</li>
                  <li>Use premium request templates</li>
                  <li>Receive priority customer support</li>
                  <li>Get early access to new features</li>
                  <li>Can create recurring help campaigns</li>
                  <li>Can create and manage larger communities</li>
                  <li>Receive detailed monthly impact reports</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400"><strong>Limit:</strong> Maximum help request amount: 100000.</p>
              </li>
              
              <li className="p-4 bg-orange-100/80 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm
                           shadow-sm hover:shadow-md transition-all duration-300">
                <strong className="text-orange-800 dark:text-orange-300">Level 9</strong>
                <p className="dark:text-gray-200"><strong>Perks:</strong></p>
                <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
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
                <p className="text-gray-600 dark:text-gray-400"><strong>Limit:</strong> Maximum help request amount: 1000000.</p>
              </li>
              
              <li className="p-4 bg-gray-100/80 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm
                           shadow-sm hover:shadow-md transition-all duration-300">
                <strong className="text-gray-800 dark:text-gray-200">Level 10</strong>
                <p className="dark:text-gray-200"><strong>Perks:</strong></p>
                <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
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
                <p className="text-gray-600 dark:text-gray-400"><strong>Limit:</strong> Maximum help request amount: 100000000.</p>
              </li>
            </ul>
            
            <div className="mt-8 p-4 bg-gray-50/80 dark:bg-gray-800/40 rounded-lg backdrop-blur-sm
                          shadow-sm transition-all duration-300">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Additional Perks:
              </h4>
              <ul className="mt-2 list-disc list-inside text-gray-700 dark:text-gray-300">
                <li><strong className="text-gray-900 dark:text-gray-100">Recognition:</strong> Badges and titles that display on their profile.</li>
                <li><strong className="text-gray-900 dark:text-gray-100">Discounts:</strong> Discounts or perks from partner organizations.</li>
                <li><strong className="text-gray-900 dark:text-gray-100">Early Access:</strong> Early access to new features and beta testing opportunities.</li>
                <li><strong className="text-gray-900 dark:text-gray-100">Rewards:</strong> Points or credits that can be redeemed for various rewards within the app.</li>
              </ul>
            </div>
            
            <div className="mt-8 p-4 bg-gray-50/80 dark:bg-gray-800/40 rounded-lg backdrop-blur-sm
                          shadow-sm transition-all duration-300">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Level Progression Criteria:
              </h4>
              <ul className="mt-2 list-disc list-inside text-gray-700 dark:text-gray-300">
                <li><strong className="text-gray-900 dark:text-gray-100">Donations:</strong> Amount donated by the user.</li>
                <li><strong className="text-gray-900 dark:text-gray-100">Requests Fulfilled:</strong> Number of help requests successfully fulfilled.</li>
                <li><strong className="text-gray-900 dark:text-gray-100">Community Engagement:</strong> Active participation in communities, events, and forums.</li>
                <li><strong className="text-gray-900 dark:text-gray-100">Time:</strong> Length of time as an active user.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}