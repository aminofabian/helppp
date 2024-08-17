import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import React from 'react'

const communities = [
  "Kenya Helpers Association",
  "Nairobi Tech Hub",
  "Mombasa Beach Cleaners",
  "Kisumu Youth Empowerment",
  "Eldoret Runners Club",
  "Nakuru Environmental Group",
  "Thika Entrepreneurs Network",
  "Malindi Marine Conservation",
  "Kakamega Forest Friends",
  "Machakos Farmers Cooperative"
];

export default function RightNavHome() {
  return (
    <div>
    <Card className="my-5 mx-3 px-3 bg-card text-card-foreground">
    <div className="flex flex-col max-w-md p-6">
    <img
    src="/poster.png"
    alt=""
    className="flex-shrink-0 object-cover h-32 rounded-sm sm:h-64 aspect-square"
    />
    <div>
    <h2 className="text-md font-semibold">Surprise saint Valentin 😍</h2>
    <span className="block pb-2 text-sm text-muted-foreground">by concluding-tort</span>
    <p className="text-foreground text-md tracking-wide leading-7">
    Maintaining proper oral and dental hygiene in young children is of utmost importance, especially for those who use
    </p>
    <Button asChild>
    <span className="text-primary-foreground text-xs uppercase">Click Here to Help</span>
    </Button>
    </div>
    </div>
    <h1 className="text-md font-bold my-2 text-foreground uppercase">Communities You Can Join</h1>
    <div className="flex justify-center">
    <ul className="mb-5 space-y-3 text-sm w-full">
    {communities.map((community, index) => (
      <li key={index} className="rounded-md bg-secondary hover:bg-accent transition-colors duration-200">
      <Link 
      href={`/c/${community.toLowerCase().replace(/ /g, '_')}`} 
      className="block w-full p-2 text-secondary-foreground hover:text-accent-foreground"
      >
      <span className="font-semibold">c/</span>{community}
      </Link>
      </li>
    ))}
    </ul>
    </div>
    </Card>
    </div>
  )
}