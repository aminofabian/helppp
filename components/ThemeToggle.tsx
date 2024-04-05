"use client"

import * as React from "react"
import { MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { setTheme } = useTheme()
  
  return (
    <DropdownMenu>
    <DropdownMenuTrigger asChild>
    <Button variant="outline" size="icon" className=" hover:scale-105 rounded-full  shadow-[-5px_-5px_10px_rgba(255,_255,_255,_0.8),_5px_5px_10px_rgba(0,_0,_0,_0.25)] transition-all hover:shadow-[-1px_-1px_5px_rgba(255,_255,_255,_0.6),_1px_1px_5px_rgba(0,_0,_0,_0.3),inset_-2px_-2px_5px_rgba(255,_255,_255,_1),inset_2px_2px_4px_rgba(0,_0,_0,_0.3)]
    hover:text-primary
    ">
    <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
    <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    <span className="sr-only">Toggle theme</span>
    </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => setTheme("light")}>
    Light
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setTheme("dark")}>
    Dark
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setTheme("system")}>
    System
    </DropdownMenuItem>
    </DropdownMenuContent>
    </DropdownMenu>
    )
  }
  