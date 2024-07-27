interface PageProps {
  params: {username: string}
}

import React from 'react';

export default function page({params: username}: PageProps) {
  return (
    <div>page</div>
  )
}
