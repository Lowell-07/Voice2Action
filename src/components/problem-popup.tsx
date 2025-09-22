
"use client";

import type { Problem } from "@/lib/definitions";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";
import { Badge } from "./ui/badge";

type ProblemPopupProps = {
    problem: Problem;
    voteOnProblem: (id: string, voteType: 'like' | 'dislike') => void;
};

export function ProblemPopup({ problem, voteOnProblem }: ProblemPopupProps) {
    return (
        <div className="w-64 font-body">
            <div className="relative w-full h-32 mb-2 rounded-t-lg overflow-hidden">
                <Image 
                    src={`https://picsum.photos/seed/${problem.media.images[0]}/600/400`}
                    alt={problem.title}
                    fill
                    className="object-cover"
                    data-ai-hint="issue image"
                />
                 <Badge className="absolute top-2 right-2" variant={problem.status === 'Resolved' ? 'default' : problem.status === 'In Progress' ? 'secondary' : 'destructive'}>
                    {problem.status === 'Pending' || problem.status === 'Awaiting Approval' ? 'New' : problem.status}
                </Badge>
            </div>
            <div className="p-3">
                <h3 className="font-headline font-bold text-lg mb-1 truncate">{problem.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2 h-10">{problem.description}</p>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => voteOnProblem(problem.id, 'like')}>
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            {problem.likes}
                        </Button>
                         <Button variant="outline" size="sm" onClick={() => voteOnProblem(problem.id, 'dislike')}>
                            <ThumbsDown className="w-4 h-4 mr-2" />
                            {problem.dislikes}
                        </Button>
                    </div>
                </div>
                <Button asChild className="w-full" size="sm">
                    <Link href={`/explore/issues/${problem.id}`}>
                        View Details
                    </Link>
                </Button>
            </div>
        </div>
    );
}
