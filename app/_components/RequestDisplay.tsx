import React from 'react';
import prisma from "../lib/db";

import { RequestCard } from './RequestCard';
import Pagination from './Pagination';

async function getData(searchParam: string) {
  const [count, data] = await prisma.$transaction([
    prisma.request.count(),
    prisma.request.findMany({
      take: 10,
      skip: searchParam ? (Number(searchParam) - 1) * 10 : 0,
      select: {
        title: true,
        createdAt: true,
        updatedAt: true,
        textContent: true,
        deadline: true,
        id: true,
        imageString: true,
        pointsUsed: true,
        Vote: true,
        Comment: {
          select: {
            id: true,
            text: true,
          }
        },
        User: {
          select: {
            userName: true,
            id: true,
          },
        },
        communityName: true,
        amount: true,
      },
      orderBy: {
        createdAt: 'desc',
      }
    })
  ]);
  
  const currentDate = new Date();
  const filteredData = data.filter(request => request.deadline > currentDate);
  
  return { data: filteredData, count };
}

export async function ShowItems({ searchParams }: { searchParams: { page: string } }) {
  const { count, data } = await getData(searchParams.page);
  
  return (
    <div>
    {data.map((request: any) => (
      <RequestCard
      key={request.id}
      id={request.id}
      textContent={request.textContent}
      title={request.title}
      amount={request.amount}
      commentCount={request.Comment.length}
      jsonContent={request.textContent}
      imageString={request.imageString as string}
      createdAt={request.createdAt}
      updatedAt={request.updatedAt}
      deadline={request.deadline}
      userId={request.User?.id}
      userName={request.User?.userName as string}
      communityName={request.communityName as string}
      pointsUsed={request.pointsUsed}
      voteCount1={request.Vote.reduce((acc: number, vote: any) => {
        if (vote.voteType === "LOVE") return acc + 1;
        return acc;
      }, 0)}
      voteCount2={request.Vote.reduce((acc: number, vote: any) => {
        if (vote.voteType === "SUSPISION") return acc + 1;
        return acc;
      }, 0)}
      />
    ))}
    <Pagination totalPages={Math.ceil(count / 10)} />    
    </div>
  );
}
