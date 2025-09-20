"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { mockProblems } from '@/lib/data';
import { ThumbsDown, ThumbsUp, MapPin, BadgePercent, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const mapImageData = PlaceHolderImages.find(img => img.id === 'map-india');
const mapProblems = mockProblems.slice(0, 3); // Show 3 sample problems on map

const problemPositions = [
  { top: '30%', left: '40%' },
  { top: '50%', left: '65%' },
  { top: '65%', left: '35%' },
];

export default function ExplorePage() {
    const { toast } = useToast();
    const [likes, setLikes] = useState(mapProblems.map(p => p.likes));

    const handleLike = (index: number) => {
        const newLikes = [...likes];
        newLikes[index]++;
        setLikes(newLikes);
    };

    const handleDislike = (index: number) => {
        const newLikes = [...likes];
        if (newLikes[index] > 0) {
            newLikes[index]--;
            setLikes(newLikes);
        }
    };
    
    const getDotColor = (likeCount: number) => {
        if (likeCount >= 3) return 'bg-red-500';
        if (likeCount === 2) return 'bg-orange-500';
        if (likeCount === 1) return 'bg-yellow-400';
        return 'bg-primary';
    };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2">
              Explore Reported Issues
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Use the interactive map to see what's happening in different areas. Click on a dot to view details about a reported problem.
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-2 md:p-4 relative">
              <div className="absolute top-4 left-4 z-10">
                <Button onClick={() => toast({ title: "Locating...", description: "Zooming into your current location." })}>
                  <MapPin className="mr-2 h-4 w-4" /> Use My GPS Location
                </Button>
              </div>
              
              <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden">
                {mapImageData && (
                  <Image
                    src={mapImageData.imageUrl}
                    alt={mapImageData.description}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={mapImageData.imageHint}
                  />
                )}
                {mapProblems.map((problem, index) => (
                   <Dialog key={problem.id}>
                    <DialogTrigger asChild>
                        <button 
                            className={`absolute w-5 h-5 rounded-full transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shadow-xl border-2 border-white animate-pulse ${getDotColor(likes[index])}`}
                            style={{ top: problemPositions[index].top, left: problemPositions[index].left }}
                            aria-label={`View problem: ${problem.title}`}
                        >
                            <span className="sr-only">{problem.title}</span>
                            <Badge className="absolute -top-5 -right-3 text-xs p-1" variant="destructive">{likes[index]}</Badge>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md w-full">
                      <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">{problem.title}</DialogTitle>
                        <Badge variant="outline" className="w-fit mt-2">{problem.department}</Badge>
                      </DialogHeader>
                        <div className="relative w-full h-48 my-4">
                            <Image src={`https://picsum.photos/seed/${problem.media.images[0]}/600/400`} alt={problem.title} layout="fill" objectFit="cover" className="rounded-lg" />
                        </div>
                      <p>{problem.description}</p>
                      <div className="flex justify-between items-center pt-4">
                        <div className="text-sm text-muted-foreground">
                            Reported by {problem.reportedBy.name}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleLike(index)}>
                                <ThumbsUp className="h-4 w-4 mr-2" />
                                Like ({likes[index]})
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDislike(index)}>
                                <ThumbsDown className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
               <div className="p-4 text-center text-muted-foreground text-sm">
                Interactive map powered by OpenLayers would be displayed here. The dots represent issues, with colors indicating popularity.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
