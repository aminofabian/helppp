import Link from 'next/link'

export default function CommunityCreationRestricted() {
  return (
    <section className="flex items-center h-full p-16">
    <div className="container flex flex-col items-center justify-center px-5 mx-auto my-8">
    <div className="max-w-md text-center">
    <h2 className="mb-8 font-extrabold text-4xl text-blue-600">
    Level Up to Create Communities
    </h2>
    <p className="text-2xl font-semibold md:text-3xl text-gray-800">Oops! Only Level 5 and Above Members Can Create Communities</p>
    <p className="mt-4 mb-8 text-gray-600">Keep helping others and you'll be creating your own community in no time! Every act of kindness brings you closer to unlocking this feature.</p>
    <Link href="/" className="px-8 py-3 font-semibold rounded bg-violet-600 text-gray-50 hover:bg-violet-700">
    Back to Home
    </Link>
    
    <div className="mt-8 text-left">
    <h3 className="text-xl font-bold text-gray-800">Your Path to Community Creation:</h3>
    <ul className="mt-4 space-y-4">
    <li className="p-4 bg-green-100 rounded">
    <strong>Keep Helping:</strong> Each time you help someone, you gain experience points.
    </li>
    <li className="p-4 bg-yellow-100 rounded">
    <strong>Engage Regularly:</strong> Active participation in existing communities boosts your progress.
    </li>
    <li className="p-4 bg-blue-100 rounded">
    <strong>Quality Matters:</strong> Positive feedback from those you've helped accelerates your growth.
    </li>
    <li className="p-4 bg-purple-100 rounded">
    <strong>Consistency is Key:</strong> Regular activity on the platform helps you level up faster.
    </li>
    </ul>
    </div>
    
    <div className="mt-8">
    <h4 className="text-lg font-semibold text-gray-800">Why Level 5?</h4>
    <p className="mt-2 text-gray-600">
    Level 5 users have demonstrated commitment and understanding of our community values. 
    This ensures that new communities are created by experienced members who can foster 
    positive environments.
    </p>
    </div>
    
    <div className="mt-8">
    <h4 className="text-lg font-semibold text-gray-800">Keep Going!</h4>
    <p className="mt-2 text-gray-600">
    Every small act of kindness counts. Before you know it, you'll be ready to lead your own 
    thriving community. We can't wait to see what you'll create!
    </p>
    </div>
    </div>
    </div>
    </section>
  )
}