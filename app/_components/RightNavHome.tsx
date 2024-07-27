import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import React from 'react'

const communities = [
  { name: "Kenya Helpers Association", color: "bg-red-200 hover:bg-red-300" },
  { name: "Nairobi Tech Hub", color: "bg-blue-200 hover:bg-blue-300" },
  { name: "Mombasa Beach Cleaners", color: "bg-green-200 hover:bg-green-300" },
  { name: "Kisumu Youth Empowerment", color: "bg-yellow-200 hover:bg-yellow-300" },
  { name: "Eldoret Runners Club", color: "bg-purple-200 hover:bg-purple-300" },
  { name: "Nakuru Environmental Group", color: "bg-teal-200 hover:bg-teal-300" },
  { name: "Thika Entrepreneurs Network", color: "bg-pink-200 hover:bg-pink-300" },
  { name: "Malindi Marine Conservation", color: "bg-indigo-200 hover:bg-indigo-300" },
  { name: "Kakamega Forest Friends", color: "bg-orange-200 hover:bg-orange-300" },
  { name: "Machakos Farmers Cooperative", color: "bg-cyan-200 hover:bg-cyan-300" }
];

export default function RightNavHome() {
  return (
    <div>
    <Card className="my-5 mx-3 px-3">
    <div className="flex flex-col max-w-md p-6 dark:bg-gray-50 dark:text-gray-800">
    <img
    src="/poster.png"
    alt=""
    className="flex-shrink-0 object-cover h-32 rounded-sm sm:h-64 dark:bg-gray-500 aspect-square"
    />
    <div>
    <h2 className="text-xl font-semibold">Surprise saint Valentin 😍</h2>
    <span className="block pb-2 text-sm dark:text-gray-600">by concluding-tort</span>
    <p>
    Maintaining proper oral and dental hygiene in young children is of utmost importance, especially for those who use
    </p>
    <Button asChild>
    <span>Click Here to Help</span>
    </Button>
    </div>
    </div>
    <h1 className="text-lg font-bold my-2">Communities You Can Join</h1>
    <div className="flex justify-center">
    <ul className="mb-5 space-y-3 text-sm w-full">
    {communities.map((community, index) => (
      <li key={index} className={`rounded-md ${community.color} transition-colors duration-200`}>
      <Link 
      href={`/c/${community.name.toLowerCase().replace(/ /g, '_')}`} 
      className="block w-full p-2 text-gray-800 hover:text-gray-900"
      >
      <span className="font-semibold">c/</span>{community.name}
      </Link>
      </li>
    ))}
    </ul>
    </div>
    </Card>
    </div>
  )
}